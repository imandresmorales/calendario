/**
 * dateUtils.js
 * Motor de utilidades de fechas puras para el calendario.
 * Todas las funciones son puras (sin efectos secundarios) y utilizan
 * la API nativa de JavaScript (Date, Intl) para máxima compatibilidad
 * y mínima superficie de ataque (sin dependencias externas).
 */

/**
 * Nombres de los días de la semana en español (Lunes primero).
 * Generados dinámicamente con Intl para respetar la localización.
 * @returns {string[]} Array de 7 nombres cortos de días.
 */
export function getWeekdayNames(locale = 'es-ES', format = 'short') {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: format })
  // Empezamos desde un lunes conocido: 2024-01-01 fue lunes
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(2024, 0, 1 + i)
    const name = formatter.format(date)
    return name.charAt(0).toUpperCase() + name.slice(1)
  })
}

/**
 * Nombres de los meses del año en español.
 * @param {string} locale - Código de localización (default: 'es-ES').
 * @returns {string[]} Array de 12 nombres de meses.
 */
export function getMonthNames(locale = 'es-ES') {
  const formatter = new Intl.DateTimeFormat(locale, { month: 'long' })
  return Array.from({ length: 12 }, (_, i) => {
    const name = formatter.format(new Date(2024, i, 1))
    return name.charAt(0).toUpperCase() + name.slice(1)
  })
}

/**
 * Determina si un año es bisiesto.
 * @param {number} year - El año a evaluar.
 * @returns {boolean} True si es bisiesto.
 */
export function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/**
 * Obtiene el número de días en un mes dado.
 * @param {number} year - El año.
 * @param {number} month - El mes (0-indexado, 0 = Enero).
 * @returns {number} Cantidad de días del mes.
 */
export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

/**
 * Obtiene el día de la semana del primer día del mes (0 = Lunes, 6 = Domingo).
 * Normalizado para que la semana comience en Lunes (estándar ISO/europeo).
 * @param {number} year - El año.
 * @param {number} month - El mes (0-indexado).
 * @returns {number} Índice del día (0 = Lunes, 6 = Domingo).
 */
export function getFirstDayOfMonth(year, month) {
  const day = new Date(year, month, 1).getDay()
  // Convertir de Domingo=0 a Lunes=0
  return day === 0 ? 6 : day - 1
}

/**
 * Genera los días de la cuadrícula del calendario para un mes dado.
 * Incluye días de relleno del mes anterior y siguiente para completar
 * una cuadrícula uniforme de 6 filas × 7 columnas (42 celdas).
 *
 * Cada celda contiene: { day, month, year, isCurrentMonth, isToday }
 *
 * @param {number} year - El año.
 * @param {number} month - El mes (0-indexado).
 * @returns {Array<Object>} Array de 42 objetos representando las celdas.
 */
export function getCalendarGridDays(year, month) {
  const today = new Date()
  const todayDay = today.getDate()
  const todayMonth = today.getMonth()
  const todayYear = today.getFullYear()

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  // Mes anterior
  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear = month === 0 ? year - 1 : year
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth)

  // Mes siguiente
  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear = month === 11 ? year + 1 : year

  const grid = []

  // Días de relleno del mes anterior
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    grid.push({
      day,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
      isToday: day === todayDay && prevMonth === todayMonth && prevYear === todayYear,
    })
  }

  // Días del mes actual
  for (let day = 1; day <= daysInMonth; day++) {
    grid.push({
      day,
      month,
      year,
      isCurrentMonth: true,
      isToday: day === todayDay && month === todayMonth && year === todayYear,
    })
  }

  // Días de relleno del mes siguiente (completar hasta 42 celdas)
  const remaining = 42 - grid.length
  for (let day = 1; day <= remaining; day++) {
    grid.push({
      day,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
      isToday: day === todayDay && nextMonth === todayMonth && nextYear === todayYear,
    })
  }

  return grid
}

/**
 * Formatea una fecha completa en formato legible para el ser humano.
 * @param {number} year - El año.
 * @param {number} month - El mes (0-indexado).
 * @param {number} day - El día.
 * @param {string} locale - Localización (default: 'es-ES').
 * @returns {string} Fecha formateada (ej. "martes, 27 de mayo de 2026").
 */
export function formatFullDate(year, month, day, locale = 'es-ES') {
  const date = new Date(year, month, day)
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

/**
 * Obtiene el nombre del día de la semana para una fecha dada.
 * @param {number} year - El año.
 * @param {number} month - El mes (0-indexado).
 * @param {number} day - El día.
 * @param {string} locale - Localización (default: 'es-ES').
 * @returns {string} Nombre del día (ej. "Martes").
 */
export function getWeekdayName(year, month, day, locale = 'es-ES') {
  const date = new Date(year, month, day)
  const name = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date)
  return name.charAt(0).toUpperCase() + name.slice(1)
}

/**
 * Compara si dos fechas representan el mismo día.
 * @param {Date|Object} a - Primera fecha ({ year, month, day } o Date).
 * @param {Date|Object} b - Segunda fecha.
 * @returns {boolean} True si son el mismo día.
 */
export function isSameDay(a, b) {
  const getValues = (d) => {
    if (d instanceof Date) {
      return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() }
    }
    return { year: d.year, month: d.month, day: d.day }
  }
  const va = getValues(a)
  const vb = getValues(b)
  return va.year === vb.year && va.month === vb.month && va.day === vb.day
}
