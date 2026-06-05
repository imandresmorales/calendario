import { useEffect, useCallback } from 'react'
import { useCalendar } from '../context/CalendarContext'

/**
 * useKeyboardNavigation.js
 * Hook personalizado que añade navegación y atajos globales por teclado al calendario.
 *
 * Buenas prácticas de accesibilidad (a11y):
 * - Flechas izquierda/derecha: día anterior/siguiente.
 * - Flechas arriba/abajo: semana anterior/siguiente.
 * - Home: ir al primer día del mes.
 * - End: ir al último día del mes.
 * - T: ir al día de hoy.
 * - N: abrir modal de nuevo evento.
 * - M: vista de Mes.
 * - A: vista de Año.
 * - D: vista de Día.
 * - G: vista de Agenda.
 * - ?: abrir/cerrar panel de atajos de teclado.
 *
 * Seguridad:
 * - Solo responde a teclas específicas (whitelist estricta).
 * - No ejecuta acciones si el foco está en un input/textarea/select para
 *   evitar interferencias con la escritura del usuario.
 * - Los callbacks opcionales se invocan solo si son funciones válidas.
 *
 * @param {Object}   options
 * @param {Function} options.onNewEvent         - Callback para abrir modal de nuevo evento.
 * @param {Function} options.onToggleShortcuts  - Callback para abrir/cerrar panel de atajos.
 */
export function useKeyboardNavigation({ onNewEvent, onToggleShortcuts } = {}) {
  const {
    selectedDate,
    selectDate,
    goToToday,
    setActiveView,
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

    // No interceptar si hay un modal abierto (aria-modal activo), excepto para '?' y Escape
    const openModal = document.querySelector('[role="dialog"][aria-modal="true"]')
    if (openModal && event.key !== 'Escape' && event.key !== '?') {
      return
    }

    // Whitelist estricta de teclas manejadas
    const handledKeys = [
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End',
      't', 'T', 'n', 'N', 'm', 'M', 'a', 'A', 'd', 'D', 'g', 'G',
      '?',
    ]

    if (!handledKeys.includes(event.key)) {
      return
    }

    // Solo prevenir default para teclas que pueden afectar el scroll/navegación del navegador
    const scrollKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
    if (scrollKeys.includes(event.key)) {
      event.preventDefault()
    }

    switch (event.key) {
      // ── Navegación por fechas ────────────────────────────────
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

      // ── Ir a hoy ─────────────────────────────────────────────
      case 't':
      case 'T': {
        goToToday()
        break
      }

      // ── Cambio de vista ───────────────────────────────────────
      case 'm':
      case 'M': {
        setActiveView('month')
        break
      }
      case 'a':
      case 'A': {
        setActiveView('year')
        break
      }
      case 'd':
      case 'D': {
        setActiveView('day')
        break
      }
      case 'g':
      case 'G': {
        setActiveView('agenda')
        break
      }

      // ── Nuevo evento ──────────────────────────────────────────
      case 'n':
      case 'N': {
        if (typeof onNewEvent === 'function') {
          onNewEvent()
        }
        break
      }

      // ── Panel de atajos ───────────────────────────────────────
      case '?': {
        if (typeof onToggleShortcuts === 'function') {
          onToggleShortcuts()
        }
        break
      }

      default:
        break
    }
  }, [selectedDate, selectDate, goToToday, setActiveView, getOffsetDate, onNewEvent, onToggleShortcuts])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}
