/**
 * sanitize.js
 * Módulo de sanitización de entradas de texto para prevenir
 * ataques XSS (Cross-Site Scripting) al renderizar contenido
 * dinámico proporcionado por el usuario (títulos, descripciones de eventos).
 *
 * Principio: nunca confiar en la entrada del usuario.
 * Se escapan caracteres HTML peligrosos y se limita la longitud máxima.
 */

/**
 * Mapa de caracteres HTML peligrosos a sus entidades seguras.
 * Previene inyección de etiquetas <script>, atributos on*, etc.
 */
const HTML_ESCAPE_MAP = Object.freeze({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
})

/**
 * Escapa caracteres HTML peligrosos en un string.
 * @param {string} str - La cadena a sanitizar.
 * @returns {string} Cadena con caracteres HTML escapados.
 */
export function escapeHTML(str) {
  if (typeof str !== 'string') return ''
  return str.replace(/[&<>"'`/]/g, (char) => HTML_ESCAPE_MAP[char] || char)
}

/**
 * Sanitiza una entrada de texto aplicando:
 * 1. Trim de espacios al inicio y final.
 * 2. Escape de caracteres HTML peligrosos.
 * 3. Limitación de longitud máxima.
 *
 * @param {string} input - El texto del usuario a sanitizar.
 * @param {number} maxLength - Longitud máxima permitida (default: 500).
 * @returns {string} Texto sanitizado y seguro para renderizar.
 */
export function sanitizeText(input, maxLength = 500) {
  if (typeof input !== 'string') return ''
  const trimmed = input.trim()
  const truncated = trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed
  return escapeHTML(truncated)
}

/**
 * Valida y sanitiza un título de evento.
 * Reglas: no vacío, longitud máxima de 100 caracteres.
 *
 * @param {string} title - El título a validar.
 * @returns {{ isValid: boolean, value: string, error: string|null }}
 */
export function validateEventTitle(title) {
  const sanitized = sanitizeText(title, 100)

  if (sanitized.length === 0) {
    return { isValid: false, value: '', error: 'El título no puede estar vacío.' }
  }

  if (sanitized.length < 2) {
    return { isValid: false, value: sanitized, error: 'El título debe tener al menos 2 caracteres.' }
  }

  return { isValid: true, value: sanitized, error: null }
}

/**
 * Valida y sanitiza una descripción de evento.
 * Reglas: longitud máxima de 500 caracteres, puede estar vacía.
 *
 * @param {string} description - La descripción a validar.
 * @returns {{ isValid: boolean, value: string, error: string|null }}
 */
export function validateEventDescription(description) {
  const sanitized = sanitizeText(description, 500)
  return { isValid: true, value: sanitized, error: null }
}

/**
 * Valida coherencia de horas de un evento.
 * La hora de fin no puede ser anterior o igual a la hora de inicio.
 *
 * @param {string} startTime - Hora de inicio en formato "HH:MM".
 * @param {string} endTime - Hora de fin en formato "HH:MM".
 * @returns {{ isValid: boolean, error: string|null }}
 */
export function validateTimeRange(startTime, endTime) {
  if (!startTime || !endTime) {
    return { isValid: false, error: 'Las horas de inicio y fin son obligatorias.' }
  }

  // Patrón estricto HH:MM (24h)
  const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/
  if (!timePattern.test(startTime)) {
    return { isValid: false, error: 'La hora de inicio tiene un formato inválido (esperado HH:MM).' }
  }
  if (!timePattern.test(endTime)) {
    return { isValid: false, error: 'La hora de fin tiene un formato inválido (esperado HH:MM).' }
  }

  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  if (endMinutes <= startMinutes) {
    return { isValid: false, error: 'La hora de fin debe ser posterior a la hora de inicio.' }
  }

  return { isValid: true, error: null }
}
