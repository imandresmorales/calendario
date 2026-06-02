import { sanitizeText } from './sanitize'
import { generateEventId } from './storage'

/**
 * Convierte una lista de eventos al estándar iCalendar (RFC 5545).
 * 
 * @param {Array} events - Lista de eventos a exportar.
 * @returns {string} Cadena en formato iCalendar.
 */
export function eventsToICSString(events) {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AstroCal//Calendar App//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ]

  for (const evt of events) {
    const pad = (n) => String(n).padStart(2, '0')
    const yearStr = String(evt.year)
    const monthStr = pad(evt.month + 1) // 1-indexed en .ics
    const dayStr = pad(evt.day)
    
    // DTSTART/DTEND format: YYYYMMDDTHHMMSS
    const startStr = `${yearStr}${monthStr}${dayStr}T${evt.startTime.replace(':', '')}00`
    const endStr = `${yearStr}${monthStr}${dayStr}T${evt.endTime.replace(':', '')}00`
    
    ics.push('BEGIN:VEVENT')
    ics.push(`UID:${evt.id || generateEventId()}@astrocal.app`)
    ics.push(`DTSTAMP:${yearStr}${monthStr}${dayStr}T000000Z`)
    ics.push(`DTSTART:${startStr}`)
    ics.push(`DTEND:${endStr}`)
    
    // Escapar comas, puntos y comas y barras invertidas en el estándar iCalendar
    const titleEscaped = (evt.title || '').replace(/[,;\\]/g, (m) => '\\' + m)
    const descEscaped = (evt.description || '')
      .replace(/[,;\\]/g, (m) => '\\' + m)
      .replace(/\r?\n/g, '\\n')
      
    ics.push(`SUMMARY:${titleEscaped}`)
    if (evt.description) {
      ics.push(`DESCRIPTION:${descEscaped}`)
    }
    ics.push(`CATEGORIES:${(evt.category || 'work').toUpperCase()}`)
    ics.push('END:VEVENT')
  }

  ics.push('END:VCALENDAR')
  return ics.join('\r\n')
}

/**
 * Valida y sanitiza un objeto de evento importado.
 * Retorna el evento limpio o null si es inválido.
 */
function validateAndSanitizeEvent(rawEvt) {
  const title = sanitizeText(rawEvt.title || 'Evento Importado', 100)
  const description = sanitizeText(rawEvt.description || '', 500)
  
  let category = 'work'
  const rawCat = String(rawEvt.category || '').trim().toLowerCase()
  if (['work', 'personal', 'meeting', 'holiday'].includes(rawCat)) {
    category = rawCat
  }

  let year, month, day, startTime = '09:00', endTime = '10:00'

  // Parsear dtstart y dtend
  const dtstart = String(rawEvt.dtstart || '').trim()
  const dtend = String(rawEvt.dtend || '').trim()

  if (!dtstart) return null // Requerido

  const dateMatch = dtstart.match(/^(\d{4})(\d{2})(\d{2})/)
  if (!dateMatch) return null // Fecha inválida

  year = parseInt(dateMatch[1], 10)
  month = parseInt(dateMatch[2], 10) - 1 // 0-indexed en JS
  day = parseInt(dateMatch[3], 10)

  // Validar rangos de fecha básicos
  if (year < 1900 || year > 2100 || month < 0 || month > 11 || day < 1 || day > 31) {
    return null
  }

  // Parsear horas
  const timeStartMatch = dtstart.match(/T(\d{2})(\d{2})/)
  if (timeStartMatch) {
    startTime = `${timeStartMatch[1]}:${timeStartMatch[2]}`
  }

  const timeEndMatch = dtend.match(/T(\d{2})(\d{2})/)
  if (timeEndMatch) {
    endTime = `${timeEndMatch[1]}:${timeEndMatch[2]}`
  }

  // Validar rango de horas
  const startHour = parseInt(startTime.split(':')[0], 10)
  const startMin = parseInt(startTime.split(':')[1], 10)
  const endHour = parseInt(endTime.split(':')[0], 10)
  const endMin = parseInt(endTime.split(':')[1], 10)
  const startTotal = startHour * 60 + startMin
  const endTotal = endHour * 60 + endMin

  if (endTotal <= startTotal) {
    // Si la hora de fin es inválida o anterior, ajustar a inicio + 1 hora
    const nextH = (startHour + 1) % 24
    endTime = `${String(nextH).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`
  }

  return {
    id: generateEventId(),
    title,
    description,
    startTime,
    endTime,
    category,
    year,
    month,
    day,
  }
}

/**
 * Parsea e importa eventos desde una cadena iCalendar (ICS) de forma segura.
 * 
 * @param {string} icsText - Contenido del archivo ICS.
 * @returns {Array} Lista de eventos válidos e importados.
 */
export function parseICS(icsText) {
  const events = []
  const lines = icsText.split(/\r?\n/)
  let currentEvent = null
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    
    // Desplegar líneas continuas (Unfolding) en formato ICS
    while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
      line += lines[i + 1].slice(1)
      i++
    }
    
    const trimLine = line.trim()
    if (!trimLine) continue

    if (trimLine === 'BEGIN:VEVENT') {
      currentEvent = {}
      continue
    }

    if (trimLine === 'END:VEVENT' && currentEvent) {
      const validated = validateAndSanitizeEvent(currentEvent)
      if (validated) {
        events.push(validated)
      }
      currentEvent = null
      continue
    }

    if (currentEvent) {
      const match = trimLine.match(/^([^:;]+)(?:;[^:]*)?:(.*)$/)
      if (!match) continue
      
      const key = match[1].toUpperCase()
      let val = match[2]

      // Des-escapar caracteres especiales
      val = val.replace(/\\(.)/g, (m, c) => {
        if (c === 'n' || c === 'N') return '\n'
        return c
      })

      if (key === 'SUMMARY') {
        currentEvent.title = val
      } else if (key === 'DESCRIPTION') {
        currentEvent.description = val
      } else if (key === 'CATEGORIES') {
        // En ICS se guarda en mayúsculas a veces
        currentEvent.category = val.toLowerCase()
      } else if (key === 'DTSTART') {
        currentEvent.dtstart = val
      } else if (key === 'DTEND') {
        currentEvent.dtend = val
      }
    }
  }

  return events
}

/**
 * Parsea e importa eventos desde una cadena JSON de forma segura.
 * Validación estricta de tipos, rangos y sanitización XSS.
 * 
 * @param {string} jsonText - Contenido del archivo JSON.
 * @returns {Array} Lista de eventos válidos e importados.
 */
export function parseJSON(jsonText) {
  try {
    const rawData = JSON.parse(jsonText)
    if (!Array.isArray(rawData)) return []

    const validEvents = []
    for (const item of rawData) {
      if (!item || typeof item !== 'object') continue

      // Validar atributos obligatorios mínimos
      if (!item.title || item.year === undefined || item.month === undefined || item.day === undefined) {
        continue
      }

      const title = sanitizeText(item.title, 100)
      const description = sanitizeText(item.description || '', 500)
      
      const year = parseInt(item.year, 10)
      const month = parseInt(item.month, 10)
      const day = parseInt(item.day, 10)

      if (isNaN(year) || isNaN(month) || isNaN(day)) continue
      if (year < 1900 || year > 2100 || month < 0 || month > 11 || day < 1 || day > 31) continue

      let category = 'work'
      if (['work', 'personal', 'meeting', 'holiday'].includes(item.category)) {
        category = item.category
      }

      // Validar formato de horas (HH:MM)
      let startTime = '09:00'
      let endTime = '10:00'
      const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/
      
      if (item.startTime && timePattern.test(item.startTime)) {
        startTime = item.startTime
      }
      if (item.endTime && timePattern.test(item.endTime)) {
        endTime = item.endTime
      }

      const startH = parseInt(startTime.split(':')[0], 10)
      const startM = parseInt(startTime.split(':')[1], 10)
      const endH = parseInt(endTime.split(':')[0], 10)
      const endM = parseInt(endTime.split(':')[1], 10)
      
      if (endH * 60 + endM <= startH * 60 + startM) {
        const nextH = (startH + 1) % 24
        endTime = `${String(nextH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`
      }

      validEvents.push({
        id: generateEventId(),
        title,
        description,
        startTime,
        endTime,
        category,
        year,
        month,
        day,
      })
    }

    return validEvents
  } catch (e) {
    return []
  }
}
