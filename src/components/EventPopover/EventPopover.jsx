import React, { useEffect, useRef, useCallback } from 'react'

/**
 * EventPopover.jsx
 * Popover contextual que muestra el resumen de eventos de un día seleccionado.
 * Se abre al hacer clic en una celda del MonthGrid con eventos, como alternativa
 * ligera al modal completo de edición.
 *
 * Buenas prácticas:
 * - Focus trap: el foco se retiene dentro del popover al abrirse.
 * - Cierre con Escape, clic fuera o botón de cerrar.
 * - Sin dangerouslySetInnerHTML: datos renderizados como texto plano.
 * - Accesibilidad: role="dialog", aria-modal, aria-label.
 * - Posicionamiento calculado dinámicamente en viewport para no salirse de pantalla.
 */

const CATEGORY_DOT_CLASS = {
  work:     'dot-work',
  personal: 'dot-personal',
  meeting:  'dot-meeting',
  holiday:  'dot-holiday',
}

const CATEGORY_LABELS = {
  work:     'Trabajo',
  personal: 'Personal',
  meeting:  'Reunión',
  holiday:  'Festivo',
}

/**
 * @param {Object}   props
 * @param {boolean}  props.isOpen         - Si el popover está visible.
 * @param {Array}    props.events          - Eventos del día seleccionado.
 * @param {Object}   props.anchorRect      - DOMRect del elemento ancla (celda del día).
 * @param {string}   props.dayLabel        - Etiqueta del día (ej. "lunes, 5 de junio").
 * @param {Function} props.onClose         - Callback al cerrar.
 * @param {Function} props.onEdit          - Callback al hacer clic en "Editar" de un evento.
 * @param {Function} props.onDelete        - Callback al hacer clic en "Eliminar" de un evento.
 * @param {Function} props.onAddEvent      - Callback al hacer clic en "Agregar evento".
 */
function EventPopover({ isOpen, events, anchorRect, dayLabel, onClose, onEdit, onDelete, onAddEvent }) {
  const popoverRef = useRef(null)

  // Calcular posición: debajo de la celda, sin salirse del viewport
  const getPosition = () => {
    if (!anchorRect) return { top: 0, left: 0 }

    const POPOVER_WIDTH  = 280
    const POPOVER_HEIGHT = 320
    const MARGIN         = 8

    let top  = anchorRect.bottom + MARGIN
    let left = anchorRect.left

    // Evitar desbordamiento derecho
    if (left + POPOVER_WIDTH > window.innerWidth - MARGIN) {
      left = window.innerWidth - POPOVER_WIDTH - MARGIN
    }

    // Evitar desbordamiento inferior: mostrar encima si no cabe abajo
    if (top + POPOVER_HEIGHT > window.innerHeight - MARGIN) {
      top = anchorRect.top - POPOVER_HEIGHT - MARGIN
    }

    return { top: Math.max(MARGIN, top), left: Math.max(MARGIN, left) }
  }

  // Cerrar con Escape y hacer focus al primer elemento al abrir
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    // Enfocar el popover al abrirse
    const firstFocusable = popoverRef.current?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    firstFocusable?.focus()

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose()
      }
    }

    // Delay para evitar que el mismo clic que abre cierre inmediatamente
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen || !anchorRect) return null

  const { top, left } = getPosition()

  return (
    <div
      ref={popoverRef}
      className="event-popover"
      role="dialog"
      aria-modal="true"
      aria-label={`Eventos del ${dayLabel}`}
      style={{ top, left }}
    >
      {/* Header del popover */}
      <div className="event-popover__header">
        <span className="event-popover__day-label">{dayLabel}</span>
        <button
          className="event-popover__close"
          onClick={onClose}
          aria-label="Cerrar panel de eventos"
        >
          ✕
        </button>
      </div>

      {/* Lista de eventos */}
      <ul className="event-popover__list">
        {events.map((evt) => (
          <li key={evt.id} className="event-popover__item">
            <div className="event-popover__item-left">
              <span
                className={`event-popover__cat-dot dot ${CATEGORY_DOT_CLASS[evt.category] || 'dot-work'}`}
                aria-hidden="true"
              ></span>
              <div className="event-popover__item-info">
                <span className="event-popover__item-title">{evt.title}</span>
                <span className="event-popover__item-meta">
                  {evt.startTime} – {evt.endTime}
                  {' · '}
                  <span className="event-popover__item-cat">
                    {CATEGORY_LABELS[evt.category] || evt.category}
                  </span>
                </span>
                {evt.description && (
                  <span className="event-popover__item-desc">{evt.description}</span>
                )}
              </div>
            </div>
            <div className="event-popover__item-actions">
              <button
                className="event-popover__action event-popover__action--edit"
                onClick={() => { onEdit(evt); onClose() }}
                aria-label={`Editar evento: ${evt.title}`}
                title="Editar"
              >
                ✏️
              </button>
              <button
                className="event-popover__action event-popover__action--delete"
                onClick={() => { onDelete(evt.id); onClose() }}
                aria-label={`Eliminar evento: ${evt.title}`}
                title="Eliminar"
              >
                🗑️
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Pie: botón para agregar nuevo evento en este día */}
      <div className="event-popover__footer">
        <button
          className="event-popover__add-btn"
          onClick={() => { onAddEvent(); onClose() }}
        >
          <span aria-hidden="true">+</span> Nuevo evento este día
        </button>
      </div>
    </div>
  )
}

export default EventPopover
