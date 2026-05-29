import React, { useMemo } from 'react'
import { useCalendar } from '../../context/CalendarContext'
import {
  getMonthNames,
  getWeekdayNames,
  getCalendarGridDays,
  isSameDay,
} from '../../utils/dateUtils'

/**
 * YearView.jsx
 * Vista compacta que muestra los 12 meses del año en una cuadrícula.
 *
 * Características:
 * - Muestra mini-calendarios de cada mes en un grid responsivo.
 * - Clic en un mes cambia la vista a "month" y navega a ese mes.
 * - Indica visualmente el mes actual y el día de hoy.
 * - Memoización para evitar recálculos innecesarios.
 */
function YearView() {
  const { viewDate, selectedDate, selectDate, setActiveView } = useCalendar()

  const monthNames = useMemo(() => getMonthNames(), [])
  const weekdays = useMemo(() => getWeekdayNames('es-ES', 'narrow'), [])

  const today = useMemo(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() }
  }, [])

  /**
   * Al hacer clic en un mes, selecciona el día 1 de ese mes y cambia a vista mensual.
   */
  const handleMonthClick = (monthIndex) => {
    selectDate(viewDate.year, monthIndex, 1)
    setActiveView('month')
  }

  return (
    <div className="year-view" role="grid" aria-label={`Calendario anual ${viewDate.year}`}>
      {Array.from({ length: 12 }, (_, monthIndex) => {
        const isCurrentMonth = viewDate.year === today.year && monthIndex === today.month

        return (
          <button
            key={monthIndex}
            className={`year-view__month-card ${isCurrentMonth ? 'year-view__month-card--current' : ''}`}
            onClick={() => handleMonthClick(monthIndex)}
            aria-label={`${monthNames[monthIndex]} ${viewDate.year}`}
          >
            <h4 className="year-view__month-title">{monthNames[monthIndex]}</h4>
            <MiniMonth
              year={viewDate.year}
              month={monthIndex}
              today={today}
              selectedDate={selectedDate}
              weekdays={weekdays}
            />
          </button>
        )
      })}
    </div>
  )
}

/**
 * MiniMonth - Sub-componente que renderiza un mini-calendario compacto.
 * Es un componente puro memoizado para optimizar el renderizado.
 */
const MiniMonth = React.memo(function MiniMonth({ year, month, today, selectedDate, weekdays }) {
  const gridDays = useMemo(
    () => getCalendarGridDays(year, month),
    [year, month]
  )

  // Solo mostramos 35 celdas máximo en vista mini (5 filas)
  const visibleDays = gridDays.slice(0, 35)

  return (
    <div className="mini-month">
      <div className="mini-month__weekdays">
        {weekdays.map((name, i) => (
          <span key={i} className="mini-month__weekday">{name}</span>
        ))}
      </div>
      <div className="mini-month__days">
        {visibleDays.map((dayObj, index) => {
          const isToday = isSameDay(dayObj, today)
          const isSelected = isSameDay(dayObj, selectedDate)

          return (
            <span
              key={index}
              className={[
                'mini-month__day',
                !dayObj.isCurrentMonth ? 'mini-month__day--filler' : '',
                isToday ? 'mini-month__day--today' : '',
                isSelected ? 'mini-month__day--selected' : '',
              ].filter(Boolean).join(' ')}
            >
              {dayObj.day}
            </span>
          )
        })}
      </div>
    </div>
  )
})

export default React.memo(YearView)
