import React, { createContext, useContext, useState, useCallback, useRef } from 'react'

/**
 * ToastContext.jsx
 * Sistema de notificaciones tipo toast para feedback visual al usuario.
 *
 * Buenas prácticas:
 * - Notificaciones auto-dismissibles con duración configurable.
 * - Soporte para tipos: success, error, info, warning.
 * - Máximo 3 toasts visibles simultáneamente (FIFO).
 * - IDs únicos para evitar conflictos de renderizado.
 * - Accesibilidad con role="alert" y aria-live="polite".
 *
 * Seguridad:
 * - Los mensajes se renderizan como texto plano (no HTML).
 * - No acepta contenido arbitrario del usuario sin sanitización previa.
 */

const ToastContext = createContext(null)

const MAX_TOASTS = 3
const DEFAULT_DURATION = 3000

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idCounter = useRef(0)

  /**
   * Agrega un nuevo toast a la lista.
   * @param {string} message - Mensaje a mostrar (texto plano).
   * @param {'success' | 'error' | 'info' | 'warning'} type - Tipo de toast.
   * @param {number} duration - Duración en ms antes de auto-dismiss.
   */
  const addToast = useCallback((message, type = 'info', duration = DEFAULT_DURATION) => {
    const id = ++idCounter.current

    setToasts((prev) => {
      // Limitar a MAX_TOASTS (descartar los más antiguos)
      const updated = [...prev, { id, message, type }]
      return updated.slice(-MAX_TOASTS)
    })

    // Auto-dismiss después de la duración
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  /**
   * Cierra manualmente un toast por ID.
   */
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* Contenedor de toasts */}
      {toasts.length > 0 && (
        <div className="toast-container" aria-live="polite" aria-relevant="additions removals">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`toast toast--${toast.type}`}
              role="alert"
            >
              <span className="toast__icon" aria-hidden="true">
                {toast.type === 'success' && '✓'}
                {toast.type === 'error' && '✕'}
                {toast.type === 'info' && 'ℹ'}
                {toast.type === 'warning' && '⚠'}
              </span>
              <span className="toast__message">{toast.message}</span>
              <button
                className="toast__close"
                onClick={() => removeToast(toast.id)}
                aria-label="Cerrar notificación"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

/**
 * Hook para acceder al sistema de notificaciones toast.
 * @returns {{ addToast: Function }}
 */
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast debe usarse dentro de un <ToastProvider>')
  }
  return context
}
