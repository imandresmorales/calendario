import React, { useMemo, useEffect, useRef } from 'react'
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
 * - Accesibilidad con etiquetas ARIA descriptivas.
 * - Mejora 40: Scroll automático a la hora actual al abrir la vista.
 *
 * Seguridad:
 * - Solo muestra datos ya sanitizados por el módulo sanitize.js.
 * - No usa dangerouslySetInnerHTML.
 */

/** Mapa de categoría a clase CSS para el borde de color */
const CATEGORY_BORDER_CLASS = {
  work:     'var(--color-work)',
  personal: 'var(--color-personal)',
  meeting:  'var(--color-meeting)',
  holiday:  'var(--color-holiday)',
}

function DayView() {
  const { selectedDate, getEventsForDay } = useCalendar()

  /** Ref al contenedor del timeline para controlar el scroll */
  const timelineRef = useRef(null)
  /** Ref a la franja de la hora actual para hacer scrollIntoView */
  const currentHourRef = useRef(null)

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
   * Cada franja muestra la hora en formato HH:00.
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
   * Parsea la hora de inicio (HH:MM) para comparar con la franja.
   */
  const getEventsForHour = (hour) => {
    return dayEvents.filter((evt) => {
      const startHour = parseInt(evt.startTime.split(':')[0], 10)
      return startHour === hour
    })
  }

  /**
   * Mejora 40: Scroll automático a la hora actual.
   * Cuando la vista es el día de hoy, hace scroll suave al slot de la hora actual
   * con un offset para mostrar contexto por encima.
   * Solo se ejecuta al montar el componente o al cambiar el día seleccionado.
   */
  useEffect(() => {
    if (!currentHourRef.current) return

    // Pequeño delay para que el layout esté pintado
    const timer = setTimeout(() => {
      currentHourRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 120)

    return () => clearTimeout(timer)
  }, [selectedDate.year, selectedDate.month, selectedDate.day])

  return (
    <div className="day-view" role="region" aria-label={`Vista de día: ${formattedDate}`}>
      <div className="day-view__header">
        <h3 className="day-view__title">{formattedDate}</h3>
        <span className="day-view__event-count">
          {dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventos'}
        </span>
      </div>

      <div ref={timelineRef} className="day-view__timeline">
        {hours.map(({ hour, label }) => {
          const hourEvents = getEventsForHour(hour)
          const isCurrent = isCurrentHour(hour)

          return (
            <div
              key={hour}
              ref={isCurrent ? currentHourRef : null}
              className={`day-view__slot ${isCurrent ? 'day-view__slot--current' : ''}`}
              role="row"
              aria-label={`Franja horaria ${label}`}
            >
              <span className="day-view__time-label">{label}</span>
              <div className="day-view__slot-content">
                {isCurrent && (
                  <div className="day-view__now-indicator" aria-label="Hora actual">
                    <span className="day-view__now-dot" aria-hidden="true"></span>
                    <span className="day-view__now-line" aria-hidden="true"></span>
                  </div>
                )}

                {/* Eventos posicionados en esta franja */}
                {hourEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="day-view__event-block"
                    style={{ borderLeftColor: CATEGORY_BORDER_CLASS[evt.category] || 'var(--accent)' }}
                    role="article"
                    aria-label={`Evento: ${evt.title} de ${evt.startTime} a ${evt.endTime}`}
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
