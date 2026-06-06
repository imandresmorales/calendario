import React, { useMemo } from 'react'
import { useCalendar } from '../../context/CalendarContext'
import { getMonthNames, getWeekdayName, getDaysInMonth } from '../../utils/dateUtils'
import EmptyState from '../EmptyState/EmptyState'

/**
 * AgendaView.jsx
 * Vista de agenda que muestra los próximos 30 días con sus eventos
 * en formato cronológico tipo feed/lista.
 *
 * Características:
 * - Muestra los próximos 30 días a partir de la fecha seleccionada.
 * - Agrupa visualmente por mes con separadores.
 * - Muestra los eventos reales de cada día con indicador de categoría.
 * - Diferencia el día actual con acento visual y badge "Hoy".
 * - Clic en un día lo selecciona y navega a la vista de Día.
 *
 * Seguridad:
 * - Solo renderiza datos previamente sanitizados por sanitize.js.
 * - No usa dangerouslySetInnerHTML.
 */

/** Mapa de categoría a clase CSS del dot de color */
const CATEGORY_DOT = {
  work: 'dot-work',
  personal: 'dot-personal',
  meeting: 'dot-meeting',
  holiday: 'dot-holiday',
}

function AgendaView() {
  const { selectedDate, selectDate, setActiveView, getEventsForDay } = useCalendar()

  const monthNames = useMemo(() => getMonthNames(), [])

  /**
   * Genera la lista de los próximos 30 días a partir de la fecha seleccionada.
   * Cada entrada contiene: año, mes, día, si es hoy, nombre del día de semana.
   */
  const upcomingDays = useMemo(() => {
    const today = new Date()
    const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`

    const days = []
    let year = selectedDate.year
    let month = selectedDate.month
    let day = selectedDate.day

    for (let i = 0; i < 30; i++) {
      const daysInCurrentMonth = getDaysInMonth(year, month)

      if (day > daysInCurrentMonth) {
        day = 1
        month += 1
        if (month > 11) {
          month = 0
          year += 1
        }
      }

      const dateKey = `${year}-${month}-${day}`
      const weekday = getWeekdayName(year, month, day)

      days.push({
        year,
        month,
        day,
        weekday,
        isToday: dateKey === todayKey,
        monthLabel: monthNames[month],
      })

      day += 1
    }

    return days
  }, [selectedDate, monthNames])

  /**
   * Al hacer clic en un día, lo selecciona y cambia a vista de Día.
   */
  const handleDayClick = (dayObj) => {
    selectDate(dayObj.year, dayObj.month, dayObj.day)
    setActiveView('day')
  }

  /**
   * Agrupa los días por mes para mostrar separadores visuales.
   */
  const groupedByMonth = useMemo(() => {
    const groups = []
    let currentGroup = null

    for (const dayObj of upcomingDays) {
      const key = `${dayObj.year}-${dayObj.month}`
      if (!currentGroup || currentGroup.key !== key) {
        currentGroup = {
          key,
          label: `${dayObj.monthLabel} ${dayObj.year}`,
          days: [],
        }
        groups.push(currentGroup)
      }
      currentGroup.days.push(dayObj)
    }

    return groups
  }, [upcomingDays])

  // Verificar si hay algún evento en los próximos 30 días
  const hasAnyEvent = useMemo(() => {
    return upcomingDays.some(
      (d) => getEventsForDay(d.year, d.month, d.day).length > 0
    )
  }, [upcomingDays, getEventsForDay])

  return (
    <div className="agenda-view" role="region" aria-label="Vista de agenda">
      {!hasAnyEvent ? (
        <EmptyState
          title="Sin eventos próximos"
          description="No hay eventos en los próximos 30 días. ¡Agrega uno para empezar!"
        />
      ) : (
        groupedByMonth.map((group) => (
          <div key={group.key} className="agenda-view__group">
            <h3 className="agenda-view__month-header">{group.label}</h3>

            {group.days.map((dayObj, index) => {
              const dayEvents = getEventsForDay(dayObj.year, dayObj.month, dayObj.day)
                .sort((a, b) => a.startTime.localeCompare(b.startTime))

              return (
                <button
                  key={index}
                  className={`agenda-view__day-row ${dayObj.isToday ? 'agenda-view__day-row--today' : ''} ${dayEvents.length > 0 ? 'agenda-view__day-row--has-events' : ''}`}
                  onClick={() => handleDayClick(dayObj)}
                  aria-label={`${dayObj.weekday} ${dayObj.day} de ${dayObj.monthLabel}${dayEvents.length > 0 ? `, ${dayEvents.length} eventos` : ''}`}
                >
                  <div className="agenda-view__date-block">
                    <span className="agenda-view__day-number">{dayObj.day}</span>
                    <span className="agenda-view__weekday">{dayObj.weekday}</span>
                  </div>

                  <div className="agenda-view__events-area">
                    {dayEvents.length > 0 ? (
                      <div className="agenda-view__event-list">
                        {dayEvents.map((evt) => (
                          <div key={evt.id} className="agenda-view__event-item">
                            <span className={`dot ${CATEGORY_DOT[evt.category] || 'dot-work'}`} aria-hidden="true"></span>
                            <span className="agenda-view__event-time">{evt.startTime}</span>
                            <span className="agenda-view__event-title">{evt.title}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="agenda-view__no-events">Sin eventos</span>
                    )}
                  </div>

                  {dayObj.isToday && (
                    <span className="agenda-view__today-badge">Hoy</span>
                  )}
                </button>
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}

export default React.memo(AgendaView)
