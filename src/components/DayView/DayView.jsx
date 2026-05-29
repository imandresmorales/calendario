import React, { useMemo } from 'react'
import { useCalendar } from '../../context/CalendarContext'
import { formatFullDate } from '../../utils/dateUtils'

/**
 * DayView.jsx
 * Vista detallada del día seleccionado con un timeline de 24 horas.
 *
 * Características:
 * - Muestra las 24 franjas horarias del día seleccionado.
 * - Indicador visual de la hora actual si es el día de hoy.
 * - Preparado para posicionar eventos en las franjas horarias correspondientes.
 * - Accesibilidad con etiquetas ARIA descriptivas.
 */
function DayView() {
  const { selectedDate } = useCalendar()

  const formattedDate = useMemo(
    () => formatFullDate(selectedDate.year, selectedDate.month, selectedDate.day),
    [selectedDate.year, selectedDate.month, selectedDate.day]
  )

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

  return (
    <div className="day-view" role="region" aria-label={`Vista de día: ${formattedDate}`}>
      <div className="day-view__header">
        <h3 className="day-view__title">{formattedDate}</h3>
      </div>

      <div className="day-view__timeline">
        {hours.map(({ hour, label }) => (
          <div
            key={hour}
            className={`day-view__slot ${isCurrentHour(hour) ? 'day-view__slot--current' : ''}`}
            role="row"
            aria-label={`Franja horaria ${label}`}
          >
            <span className="day-view__time-label">{label}</span>
            <div className="day-view__slot-content">
              {isCurrentHour(hour) && (
                <div className="day-view__now-indicator" aria-label="Hora actual">
                  <span className="day-view__now-dot" aria-hidden="true"></span>
                  <span className="day-view__now-line" aria-hidden="true"></span>
                </div>
              )}
              {/* Espacio reservado para eventos posicionados */}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default React.memo(DayView)
