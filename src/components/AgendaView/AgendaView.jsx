import React, { useMemo } from 'react'
import { useCalendar } from '../../context/CalendarContext'
import { getMonthNames, getWeekdayName, getDaysInMonth } from '../../utils/dateUtils'

/**
 * AgendaView.jsx
 * Vista de agenda que muestra los próximos 30 días con sus franjas
 * en formato cronológico tipo feed/lista.
 *
 * Características:
 * - Muestra los próximos 30 días a partir de la fecha seleccionada.
 * - Agrupa visualmente por mes con separadores.
 * - Diferencia el día actual con acento visual.
 * - Preparado para listar eventos dentro de cada día.
 * - Clic en un día lo selecciona y permite navegar a la vista de Día.
 */
function AgendaView() {
  const { selectedDate, selectDate, setActiveView } = useCalendar()

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

  return (
    <div className="agenda-view" role="region" aria-label="Vista de agenda">
      {groupedByMonth.map((group) => (
        <div key={group.key} className="agenda-view__group">
          <h3 className="agenda-view__month-header">{group.label}</h3>

          {group.days.map((dayObj, index) => (
            <button
              key={index}
              className={`agenda-view__day-row ${dayObj.isToday ? 'agenda-view__day-row--today' : ''}`}
              onClick={() => handleDayClick(dayObj)}
              aria-label={`${dayObj.weekday} ${dayObj.day} de ${dayObj.monthLabel}`}
            >
              <div className="agenda-view__date-block">
                <span className="agenda-view__day-number">{dayObj.day}</span>
                <span className="agenda-view__weekday">{dayObj.weekday}</span>
              </div>

              <div className="agenda-view__events-area">
                <span className="agenda-view__no-events">Sin eventos programados</span>
              </div>

              {dayObj.isToday && (
                <span className="agenda-view__today-badge">Hoy</span>
              )}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

export default React.memo(AgendaView)
