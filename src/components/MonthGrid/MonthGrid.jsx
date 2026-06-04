import React, { useMemo, useState, useCallback } from 'react'
import { useCalendar } from '../../context/CalendarContext'
import { getCalendarGridDays, getWeekdayNames, isSameDay, getMonthNames } from '../../utils/dateUtils'

/**
 * MonthGrid.jsx
 * Componente que renderiza la cuadrícula de días del mes activo.
 *
 * Características:
 * - Cuadrícula de 6 filas × 7 columnas (42 celdas) generada por dateUtils.
 * - Días del mes anterior/siguiente se muestran con opacidad reducida.
 * - Día actual resaltado con indicador visual de acento.
 * - Día seleccionado con borde brillante interactivo.
 * - Indicadores de color (dots) cuando un día tiene eventos.
 * - Tooltip personalizado con resumen de eventos al hacer hover.
 * - Memoización con useMemo para evitar recalcular la cuadrícula innecesariamente.
 * - Atributos ARIA para accesibilidad de lectores de pantalla.
 */

/** Mapa de categoría a clase CSS para los dots de eventos */
const CATEGORY_DOT_CLASS = {
  work: 'dot-work',
  personal: 'dot-personal',
  meeting: 'dot-meeting',
  holiday: 'dot-holiday',
}

/** Etiquetas de categoría en español */
const CATEGORY_LABELS = {
  work: 'Trabajo',
  personal: 'Personal',
  meeting: 'Reunión',
  holiday: 'Festivo',
}

function MonthGrid() {
  const { viewDate, selectedDate, selectDate, filteredEvents, events } = useCalendar()

  // Estado del tooltip: { visible, dayKey, events, x, y }
  const [tooltip, setTooltip] = useState({ visible: false, dayKey: null, items: [], x: 0, y: 0 })

  const weekdays = useMemo(() => getWeekdayNames('es-ES', 'short'), [])
  const monthNames = useMemo(() => getMonthNames(), [])

  const gridDays = useMemo(
    () => getCalendarGridDays(viewDate.year, viewDate.month),
    [viewDate.year, viewDate.month]
  )

  /**
   * Mapa de "año-mes-día" → lista de eventos (para dots y tooltip).
   * Usa todos los eventos sin filtrar para el tooltip, pero filteredEvents para los dots visibles.
   */
  const eventsPerDayMap = useMemo(() => {
    const map = {}
    for (const evt of events) {
      const key = `${evt.year}-${evt.month}-${evt.day}`
      if (!map[key]) map[key] = []
      map[key].push(evt)
    }
    return map
  }, [events])

  const eventDotsMap = useMemo(() => {
    const map = {}
    for (const evt of filteredEvents) {
      const key = `${evt.year}-${evt.month}-${evt.day}`
      if (!map[key]) map[key] = new Set()
      map[key].add(evt.category)
    }
    return map
  }, [filteredEvents])

  const handleDayClick = useCallback((dayObj) => {
    selectDate(dayObj.year, dayObj.month, dayObj.day)
  }, [selectDate])

  const handleDayMouseEnter = useCallback((dayObj, e) => {
    const key = `${dayObj.year}-${dayObj.month}-${dayObj.day}`
    const items = eventsPerDayMap[key] || []
    if (items.length === 0) return

    const rect = e.currentTarget.getBoundingClientRect()
    // Posicionar tooltip por encima del día
    setTooltip({
      visible: true,
      dayKey: key,
      items,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    })
  }, [eventsPerDayMap])

  const handleDayMouseLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }))
  }, [])

  const getDayClasses = useCallback((dayObj) => {
    const classes = ['month-grid__day']
    if (!dayObj.isCurrentMonth) classes.push('month-grid__day--filler')
    if (dayObj.isToday) classes.push('month-grid__day--today')
    if (isSameDay(dayObj, selectedDate)) classes.push('month-grid__day--selected')
    return classes.join(' ')
  }, [selectedDate])

  const getEventDots = useCallback((dayObj) => {
    const key = `${dayObj.year}-${dayObj.month}-${dayObj.day}`
    const categories = eventDotsMap[key]
    if (!categories) return null

    const dotArray = Array.from(categories).slice(0, 3)
    return (
      <div className="month-grid__event-dots" aria-hidden="true">
        {dotArray.map((cat, i) => (
          <span key={i} className={`month-grid__event-dot ${CATEGORY_DOT_CLASS[cat] || 'dot-work'}`}></span>
        ))}
      </div>
    )
  }, [eventDotsMap])

  return (
    <>
      <div className="month-grid" role="grid" aria-label="Calendario mensual">
        {/* Fila de encabezados de días de la semana */}
        <div className="month-grid__weekdays" role="row">
          {weekdays.map((name, index) => (
            <div
              key={index}
              className="month-grid__weekday-name"
              role="columnheader"
              aria-label={name}
            >
              {name}
            </div>
          ))}
        </div>

        {/* Cuadrícula de días */}
        <div className="month-grid__days" role="rowgroup">
          {gridDays.map((dayObj, index) => {
            const key = `${dayObj.year}-${dayObj.month}-${dayObj.day}`
            const dayEventCount = (eventsPerDayMap[key] || []).length
            const ariaLabel = dayEventCount > 0
              ? `${dayObj.day} de ${monthNames[dayObj.month]}, ${dayEventCount} ${dayEventCount === 1 ? 'evento' : 'eventos'}`
              : `${dayObj.day} de ${monthNames[dayObj.month]}`

            return (
              <button
                key={index}
                className={getDayClasses(dayObj)}
                role="gridcell"
                aria-label={ariaLabel}
                aria-selected={isSameDay(dayObj, selectedDate)}
                tabIndex={dayObj.isCurrentMonth ? 0 : -1}
                onClick={() => handleDayClick(dayObj)}
                onMouseEnter={(e) => handleDayMouseEnter(dayObj, e)}
                onMouseLeave={handleDayMouseLeave}
              >
                <span className="month-grid__day-number">{dayObj.day}</span>
                {dayObj.isToday && (
                  <span className="month-grid__today-dot" aria-hidden="true"></span>
                )}
                {getEventDots(dayObj)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tooltip personalizado con resumen de eventos */}
      {tooltip.visible && tooltip.items.length > 0 && (
        <div
          className="day-tooltip"
          role="tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
          aria-hidden="true"
        >
          <div className="day-tooltip__title">
            {tooltip.items.length} {tooltip.items.length === 1 ? 'evento' : 'eventos'}
          </div>
          <ul className="day-tooltip__list">
            {tooltip.items.slice(0, 5).map((evt) => (
              <li key={evt.id} className="day-tooltip__item">
                <span className={`day-tooltip__dot ${CATEGORY_DOT_CLASS[evt.category] || 'dot-work'}`}></span>
                <span className="day-tooltip__time">{evt.startTime}</span>
                <span className="day-tooltip__event-title">{evt.title}</span>
              </li>
            ))}
            {tooltip.items.length > 5 && (
              <li className="day-tooltip__more">+{tooltip.items.length - 5} más</li>
            )}
          </ul>
        </div>
      )}
    </>
  )
}

export default React.memo(MonthGrid)

