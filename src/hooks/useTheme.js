import { useState, useEffect, useCallback } from 'react'

/**
 * useTheme.js
 * Hook personalizado para manejar el tema claro/oscuro de la aplicación.
 *
 * Buenas prácticas:
 * - Respeta la preferencia del sistema operativo como valor inicial.
 * - Persiste la elección del usuario en localStorage.
 * - Aplica el tema vía atributo data-theme en <html> (no manipula clases).
 * - No expone datos sensibles en localStorage.
 *
 * Seguridad:
 * - Valida el valor cargado de localStorage (solo acepta 'light' o 'dark').
 * - Manejo seguro de errores de localStorage (cuota, acceso denegado).
 */

const STORAGE_KEY = 'astrocal_theme'
const VALID_THEMES = ['light', 'dark']

/**
 * Obtiene el tema preferido del sistema operativo.
 * @returns {'light' | 'dark'}
 */
function getSystemTheme() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'dark' // Fallback: dark mode por defecto
}

/**
 * Carga el tema persistido en localStorage con validación.
 * @returns {'light' | 'dark' | null}
 */
function loadSavedTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && VALID_THEMES.includes(saved)) {
      return saved
    }
  } catch (error) {
    console.warn('[AstroCal] No se pudo acceder a localStorage para el tema:', error.message)
  }
  return null
}

/**
 * Persiste el tema seleccionado en localStorage.
 * @param {'light' | 'dark'} theme
 */
function saveTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch (error) {
    console.warn('[AstroCal] No se pudo guardar el tema en localStorage:', error.message)
  }
}

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    return loadSavedTheme() || getSystemTheme()
  })

  // Aplicar el tema al atributo data-theme del documento
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  /**
   * Alterna entre tema claro y oscuro.
   * Persiste la elección en localStorage.
   */
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      saveTheme(next)
      return next
    })
  }, [])

  return { theme, toggleTheme }
}
