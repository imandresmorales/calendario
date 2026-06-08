import { useState, useEffect, useCallback } from 'react'

/**
 * useTheme.js
 * Hook personalizado para manejar el tema claro/oscuro y el modo de alto contraste.
 *
 * Buenas prácticas:
 * - Respeta la preferencia del sistema operativo como valor inicial.
 * - Persiste la elección del usuario en localStorage.
 * - Aplica el tema vía atributo data-theme en <html> (no manipula clases).
 * - Aplica alto contraste vía atributo data-high-contrast en <html>.
 * - No expone datos sensibles en localStorage.
 *
 * Seguridad:
 * - Valida todos los valores cargados de localStorage (whitelist estricta).
 * - Manejo seguro de errores de localStorage (cuota, acceso denegado).
 *
 * Mejora 44: Se añade soporte de modo de alto contraste (data-high-contrast="true")
 * con persistencia en localStorage y respeto a la preferencia del sistema
 * (prefers-contrast: more).
 */

const THEME_KEY        = 'astrocal_theme'
const CONTRAST_KEY     = 'astrocal_high_contrast'
const VALID_THEMES     = ['light', 'dark']
const VALID_BOOLEANS   = ['true', 'false']

/**
 * Obtiene el tema preferido del sistema operativo.
 * @returns {'light' | 'dark'}
 */
function getSystemTheme() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'dark'
}

/**
 * Detecta si el sistema solicita alto contraste.
 * @returns {boolean}
 */
function getSystemHighContrast() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-contrast: more)').matches
  }
  return false
}

/**
 * Carga el tema persistido en localStorage con validación estricta.
 * @returns {'light' | 'dark' | null}
 */
function loadSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved && VALID_THEMES.includes(saved)) return saved
  } catch (error) {
    console.warn('[AstroCal] No se pudo acceder a localStorage para el tema:', error.message)
  }
  return null
}

/**
 * Carga la preferencia de alto contraste desde localStorage.
 * @returns {boolean | null}
 */
function loadSavedContrast() {
  try {
    const saved = localStorage.getItem(CONTRAST_KEY)
    if (saved && VALID_BOOLEANS.includes(saved)) return saved === 'true'
  } catch (error) {
    console.warn('[AstroCal] No se pudo acceder a localStorage para el contraste:', error.message)
  }
  return null
}

/**
 * Persiste tema en localStorage de forma segura.
 * @param {'light' | 'dark'} theme
 */
function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch (error) {
    console.warn('[AstroCal] No se pudo guardar el tema en localStorage:', error.message)
  }
}

/**
 * Persiste la preferencia de alto contraste en localStorage de forma segura.
 * @param {boolean} value
 */
function saveContrast(value) {
  try {
    localStorage.setItem(CONTRAST_KEY, String(value))
  } catch (error) {
    console.warn('[AstroCal] No se pudo guardar el contraste en localStorage:', error.message)
  }
}

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    return loadSavedTheme() || getSystemTheme()
  })

  const [highContrast, setHighContrast] = useState(() => {
    const saved = loadSavedContrast()
    return saved !== null ? saved : getSystemHighContrast()
  })

  // Aplicar tema al atributo data-theme del documento
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Aplicar alto contraste al atributo data-high-contrast del documento
  useEffect(() => {
    document.documentElement.setAttribute('data-high-contrast', String(highContrast))
  }, [highContrast])

  /**
   * Alterna entre tema claro y oscuro con persistencia.
   */
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      saveTheme(next)
      return next
    })
  }, [])

  /**
   * Mejora 44: Alterna el modo de alto contraste con persistencia.
   */
  const toggleHighContrast = useCallback(() => {
    setHighContrast((prev) => {
      const next = !prev
      saveContrast(next)
      return next
    })
  }, [])

  return { theme, toggleTheme, highContrast, toggleHighContrast }
}
