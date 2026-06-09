import { useEffect } from 'react'
import { getMonthNames } from '../utils/dateUtils'

/**
 * useDocumentTitle.js
 * Hook que actualiza el título de la pestaña del navegador (document.title)
 * con el contexto actual del calendario.
 *
 * Formato: "AstroCal — 9 Jun 2026" (o el periodo de la vista activa).
 *
 * Buenas prácticas:
 * - Solo asigna strings escapados de forma segura (sin HTML, sin eval).
 * - Restaura el título original al desmontar.
 * - Memoizado: solo actualiza cuando cambia la fecha o la vista activa.
 *
 * Seguridad:
 * - document.title acepta únicamente texto plano (el navegador lo escapa).
 * - No se construye HTML ni se evalúa ningún dato.
 *
 * @param {Object} viewDate    - { year, month, day }
 * @param {string} activeView  - 'month' | 'year' | 'day' | 'agenda'
 * @param {Object} selectedDate - { year, month, day }
 */
export function useDocumentTitle(viewDate, activeView, selectedDate) {
  useEffect(() => {
    const APP_NAME   = 'AstroCal'
    const monthNames = getMonthNames()     // array de 12 meses en español

    let subtitle = ''

    switch (activeView) {
      case 'year':
        subtitle = `${viewDate.year}`
        break
      case 'day':
        subtitle = `${selectedDate.day} ${monthNames[selectedDate.month].slice(0, 3)} ${selectedDate.year}`
        break
      case 'agenda':
        subtitle = `Agenda · ${monthNames[viewDate.month].slice(0, 3)} ${viewDate.year}`
        break
      case 'month':
      default:
        subtitle = `${monthNames[viewDate.month]} ${viewDate.year}`
        break
    }

    const newTitle = `${APP_NAME} — ${subtitle}`

    // Solo actualizar si cambió (evita reflows innecesarios)
    if (document.title !== newTitle) {
      document.title = newTitle
    }

    // Al desmontar, restaurar el título original definido en index.html
    return () => {
      document.title = 'AstroCal - Calendario Premium en React'
    }
  }, [viewDate.year, viewDate.month, activeView, selectedDate.day, selectedDate.month, selectedDate.year])
}
