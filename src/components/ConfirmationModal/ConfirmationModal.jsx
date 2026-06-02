import React, { useEffect, useRef, useCallback } from 'react'

/**
 * ConfirmationModal.jsx
 * Modal de confirmación premium personalizado con diseño glassmorphic.
 * Reemplaza los confirm() del navegador para una mejor experiencia y look de la app.
 *
 * Accesibilidad (a11y):
 * - Focus Trap: Mantiene el foco dentro del modal mientras esté abierto.
 * - Soporte tecla Escape para cerrar.
 * - Atributos ARIA (role="dialog", aria-modal="true").
 */
function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger', // 'danger' | 'warning' | 'info'
}) {
  const modalRef = useRef(null)
  const confirmBtnRef = useRef(null)
  const cancelBtnRef = useRef(null)

  // Cerrar al presionar Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Capturar foco dentro del modal (Focus Trap)
  useEffect(() => {
    if (isOpen) {
      // Auto focus al botón de cancelar (acción segura por defecto)
      setTimeout(() => cancelBtnRef.current?.focus(), 100)

      const handleFocusTrap = (e) => {
        if (e.key !== 'Tab') return

        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusableElements || focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey) {
          // Shift + Tab -> ir al último elemento si estamos en el primero
          if (document.activeElement === firstElement) {
            lastElement.focus()
            e.preventDefault()
          }
        } else {
          // Tab -> ir al primer elemento si estamos en el último
          if (document.activeElement === lastElement) {
            firstElement.focus()
            e.preventDefault()
          }
        }
      }

      document.addEventListener('keydown', handleFocusTrap)
      return () => document.removeEventListener('keydown', handleFocusTrap)
    }
  }, [isOpen])

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

  if (!isOpen) return null

  return (
    <div
      className="confirm-modal__backdrop"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="confirm-modal glass-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
      >
        <div className="confirm-modal__header">
          <h3 id="confirm-modal-title" className="confirm-modal__title">
            {title}
          </h3>
          <button
            className="confirm-modal__close-btn"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        <div className="confirm-modal__body">
          <p id="confirm-modal-desc" className="confirm-modal__message">
            {message}
          </p>
        </div>

        <div className="confirm-modal__actions">
          <button
            ref={cancelBtnRef}
            type="button"
            className="confirm-modal__btn-cancel"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className={`confirm-modal__btn-confirm confirm-modal__btn-confirm--${type}`}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(ConfirmationModal)
