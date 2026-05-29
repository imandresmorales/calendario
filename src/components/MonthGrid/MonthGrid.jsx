import React, { useMemo } from 'react'
import { useCalendar } from '../../context/CalendarContext'
import { getCalendarGridDays, getWeekdayNames, isSameDay } from '../../utils/dateUtils'

/**
 * MonthGrid.jsx
 * Componente que renderiza la cuadrícula de días del mes activo.
 * 
 * Características:
 * - Cuadrícula de 6 filas × 7 columnas (42 celdas) generada por dateUtils.
 * - Días del mes anterior/siguiente se muestran con opacidad reducida.
 * - Día actual resaltado con indicador visual de acento.
 * - Día seleccionado con borde brillante interactivo.
 * - Memoización con useMemo para evitar recalcular la cuadrícula innecesariamente.
 * - Atributos ARIA para accesibilidad de lectores de pantalla.
 */
function MonthGrid() {
  const { viewDate, selectedDate, selectDate } = useCalendar()

  const weekdays = useMemo(() => getWeekdayNames('es-ES', 'short'), [])

  const gridDays = useMemo(
    () => getCalendarGridDays(viewDate.year, viewDate.month),
    [viewDate.year, viewDate.month]
  )

  /**
   * Maneja el clic en un día de la cuadrícula.
   * Si el día pertenece a otro mes, la vista navega automáticamente a ese mes.
   */
  const handleDayClick = (dayObj) => {
    selectDate(dayObj.year, dayObj.month, dayObj.day)
  }

  /**
   * Determina las clases CSS de una celda basándose en su estado.
   */
  const getDayClasses = (dayObj) => {
    const classes = ['month-grid__day']

    if (!dayObj.isCurrentMonth) {
      classes.push('month-grid__day--filler')
    }

    if (dayObj.isToday) {
      classes.push('month-grid__day--today')
    }

    if (isSameDay(dayObj, selectedDate)) {
      classes.push('month-grid__day--selected')
    }

    return classes.join(' ')
  }

  return (
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
        {gridDays.map((dayObj, index) => (
          <button
            key={index}
            className={getDayClasses(dayObj)}
            role="gridcell"
            aria-label={`${dayObj.day}`}
            aria-selected={isSameDay(dayObj, selectedDate)}
            tabIndex={dayObj.isCurrentMonth ? 0 : -1}
            onClick={() => handleDayClick(dayObj)}
          >
            <span className="month-grid__day-number">{dayObj.day}</span>
            {dayObj.isToday && (
              <span className="month-grid__today-dot" aria-hidden="true"></span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default React.memo(MonthGrid)
