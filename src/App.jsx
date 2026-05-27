import React, { useState } from 'react'

function App() {
  const [activeView, setActiveView] = useState('month') // 'month' | 'year' | 'day' | 'agenda'

  return (
    <div className="calendar-layout">
      {/* Sidebar: Event manager & filters */}
      <aside className="calendar-sidebar glass-card">
        <div className="sidebar-header">
          <div className="logo-area">
            <span className="logo-dot"></span>
            <h2>AstroCal</h2>
          </div>
          <span className="badge">v1.0.0</span>
        </div>

        <div className="selected-date-preview">
          <p className="weekday-label">Martes</p>
          <h1 className="day-number">26</h1>
          <p className="month-year-label">Mayo, 2026</p>
        </div>

        <div className="divider"></div>

        {/* Placeholder for Events List */}
        <div className="upcoming-events-section">
          <h3>Eventos del Día</h3>
          <div className="events-list-placeholder">
            <p className="no-events-text">No hay eventos para este día.</p>
          </div>
        </div>

        {/* Placeholder for Filters */}
        <div className="filters-section">
          <h3>Categorías</h3>
          <div className="category-list">
            <label className="category-item">
              <span className="dot dot-work"></span>
              Trabajo
            </label>
            <label className="category-item">
              <span className="dot dot-personal"></span>
              Personal
            </label>
            <label className="category-item">
              <span className="dot dot-meeting"></span>
              Reuniones
            </label>
            <label className="category-item">
              <span className="dot dot-holiday"></span>
              Festivos
            </label>
          </div>
        </div>
      </aside>

      {/* Main Calendar View Area */}
      <main className="calendar-main glass-card">
        {/* Navigation & Header */}
        <header className="calendar-header">
          <div className="navigation-controls">
            <button className="nav-btn" aria-label="Mes anterior">
              &lt;
            </button>
            <h2 className="current-period">Mayo 2026</h2>
            <button className="nav-btn" aria-label="Mes siguiente">
              &gt;
            </button>
            <button className="today-btn">Hoy</button>
          </div>

          {/* View Mode Toggle Buttons */}
          <div className="view-selector glass-card">
            {['month', 'year', 'day', 'agenda'].map((view) => (
              <button
                key={view}
                className={`view-btn ${activeView === view ? 'active' : ''}`}
                onClick={() => setActiveView(view)}
              >
                {view === 'month' && 'Mes'}
                {view === 'year' && 'Año'}
                {view === 'day' && 'Día'}
                {view === 'agenda' && 'Agenda'}
              </button>
            ))}
          </div>
        </header>

        {/* Month grid layout draft */}
        <div className="calendar-view-container">
          <div className="month-grid-draft">
            <p className="draft-placeholder">
              Rejilla del Calendario ({activeView}) cargándose...
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
