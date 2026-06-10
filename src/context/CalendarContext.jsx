import React, { createContext, useContext, useReducer, useCallback, useEffect, useState, useMemo } from 'react'
import { loadEvents, saveEvents, generateEventId } from '../utils/storage'

/**
 * CalendarContext.jsx
 * Contexto global de React para el estado del calendario.
 *
 * Arquitectura:
 * - Patrón Reducer (useReducer) para transiciones de estado predecibles.
 * - Context API para acceso global sin prop-drilling.
 * - Custom hook (useCalendar) para encapsular toda la lógica de acceso al contexto.
 * - Tipos de acción como constantes congeladas para prevenir errores tipográficos.
 * - Persistencia en localStorage a través de storage.js.
 * - Filtrado reactivo mediante useMemo (búsqueda + categorías).
 * - Flag `isReady` para saber cuándo los datos de localStorage ya fueron hidratados.
 */

const CalendarContext = createContext(null)

// Tipos de acción centralizados para prevenir errores tipográficos
const ACTIONS = Object.freeze({
  SET_SELECTED_DATE: 'SET_SELECTED_DATE',
  NAVIGATE_MONTH: 'NAVIGATE_MONTH',
  SET_VIEW: 'SET_VIEW',
  GO_TO_TODAY: 'GO_TO_TODAY',
  ADD_EVENT: 'ADD_EVENT',
  UPDATE_EVENT: 'UPDATE_EVENT',
  DELETE_EVENT: 'DELETE_EVENT',
  LOAD_EVENTS: 'LOAD_EVENTS',
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  TOGGLE_CATEGORY: 'TOGGLE_CATEGORY',
  IMPORT_EVENTS: 'IMPORT_EVENTS',
  CLEAR_ALL_EVENTS: 'CLEAR_ALL_EVENTS',
  JUMP_TO_PERIOD: 'JUMP_TO_PERIOD',
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
    events: [],
    searchQuery: '',
    selectedCategories: ['work', 'personal', 'meeting', 'holiday'],
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

    case ACTIONS.LOAD_EVENTS:
      return {
        ...state,
        events: action.payload,
      }

    case ACTIONS.ADD_EVENT:
      return {
        ...state,
        events: [...state.events, action.payload],
      }

    case ACTIONS.UPDATE_EVENT:
      return {
        ...state,
        events: state.events.map((evt) =>
          evt.id === action.payload.id ? { ...action.payload } : evt
        ),
      }

    case ACTIONS.DELETE_EVENT:
      return {
        ...state,
        events: state.events.filter((evt) => evt.id !== action.payload),
      }

    case ACTIONS.IMPORT_EVENTS:
      return {
        ...state,
        events: [...state.events, ...action.payload],
      }

    case ACTIONS.CLEAR_ALL_EVENTS:
      return {
        ...state,
        events: [],
      }

    case ACTIONS.JUMP_TO_PERIOD:
      return {
        ...state,
        viewDate: {
          year: action.payload.year,
          month: action.payload.month,
        },
      }

    case ACTIONS.SET_SEARCH_QUERY:
      return {
        ...state,
        searchQuery: action.payload,
      }

    case ACTIONS.TOGGLE_CATEGORY: {
      const category = action.payload
      const isSelected = state.selectedCategories.includes(category)
      const selectedCategories = isSelected
        ? state.selectedCategories.filter((c) => c !== category)
        : [...state.selectedCategories, category]
      return {
        ...state,
        selectedCategories,
      }
    }

    default:
      return state
  }
}

/**
 * Provider del contexto del calendario.
 * Envuelve la aplicación para proveer estado global a todos los componentes hijos.
 * Carga eventos de localStorage al montar y los persiste al cambiar.
 */
export function CalendarProvider({ children }) {
  const [state, dispatch] = useReducer(calendarReducer, null, getInitialState)

  /**
   * isReady: indica que el estado ha sido hidratado desde localStorage.
   * Se usa para mostrar skeleton loaders o spinners en la UI durante la carga inicial.
   */
  const [isReady, setIsReady] = useState(false)

  // Cargar eventos de localStorage al montar la app
  useEffect(() => {
    const stored = loadEvents()
    if (stored.length > 0) {
      dispatch({ type: ACTIONS.LOAD_EVENTS, payload: stored })
    }
    // Marcar como listo inmediatamente después de intentar cargar
    // (sea con datos o sin ellos) para revelar la UI
    setIsReady(true)
  }, [])

  // Persistir eventos en localStorage cada vez que cambien
  useEffect(() => {
    saveEvents(state.events)
  }, [state.events])

  return (
    <CalendarContext.Provider value={{ state, dispatch, ACTIONS, isReady }}>
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

  const { state, dispatch, ACTIONS, isReady } = context

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

  const setSearchQuery = useCallback(
    (query) => {
      dispatch({ type: ACTIONS.SET_SEARCH_QUERY, payload: query })
    },
    [dispatch, ACTIONS]
  )

  const toggleCategory = useCallback(
    (category) => {
      dispatch({ type: ACTIONS.TOGGLE_CATEGORY, payload: category })
    },
    [dispatch, ACTIONS]
  )

  // --- Filtrado Seguro de Eventos ---
  const filteredEvents = useMemo(() => {
    const query = state.searchQuery.toLowerCase().trim()
    return state.events.filter((evt) => {
      // Filtrar por categoría
      const matchesCategory = state.selectedCategories.includes(evt.category)
      if (!matchesCategory) return false

      // Filtrar por texto de búsqueda
      if (!query) return true
      const titleMatch = evt.title?.toLowerCase().includes(query)
      const descMatch = evt.description?.toLowerCase().includes(query)
      return titleMatch || descMatch
    })
  }, [state.events, state.searchQuery, state.selectedCategories])

  // --- CRUD de Eventos ---

  const addEvent = useCallback(
    (eventData) => {
      const newEvent = {
        ...eventData,
        id: eventData.id || generateEventId(),
      }
      dispatch({ type: ACTIONS.ADD_EVENT, payload: newEvent })
    },
    [dispatch, ACTIONS]
  )

  const updateEvent = useCallback(
    (eventData) => {
      dispatch({ type: ACTIONS.UPDATE_EVENT, payload: eventData })
    },
    [dispatch, ACTIONS]
  )

  const deleteEvent = useCallback(
    (eventId) => {
      dispatch({ type: ACTIONS.DELETE_EVENT, payload: eventId })
    },
    [dispatch, ACTIONS]
  )

  const importEvents = useCallback(
    (eventsArray) => {
      dispatch({ type: ACTIONS.IMPORT_EVENTS, payload: eventsArray })
    },
    [dispatch, ACTIONS]
  )

  const clearAllEvents = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ALL_EVENTS })
  }, [dispatch, ACTIONS])

  const jumpToPeriod = useCallback(
    (year, month) => {
      dispatch({ type: ACTIONS.JUMP_TO_PERIOD, payload: { year, month } })
    },
    [dispatch, ACTIONS]
  )

  /**
   * Obtiene los eventos de un día específico, aplicando los filtros activos de búsqueda/categoría.
   * Función pura sin efectos secundarios.
   */
  const getEventsForDay = useCallback(
    (year, month, day) => {
      return filteredEvents.filter(
        (evt) => evt.year === year && evt.month === month && evt.day === day
      )
    },
    [filteredEvents]
  )

  return {
    selectedDate: state.selectedDate,
    viewDate: state.viewDate,
    activeView: state.activeView,
    events: state.events, // Para persistencia u otros usos que requieran el total sin filtros
    filteredEvents, // Eventos filtrados según búsqueda y categorías
    searchQuery: state.searchQuery,
    selectedCategories: state.selectedCategories,
    selectDate,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    setActiveView,
    setSearchQuery,
    toggleCategory,
    addEvent,
    updateEvent,
    deleteEvent,
    importEvents,
    clearAllEvents,
    jumpToPeriod,
    getEventsForDay,
    isReady,
  }
}

export default CalendarContext
