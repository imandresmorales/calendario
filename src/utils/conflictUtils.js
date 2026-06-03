/**
 * conflictUtils.js
 * Utilidades para detectar solapamiento de eventos en la agenda.
 * 
 * Principio: previene dobles agendamientos y avisa al usuario
 * sobre colisiones de tiempo en tiempo real.
 */

/**
 * Convierte una hora en formato "HH:MM" a minutos transcurridos desde la medianoche.
 * @param {string} timeStr - Hora en formato "HH:MM"
 * @returns {number} Minutos transcurridos
 */
function timeToMinutes(timeStr) {
  const [hour, min] = timeStr.split(':').map(Number)
  return hour * 60 + min
}

/**
 * Verifica si un evento colisiona con algún otro evento agendado para el mismo día.
 * 
 * @param {Object} newEventData - Datos del evento que se quiere validar. Contiene: startTime, endTime, year, month, day, id (opcional)
 * @param {Array} allEvents - Lista completa de eventos actuales.
 * @returns {Object|null} El evento con el que colisiona, o null si no hay conflicto.
 */
export function checkEventConflict(newEventData, allEvents) {
  if (!newEventData.startTime || !newEventData.endTime) return null

  const newStart = timeToMinutes(newEventData.startTime)
  const newEnd = timeToMinutes(newEventData.endTime)

  // Filtrar eventos del mismo día, excluyendo el propio evento en modo edición
  const dailyEvents = allEvents.filter(
    (evt) =>
      evt.year === newEventData.year &&
      evt.month === newEventData.month &&
      evt.day === newEventData.day &&
      evt.id !== newEventData.id
  )

  for (const evt of dailyEvents) {
    const existingStart = timeToMinutes(evt.startTime)
    const existingEnd = timeToMinutes(evt.endTime)

    // Solapamiento: el nuevo evento empieza antes de que termine el existente, 
    // y termina después de que empiece el existente.
    if (newStart < existingEnd && newEnd > existingStart) {
      return evt // Retornar el primer evento con conflicto
    }
  }

  return null
}
