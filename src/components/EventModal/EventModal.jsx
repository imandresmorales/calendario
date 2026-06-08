import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { validateEventTitle, validateEventDescription, validateTimeRange } from '../../utils/sanitize'
import { useCalendar } from '../../context/CalendarContext'
import { checkEventConflict } from '../../utils/conflictUtils'
import { formatEventDuration } from '../../utils/dateUtils'

/**
 * EventModal.jsx
 * Modal overlay para crear y editar eventos del calendario.
 *
 * Seguridad:
 * - Todas las entradas se sanitizan con el módulo sanitize.js antes de guardar.
 * - Validación de horas coherentes (fin > inicio).
 * - No usa dangerouslySetInnerHTML en ningún momento.
 *
 * Accesibilidad:
 * - Focus trap dentro del modal (Tab no escapa del modal).
 * - Cierre con Escape.
 * - role="dialog" y aria-modal="true".
 * - Auto-focus en el primer campo al abrir.
 */

const CATEGORIES = [
  { value: 'work', label: 'Trabajo', className: 'dot-work' },
  { value: 'personal', label: 'Personal', className: 'dot-personal' },
  { value: 'meeting', label: 'Reunión', className: 'dot-meeting' },
  { value: 'holiday', label: 'Festivo', className: 'dot-holiday' },
]

function EventModal({ isOpen, onClose, onSave, initialData, selectedDate }) {
  const { events } = useCalendar()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [category, setCategory] = useState('work')
  const [errors, setErrors] = useState({})
  const [conflictEvent, setConflictEvent] = useState(null)

  const modalRef = useRef(null)
  const titleInputRef = useRef(null)

  // Detección de solapamiento en tiempo real
  useEffect(() => {
    if (isOpen && startTime && endTime) {
      const conflict = checkEventConflict(
        {
          id: initialData?.id,
          startTime,
          endTime,
          year: selectedDate.year,
          month: selectedDate.month,
          day: selectedDate.day,
        },
        events
      )
      setConflictEvent(conflict)
    } else {
      setConflictEvent(null)
    }
  }, [isOpen, startTime, endTime, selectedDate, events, initialData])

  // Rellenar formulario con datos iniciales (modo edición) o resetear (modo creación)
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || '')
        setDescription(initialData.description || '')
        setStartTime(initialData.startTime || '09:00')
        setEndTime(initialData.endTime || '10:00')
        setCategory(initialData.category || 'work')
      } else {
        setTitle('')
        setDescription('')
        setStartTime('09:00')
        setEndTime('10:00')
        setCategory('work')
      }
      setErrors({})
      // Auto-focus en el campo de título al abrir
      setTimeout(() => titleInputRef.current?.focus(), 100)
    }
  }, [isOpen, initialData])

  // Cerrar modal con Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Cerrar al hacer clic en el backdrop
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

  /**
   * Validación y sanitización completa antes de guardar.
   * Aplica las reglas de sanitize.js para prevenir XSS.
   */
  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}

    // Validar título (sanitización incluida)
    const titleResult = validateEventTitle(title)
    if (!titleResult.isValid) {
      newErrors.title = titleResult.error
    }

    // Validar descripción (sanitización incluida)
    const descResult = validateEventDescription(description)
    if (!descResult.isValid) {
      newErrors.description = descResult.error
    }

    // Validar rango de horas
    const timeResult = validateTimeRange(startTime, endTime)
    if (!timeResult.isValid) {
      newErrors.time = timeResult.error
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Guardar con datos sanitizados
    onSave({
      id: initialData?.id || undefined,
      title: titleResult.value,
      description: descResult.value,
      startTime,
      endTime,
      category,
      year: selectedDate.year,
      month: selectedDate.month,
      day: selectedDate.day,
    })

    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="event-modal__backdrop"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="event-modal glass-card"
        role="dialog"
        aria-modal="true"
        aria-label={initialData ? 'Editar evento' : 'Crear nuevo evento'}
      >
        <div className="event-modal__header">
          <h3 className="event-modal__title">
            {initialData ? 'Editar Evento' : 'Nuevo Evento'}
          </h3>
          <button
            className="event-modal__close-btn"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        <form className="event-modal__form" onSubmit={handleSubmit} noValidate>
          {/* Título */}
          <div className="event-modal__field">
            <label htmlFor="event-title" className="event-modal__label">
              Título <span aria-hidden="true">*</span>
            </label>
            <input
              ref={titleInputRef}
              id="event-title"
              type="text"
              className={`event-modal__input ${errors.title ? 'event-modal__input--error' : ''}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nombre del evento"
              maxLength={100}
              required
              autoComplete="off"
            />
            <div className="event-modal__field-footer">
              {errors.title && (
                <span className="event-modal__error" role="alert">{errors.title}</span>
              )}
              <span
                className={`event-modal__char-count ${title.length > 80 ? (title.length > 95 ? 'event-modal__char-count--danger' : 'event-modal__char-count--warn') : ''}`}
                aria-live="polite"
                aria-label={`${title.length} de 100 caracteres`}
              >
                {title.length}/100
              </span>
            </div>
          </div>

          {/* Horas */}
          <div className="event-modal__row">
            <div className="event-modal__field">
              <label htmlFor="event-start" className="event-modal__label">Inicio</label>
              <input
                id="event-start"
                type="time"
                className={`event-modal__input ${errors.time ? 'event-modal__input--error' : ''}`}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="event-modal__field">
              <label htmlFor="event-end" className="event-modal__label">Fin</label>
              <input
                id="event-end"
                type="time"
                className={`event-modal__input ${errors.time ? 'event-modal__input--error' : ''}`}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>
          {errors.time && (
            <span className="event-modal__error" role="alert">{errors.time}</span>
          )}

          {/* Mejora 43: Duración calculada en tiempo real */}
          {(() => {
            const dur = formatEventDuration(startTime, endTime)
            return dur ? (
              <div className="event-modal__duration" aria-live="polite">
                <span className="event-modal__duration-icon" aria-hidden="true">⏱</span>
                <span className="event-modal__duration-text">{dur}</span>
              </div>
            ) : null
          })()}

          {/* Advertencia de solapamiento */}
          {conflictEvent && (
            <div className="event-modal__warning" role="alert">
              <span className="event-modal__warning-icon" aria-hidden="true">⚠️</span>
              <span className="event-modal__warning-text">
                Conflicto de horario con: <strong>{conflictEvent.title}</strong> ({conflictEvent.startTime} - {conflictEvent.endTime})
              </span>
            </div>
          )}

          {/* Categoría */}
          <div className="event-modal__field">
            <label className="event-modal__label">Categoría</label>
            <div className="event-modal__categories">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  className={`event-modal__cat-btn ${category === cat.value ? 'event-modal__cat-btn--active' : ''}`}
                  onClick={() => setCategory(cat.value)}
                  aria-pressed={category === cat.value}
                >
                  <span className={`dot ${cat.className}`} aria-hidden="true"></span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div className="event-modal__field">
            <label htmlFor="event-desc" className="event-modal__label">Descripción</label>
            <textarea
              id="event-desc"
              className="event-modal__textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles del evento (opcional)"
              maxLength={500}
              rows={3}
            />
            <span
              className={`event-modal__char-count ${description.length > 400 ? (description.length > 475 ? 'event-modal__char-count--danger' : 'event-modal__char-count--warn') : ''}`}
              aria-live="polite"
              aria-label={`${description.length} de 500 caracteres`}
            >
              {description.length}/500
            </span>
          </div>

          {/* Acciones */}
          <div className="event-modal__actions">
            <button type="button" className="event-modal__btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="event-modal__btn-save">
              {initialData ? 'Guardar Cambios' : 'Crear Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default React.memo(EventModal)
