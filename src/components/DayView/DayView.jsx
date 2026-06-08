import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react'
import { useCalendar } from '../../context/CalendarContext'
import { formatFullDate } from '../../utils/dateUtils'

/**
 * DayView.jsx
 * Vista detallada del día seleccionado con un timeline de 24 horas.
 *
 * Características:
 * - Muestra las 24 franjas horarias del día seleccionado.
 * - Indicador visual de la hora actual si es el día de hoy.
 * - Renderiza los eventos reales del día en la franja horaria correspondiente.
 * - Mejora 40: Scroll automático a la hora actual al abrir la vista.
 * - Mejora 45: Drag-and-drop nativo para reprogramar eventos a otra franja horaria.
 *
 * Seguridad:
 * - Solo muestra datos ya sanitizados por el módulo sanitize.js.
 * - No usa dangerouslySetInnerHTML.
 * - El ID del evento se transfiere por dataTransfer.setData como texto plano.
 * - No se evalúa ningún dato del dataTransfer antes de validar el evento.
 */

/** Mapa de categoría a color CSS para el borde de color */
const CATEGORY_BORDER_CLASS = {
  work:     'var(--color-work)',
  personal: 'var(--color-personal)',
  meeting:  'var(--color-meeting)',
  holiday:  'var(--color-holiday)',
}

function DayView() {
  const { selectedDate, getEventsForDay, updateEvent } = useCalendar()

  /** Ref al contenedor del timeline para controlar el scroll */
  const timelineRef    = useRef(null)
  /** Ref a la franja de la hora actual para hacer scrollIntoView */
  const currentHourRef = useRef(null)

  /**
   * Mejora 45: Estado del drag-and-drop.
   * dragOverHour: la franja horaria sobre la que está el cursor (para highlight).
   * draggingId:   el id del evento que se está arrastrando.
   */
  const [dragOverHour, setDragOverHour] = useState(null)
  const [draggingId,   setDraggingId]   = useState(null)

  const formattedDate = useMemo(
    () => formatFullDate(selectedDate.year, selectedDate.month, selectedDate.day),
    [selectedDate.year, selectedDate.month, selectedDate.day]
  )

  /** Eventos del día seleccionado, ordenados por hora de inicio */
  const dayEvents = useMemo(() => {
    const events = getEventsForDay(selectedDate.year, selectedDate.month, selectedDate.day)
    return events.sort((a, b) => a.startTime.localeCompare(b.startTime))
  }, [selectedDate, getEventsForDay])

  /**
   * Genera las 24 franjas horarias del día.
   */
  const hours = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const label = i.toString().padStart(2, '0') + ':00'
      return { hour: i, label }
    })
  }, [])

  /**
   * Determina si una hora dada es la hora actual del día de hoy.
   */
  const isCurrentHour = (hour) => {
    const now = new Date()
    return (
      selectedDate.year === now.getFullYear() &&
      selectedDate.month === now.getMonth() &&
      selectedDate.day === now.getDate() &&
      hour === now.getHours()
    )
  }

  /**
   * Obtiene los eventos que comienzan en una hora específica.
   */
  const getEventsForHour = (hour) => {
    return dayEvents.filter((evt) => {
      const startHour = parseInt(evt.startTime.split(':')[0], 10)
      return startHour === hour
    })
  }

  /**
   * Mejora 40: Scroll automático a la hora actual al montar.
   */
  useEffect(() => {
    if (!currentHourRef.current) return
    const timer = setTimeout(() => {
      currentHourRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 120)
    return () => clearTimeout(timer)
  }, [selectedDate.year, selectedDate.month, selectedDate.day])

  /* ─── Mejora 45: Drag-and-Drop Handlers ──────────────────────────────── */

  /**
   * Al comenzar a arrastrar un evento, guarda su ID en el dataTransfer.
   * Solo se transfiere texto plano (el ID), sin datos sensibles.
   */
  const handleDragStart = useCallback((e, evt) => {
    // Transferir solo el ID como string (whitelist implícita: UUID del evento)
    e.dataTransfer.setData('text/plain', evt.id)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingId(evt.id)
  }, [])

  /** Al soltar el evento sobre una franja, actualiza la hora de inicio/fin. */
  const handleDrop = useCallback((e, targetHour) => {
    e.preventDefault()
    const eventId = e.dataTransfer.getData('text/plain')

    // Validar que el ID corresponde a un evento real (no ejecutar datos arbitrarios)
    const draggedEvent = dayEvents.find((ev) => ev.id === eventId)
    if (!draggedEvent) {
      setDragOverHour(null)
      setDraggingId(null)
      return
    }

    // Calcular la duración original para mantenerla al mover
    const [startH, startM] = draggedEvent.startTime.split(':').map(Number)
    const [endH,   endM]   = draggedEvent.endTime.split(':').map(Number)
    const durationMinutes  = (endH * 60 + endM) - (startH * 60 + startM)

    // Nueva hora de inicio: la franja destino con los mismos minutos
    const newStartMinutes = targetHour * 60 + startM
    const newEndMinutes   = Math.min(newStartMinutes + durationMinutes, 23 * 60 + 59)

    const pad     = (n) => String(n).padStart(2, '0')
    const newStart = `${pad(Math.floor(newStartMinutes / 60))}:${pad(newStartMinutes % 60)}`
    const newEnd   = `${pad(Math.floor(newEndMinutes / 60))}:${pad(newEndMinutes % 60)}`

    // Solo actualizar si la hora cambió (evita escrituras innecesarias)
    if (newStart !== draggedEvent.startTime) {
      updateEvent({ ...draggedEvent, startTime: newStart, endTime: newEnd })
    }

    setDragOverHour(null)
    setDraggingId(null)
  }, [dayEvents, updateEvent])

  const handleDragEnd = useCallback(() => {
    setDragOverHour(null)
    setDraggingId(null)
  }, [])

  return (
    <div className="day-view" role="region" aria-label={`Vista de día: ${formattedDate}`}>
      <div className="day-view__header">
        <h3 className="day-view__title">{formattedDate}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="day-view__event-count">
            {dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventos'}
          </span>
          {/* Hint de drag solo si hay eventos */}
          {dayEvents.length > 0 && (
            <span className="day-view__drag-hint" aria-hidden="true">
              ↕ Arrastra para reprogramar
            </span>
          )}
        </div>
      </div>

      <div ref={timelineRef} className="day-view__timeline">
        {hours.map(({ hour, label }) => {
          const hourEvents = getEventsForHour(hour)
          const isCurrent  = isCurrentHour(hour)
          const isDragOver = dragOverHour === hour && draggingId !== null

          return (
            <div
              key={hour}
              ref={isCurrent ? currentHourRef : null}
              className={`day-view__slot ${isCurrent ? 'day-view__slot--current' : ''} ${isDragOver ? 'day-view__slot--drag-over' : ''}`}
              role="row"
              aria-label={`Franja horaria ${label}`}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                setDragOverHour(hour)
              }}
              onDragLeave={() => setDragOverHour(null)}
              onDrop={(e) => handleDrop(e, hour)}
            >
              <span className="day-view__time-label">{label}</span>
              <div className="day-view__slot-content">
                {isCurrent && (
                  <div className="day-view__now-indicator" aria-label="Hora actual">
                    <span className="day-view__now-dot" aria-hidden="true"></span>
                    <span className="day-view__now-line" aria-hidden="true"></span>
                  </div>
                )}

                {/* Eventos arrastables (Mejora 45) */}
                {hourEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className={`day-view__event-block ${draggingId === evt.id ? 'day-view__event-block--dragging' : ''}`}
                    style={{ borderLeftColor: CATEGORY_BORDER_CLASS[evt.category] || 'var(--accent)' }}
                    role="article"
                    aria-label={`Evento: ${evt.title} de ${evt.startTime} a ${evt.endTime}`}
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, evt)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="day-view__event-time">
                      {evt.startTime} – {evt.endTime}
                    </div>
                    <div className="day-view__event-title">{evt.title}</div>
                    {evt.description && (
                      <div className="day-view__event-desc">{evt.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default React.memo(DayView)
