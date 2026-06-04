import React from 'react'

/**
 * SkeletonLoader.jsx
 * Pantalla de carga tipo "esqueleto" para mostrar durante la hidratación inicial
 * de los datos de localStorage.
 *
 * Buenas prácticas:
 * - Nunca muestra datos reales: solo placeholders visuales.
 * - Accesible: aria-label descriptivo y aria-busy en el contenedor.
 * - Usa animación CSS shimmer definida en index.css (sin JS para animaciones).
 * - Sin estado propio: componente puramente presentacional.
 */
function SkeletonLoader() {
  return (
    <div className="skeleton-overlay" role="status" aria-label="Cargando calendario..." aria-busy="true">
      <div className="skeleton-layout">

        {/* Sidebar skeleton */}
        <aside className="skeleton-sidebar">
          <div className="skeleton-logo">
            <div className="sk sk--circle sk--lg"></div>
            <div className="sk sk--bar sk--wide"></div>
          </div>

          <div className="skeleton-sidebar__section">
            <div className="sk sk--bar sk--short"></div>
            <div className="sk sk--bar sk--medium"></div>
            <div className="sk sk--bar sk--medium"></div>
            <div className="sk sk--bar sk--short"></div>
            <div className="sk sk--bar sk--wide"></div>
          </div>

          <div className="skeleton-sidebar__section">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton-category">
                <div className="sk sk--circle sk--sm"></div>
                <div className="sk sk--bar sk--medium"></div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main calendar skeleton */}
        <main className="skeleton-main">
          {/* Header */}
          <header className="skeleton-header">
            <div className="sk sk--circle sk--sm"></div>
            <div className="sk sk--bar sk--wide"></div>
            <div className="sk sk--circle sk--sm"></div>
            <div className="skeleton-header__tabs">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="sk sk--bar sk--tab"></div>
              ))}
            </div>
          </header>

          {/* Grid */}
          <div className="skeleton-grid">
            {/* Weekday headers */}
            <div className="skeleton-grid__weekdays">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="sk sk--bar sk--weekday"></div>
              ))}
            </div>

            {/* Day cells */}
            <div className="skeleton-grid__days">
              {[...Array(35)].map((_, i) => (
                <div key={i} className="skeleton-grid__day">
                  <div className="sk sk--circle sk--day-num"></div>
                  {(i % 7 === 2 || i % 11 === 3) && (
                    <div className="sk sk--bar sk--event-bar"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default SkeletonLoader
