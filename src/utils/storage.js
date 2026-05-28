/**
 * storage.js
 * Capa de almacenamiento local seguro para persistir eventos del calendario.
 *
 * Buenas prácticas implementadas:
 * - Serialización/deserialización con manejo robusto de errores.
 * - Validación de esquema al cargar datos (previene datos corruptos o manipulados).
 * - Control de cuota de localStorage excedida.
 * - Nunca expone datos crudos sin validar al resto de la aplicación.
 */

const STORAGE_KEY = 'astrocal_events'
const STORAGE_VERSION = 1

/**
 * Categorías válidas para eventos (whitelist estricta).
 * Cualquier categoría fuera de esta lista será rechazada.
 */
const VALID_CATEGORIES = Object.freeze(['work', 'personal', 'meeting', 'holiday'])

/**
 * Valida que un objeto de evento tenga la estructura esperada.
 * Previene inyección de propiedades maliciosas o datos corruptos.
 *
 * @param {Object} event - El evento a validar.
 * @returns {boolean} True si el evento tiene un esquema válido.
 */
function isValidEvent(event) {
  if (typeof event !== 'object' || event === null) return false
  if (typeof event.id !== 'string' || event.id.length === 0) return false
  if (typeof event.title !== 'string' || event.title.length === 0) return false
  if (typeof event.description !== 'string') return false
  if (typeof event.year !== 'number' || !Number.isInteger(event.year)) return false
  if (typeof event.month !== 'number' || event.month < 0 || event.month > 11) return false
  if (typeof event.day !== 'number' || event.day < 1 || event.day > 31) return false
  if (typeof event.startTime !== 'string') return false
  if (typeof event.endTime !== 'string') return false
  if (!VALID_CATEGORIES.includes(event.category)) return false
  return true
}

/**
 * Valida la estructura completa del almacenamiento.
 * @param {Object} data - Los datos deserializados del localStorage.
 * @returns {boolean} True si la estructura es válida.
 */
function isValidStorageSchema(data) {
  if (typeof data !== 'object' || data === null) return false
  if (data.version !== STORAGE_VERSION) return false
  if (!Array.isArray(data.events)) return false
  return data.events.every(isValidEvent)
}

/**
 * Carga los eventos almacenados en localStorage.
 * Si los datos están corruptos, alterados o tienen un esquema inválido,
 * retorna un array vacío sin romper la aplicación.
 *
 * @returns {Array<Object>} Lista de eventos validados o array vacío.
 */
export function loadEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)

    if (!isValidStorageSchema(parsed)) {
      console.warn('[AstroCal] Datos corruptos o esquema inválido en localStorage. Restaurando estado limpio.')
      localStorage.removeItem(STORAGE_KEY)
      return []
    }

    return parsed.events
  } catch (error) {
    console.error('[AstroCal] Error al cargar eventos desde localStorage:', error.message)
    localStorage.removeItem(STORAGE_KEY)
    return []
  }
}

/**
 * Guarda los eventos en localStorage con versionado de esquema.
 * Maneja el caso de cuota excedida sin lanzar excepciones no capturadas.
 *
 * @param {Array<Object>} events - Lista de eventos a persistir.
 * @returns {boolean} True si se guardó exitosamente.
 */
export function saveEvents(events) {
  try {
    if (!Array.isArray(events)) {
      console.error('[AstroCal] saveEvents: se esperaba un array de eventos.')
      return false
    }

    // Filtrar solo eventos con esquema válido antes de guardar
    const validEvents = events.filter(isValidEvent)

    if (validEvents.length !== events.length) {
      console.warn(`[AstroCal] Se descartaron ${events.length - validEvents.length} evento(s) con esquema inválido.`)
    }

    const data = {
      version: STORAGE_VERSION,
      events: validEvents,
      lastModified: new Date().toISOString(),
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (error) {
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      console.error('[AstroCal] Cuota de almacenamiento local excedida. No se pudieron guardar los eventos.')
    } else {
      console.error('[AstroCal] Error al guardar eventos en localStorage:', error.message)
    }
    return false
  }
}

/**
 * Genera un ID único para un evento utilizando crypto.randomUUID()
 * con fallback a timestamp + random para navegadores legacy.
 *
 * @returns {string} ID único.
 */
export function generateEventId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback seguro: timestamp + componente aleatorio
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Elimina todos los datos del calendario del localStorage.
 * Útil para resetear la aplicación de forma controlada.
 */
export function clearAllEvents() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('[AstroCal] Error al limpiar localStorage:', error.message)
  }
}
