import React, { useEffect, useRef } from 'react'

/**
 * KeyboardShortcutsModal.jsx
 * Modal de referencia rápida de atajos de teclado de AstroCal.
 *
 * Buenas prácticas:
 * - Accesibilidad: role="dialog", aria-modal, aria-label, focus trap.
 * - Cierre con Escape o clic fuera.
 * - No interfiere con inputs/textareas.
 * - Atributo aria-keyshortcuts implícito documentado visualmente con <kbd>.
 * - Datos estáticos (no vienen del usuario): seguros, sin sanitizar.
 */

const SHORTCUT_GROUPS = [
  {
    title: 'Navegación',
    shortcuts: [
      { keys: ['←', '→'], desc: 'Día anterior / siguiente' },
      { keys: ['↑', '↓'], desc: 'Semana anterior / siguiente' },
      { keys: ['Inicio'], desc: 'Primer día del mes' },
      { keys: ['Fin'], desc: 'Último día del mes' },
      { keys: ['T'], desc: 'Ir al día de hoy' },
    ],
  },
  {
    title: 'Vistas',
    shortcuts: [
      { keys: ['M'], desc: 'Vista de Mes' },
      { keys: ['A'], desc: 'Vista de Año' },
      { keys: ['D'], desc: 'Vista de Día' },
      { keys: ['G'], desc: 'Vista de Agenda' },
    ],
  },
  {
    title: 'Eventos',
    shortcuts: [
      { keys: ['N'], desc: 'Nuevo evento' },
      { keys: ['?'], desc: 'Mostrar / ocultar ayuda de atajos' },
    ],
  },
]

function KeyboardShortcutsModal({ isOpen, onClose }) {
  const modalRef = useRef(null)

  // Focus al abrir y cerrar con Escape
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === '?') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    modalRef.current?.focus()

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Cerrar al hacer clic en el backdrop
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="shortcuts-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Atajos de teclado de AstroCal"
      onClick={handleBackdropClick}
    >
      <div
        className="shortcuts-modal"
        ref={modalRef}
        tabIndex={-1}
      >
        {/* Encabezado */}
        <div className="shortcuts-modal__header">
          <div className="shortcuts-modal__title-area">
            <span className="shortcuts-modal__icon" aria-hidden="true">⌨️</span>
            <h2 className="shortcuts-modal__title">Atajos de teclado</h2>
          </div>
          <button
            className="shortcuts-modal__close"
            onClick={onClose}
            aria-label="Cerrar panel de atajos"
          >
            ✕
          </button>
        </div>

        {/* Grupos de atajos */}
        <div className="shortcuts-modal__body">
          {SHORTCUT_GROUPS.map((group) => (
            <section key={group.title} className="shortcuts-group">
              <h3 className="shortcuts-group__title">{group.title}</h3>
              <ul className="shortcuts-group__list">
                {group.shortcuts.map(({ keys, desc }) => (
                  <li key={desc} className="shortcut-row">
                    <span className="shortcut-row__desc">{desc}</span>
                    <span className="shortcut-row__keys">
                      {keys.map((k) => (
                        <kbd key={k} className="shortcut-kbd">{k}</kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Pie */}
        <div className="shortcuts-modal__footer">
          <span className="shortcuts-modal__hint">
            Presiona <kbd className="shortcut-kbd shortcut-kbd--inline">?</kbd> o{' '}
            <kbd className="shortcut-kbd shortcut-kbd--inline">Esc</kbd> para cerrar
          </span>
        </div>
      </div>
    </div>
  )
}

export default KeyboardShortcutsModal
