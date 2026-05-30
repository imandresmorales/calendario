import React, { useState, useEffect, useRef, useCallback } from 'react'
import { validateEventTitle, validateEventDescription, validateTimeRange } from '../../utils/sanitize'

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
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [category, setCategory] = useState('work')
  const [errors, setErrors] = useState({})

  const modalRef = useRef(null)
  const titleInputRef = useRef(null)

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
            {errors.title && (
              <span className="event-modal__error" role="alert">{errors.title}</span>
            )}
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
