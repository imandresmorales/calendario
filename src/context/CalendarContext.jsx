import React, { createContext, useContext, useReducer, useCallback } from 'react'

/**
 * CalendarContext.jsx
 * Estado global de la aplicación de calendario.
 * Utiliza useReducer para manejo predecible del estado,
 * evitando mutaciones directas (patrón Flux/Redux simplificado).
 */

const CalendarContext = createContext(null)

// Tipos de acción centralizados para prevenir errores tipográficos
const ACTIONS = Object.freeze({
  SET_SELECTED_DATE: 'SET_SELECTED_DATE',
  NAVIGATE_MONTH: 'NAVIGATE_MONTH',
  SET_VIEW: 'SET_VIEW',
  GO_TO_TODAY: 'GO_TO_TODAY',
})

/**
 * Estado inicial basado en la fecha actual del sistema.
 */
function getInitialState() {
  const now = new Date()
  return {
    selectedDate: {
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate(),
    },
    viewDate: {
      year: now.getFullYear(),
      month: now.getMonth(),
    },
    activeView: 'month', // 'month' | 'year' | 'day' | 'agenda'
  }
}

/**
 * Reducer puro para manejar las transiciones de estado del calendario.
 * Cada caso retorna un nuevo objeto (inmutabilidad).
 */
function calendarReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_SELECTED_DATE:
      return {
        ...state,
        selectedDate: { ...action.payload },
        viewDate: {
          year: action.payload.year,
          month: action.payload.month,
        },
      }

    case ACTIONS.NAVIGATE_MONTH: {
      const { direction } = action.payload // 1 = siguiente, -1 = anterior
      let newMonth = state.viewDate.month + direction
      let newYear = state.viewDate.year

      if (newMonth > 11) {
        newMonth = 0
        newYear += 1
      } else if (newMonth < 0) {
        newMonth = 11
        newYear -= 1
      }

      return {
        ...state,
        viewDate: { year: newYear, month: newMonth },
      }
    }

    case ACTIONS.SET_VIEW:
      return {
        ...state,
        activeView: action.payload,
      }

    case ACTIONS.GO_TO_TODAY: {
      const now = new Date()
      return {
        ...state,
        selectedDate: {
          year: now.getFullYear(),
          month: now.getMonth(),
          day: now.getDate(),
        },
        viewDate: {
          year: now.getFullYear(),
          month: now.getMonth(),
        },
      }
    }

    default:
      return state
  }
}

/**
 * Provider del contexto del calendario.
 * Envuelve la aplicación para proveer estado global a todos los componentes hijos.
 */
export function CalendarProvider({ children }) {
  const [state, dispatch] = useReducer(calendarReducer, null, getInitialState)

  return (
    <CalendarContext.Provider value={{ state, dispatch, ACTIONS }}>
      {children}
    </CalendarContext.Provider>
  )
}

/**
 * Hook personalizado para consumir el contexto del calendario.
 * Encapsula el dispatch en funciones semánticas de alto nivel
 * para que los componentes no necesiten conocer los tipos de acción.
 *
 * @returns {Object} Estado y acciones del calendario.
 * @throws {Error} Si se usa fuera de CalendarProvider.
 */
export function useCalendar() {
  const context = useContext(CalendarContext)

  if (!context) {
    throw new Error('useCalendar debe usarse dentro de un <CalendarProvider>')
  }

  const { state, dispatch, ACTIONS } = context

  const selectDate = useCallback(
    (year, month, day) => {
      dispatch({ type: ACTIONS.SET_SELECTED_DATE, payload: { year, month, day } })
    },
    [dispatch, ACTIONS]
  )

  const goToPreviousMonth = useCallback(() => {
    dispatch({ type: ACTIONS.NAVIGATE_MONTH, payload: { direction: -1 } })
  }, [dispatch, ACTIONS])

  const goToNextMonth = useCallback(() => {
    dispatch({ type: ACTIONS.NAVIGATE_MONTH, payload: { direction: 1 } })
  }, [dispatch, ACTIONS])

  const goToToday = useCallback(() => {
    dispatch({ type: ACTIONS.GO_TO_TODAY })
  }, [dispatch, ACTIONS])

  const setActiveView = useCallback(
    (view) => {
      dispatch({ type: ACTIONS.SET_VIEW, payload: view })
    },
    [dispatch, ACTIONS]
  )

  return {
    selectedDate: state.selectedDate,
    viewDate: state.viewDate,
    activeView: state.activeView,
    selectDate,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    setActiveView,
  }
}

export default CalendarContext
