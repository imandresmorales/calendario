import { useEffect, useCallback } from 'react'
import { useCalendar } from '../context/CalendarContext'

/**
 * useKeyboardNavigation.js
 * Hook personalizado que añade navegación por teclado al calendario.
 *
 * Buenas prácticas de accesibilidad (a11y):
 * - Flechas izquierda/derecha: día anterior/siguiente.
 * - Flechas arriba/abajo: semana anterior/siguiente.
 * - Escape: cierra modales activos (preparado para futuro).
 * - Enter/Space: selecciona el día enfocado.
 * - Home: ir al primer día del mes.
 * - End: ir al último día del mes.
 *
 * Seguridad:
 * - Solo responde a teclas específicas (whitelist estricta).
 * - No ejecuta acciones si el foco está en un input/textarea para
 *   evitar interferencias con la escritura del usuario.
 */
export function useKeyboardNavigation() {
  const {
    selectedDate,
    selectDate,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
  } = useCalendar()

  /**
   * Calcula una nueva fecha sumando o restando días a la fecha seleccionada.
   * Maneja correctamente los cambios de mes y año.
   */
  const getOffsetDate = useCallback((dayOffset) => {
    const current = new Date(selectedDate.year, selectedDate.month, selectedDate.day)
    current.setDate(current.getDate() + dayOffset)
    return {
      year: current.getFullYear(),
      month: current.getMonth(),
      day: current.getDate(),
    }
  }, [selectedDate])

  const handleKeyDown = useCallback((event) => {
    // No interceptar si el usuario está escribiendo en un campo de texto
    const activeTag = document.activeElement?.tagName?.toLowerCase()
    if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
      return
    }

    // Whitelist estricta de teclas manejadas
    const handledKeys = [
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End', 'Escape',
    ]

    if (!handledKeys.includes(event.key)) {
      return
    }

    event.preventDefault()

    switch (event.key) {
      case 'ArrowLeft': {
        const prev = getOffsetDate(-1)
        selectDate(prev.year, prev.month, prev.day)
        break
      }
      case 'ArrowRight': {
        const next = getOffsetDate(1)
        selectDate(next.year, next.month, next.day)
        break
      }
      case 'ArrowUp': {
        const prevWeek = getOffsetDate(-7)
        selectDate(prevWeek.year, prevWeek.month, prevWeek.day)
        break
      }
      case 'ArrowDown': {
        const nextWeek = getOffsetDate(7)
        selectDate(nextWeek.year, nextWeek.month, nextWeek.day)
        break
      }
      case 'Home': {
        selectDate(selectedDate.year, selectedDate.month, 1)
        break
      }
      case 'End': {
        const lastDay = new Date(selectedDate.year, selectedDate.month + 1, 0).getDate()
        selectDate(selectedDate.year, selectedDate.month, lastDay)
        break
      }
      case 'Escape': {
        goToToday()
        break
      }
      default:
        break
    }
  }, [selectedDate, selectDate, goToToday, getOffsetDate])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}
