import React from 'react'

/**
 * EmptyState.jsx
 * Componente de estado vacío reutilizable con ilustración SVG inline,
 * animación suave y mensaje contextual.
 *
 * Buenas prácticas:
 * - SVG inline sin dangerouslySetInnerHTML (definido directamente en JSX).
 * - aria-hidden en la ilustración decorativa.
 * - Mensaje personalizable vía props.
 * - Acción opcional (botón CTA).
 */

function EmptyState({ title, description, onAction, actionLabel }) {
  return (
    <div className="empty-state" role="status" aria-live="polite">
      {/* Ilustración SVG decorativa */}
      <div className="empty-state__illustration" aria-hidden="true">
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="empty-state__svg"
        >
          {/* Calendario base */}
          <rect
            x="14"
            y="22"
            width="92"
            height="82"
            rx="10"
            className="empty-state__cal-bg"
          />
          {/* Cabecera del calendario */}
          <rect
            x="14"
            y="22"
            width="92"
            height="26"
            rx="10"
            className="empty-state__cal-header"
          />
          {/* Argollas del calendario */}
          <rect x="36" y="12" width="8" height="20" rx="4" className="empty-state__ring" />
          <rect x="76" y="12" width="8" height="20" rx="4" className="empty-state__ring" />
          {/* Líneas de contenido vacías */}
          <rect x="26" y="58" width="20" height="6" rx="3" className="empty-state__line" />
          <rect x="52" y="58" width="20" height="6" rx="3" className="empty-state__line" />
          <rect x="78" y="58" width="16" height="6" rx="3" className="empty-state__line" />
          <rect x="26" y="72" width="16" height="6" rx="3" className="empty-state__line" />
          <rect x="52" y="72" width="20" height="6" rx="3" className="empty-state__line" />
          <rect x="78" y="72" width="20" height="6" rx="3" className="empty-state__line" />
          <rect x="26" y="86" width="20" height="6" rx="3" className="empty-state__line" />
          {/* Estrella decorativa */}
          <circle cx="90" cy="90" r="14" className="empty-state__badge" />
          <text x="90" y="95" textAnchor="middle" fontSize="14" className="empty-state__badge-icon">✦</text>
        </svg>
      </div>

      <p className="empty-state__title">{title}</p>
      {description && (
        <p className="empty-state__desc">{description}</p>
      )}
      {onAction && actionLabel && (
        <button className="empty-state__action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default React.memo(EmptyState)
