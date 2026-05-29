import React from 'react'
import { useCalendar } from './context/CalendarContext'
import { getMonthNames, getWeekdayName } from './utils/dateUtils'
import MonthGrid from './components/MonthGrid/MonthGrid'
import YearView from './components/YearView/YearView'

function App() {
  const {
    selectedDate,
    viewDate,
    activeView,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    setActiveView,
  } = useCalendar()

  const monthNames = getMonthNames()
  const weekdayName = getWeekdayName(selectedDate.year, selectedDate.month, selectedDate.day)

  /**
   * Renderiza la vista activa del calendario.
   * Solo MonthGrid está implementado por ahora; las demás vistas
   * se irán añadiendo en mejoras posteriores.
   */
  const renderActiveView = () => {
    switch (activeView) {
      case 'month':
        return <MonthGrid />
      case 'year':
        return <YearView />
      case 'day':
        return <p className="draft-placeholder">Vista de Día — próximamente</p>
      case 'agenda':
        return <p className="draft-placeholder">Vista Agenda — próximamente</p>
      default:
        return <MonthGrid />
    }
  }

  return (
    <div className="calendar-layout">
      {/* Sidebar: Event manager & filters */}
      <aside className="calendar-sidebar glass-card" role="complementary" aria-label="Panel lateral del calendario">
        <div className="sidebar-header">
          <div className="logo-area">
            <span className="logo-dot" aria-hidden="true"></span>
            <h2>AstroCal</h2>
          </div>
          <span className="badge">v1.0.0</span>
        </div>

        <div className="selected-date-preview">
          <p className="weekday-label">{weekdayName}</p>
          <h1 className="day-number">{selectedDate.day}</h1>
          <p className="month-year-label">
            {monthNames[selectedDate.month]}, {selectedDate.year}
          </p>
        </div>

        <div className="divider" role="separator"></div>

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
              <span className="dot dot-work" aria-hidden="true"></span>
              Trabajo
            </label>
            <label className="category-item">
              <span className="dot dot-personal" aria-hidden="true"></span>
              Personal
            </label>
            <label className="category-item">
              <span className="dot dot-meeting" aria-hidden="true"></span>
              Reuniones
            </label>
            <label className="category-item">
              <span className="dot dot-holiday" aria-hidden="true"></span>
              Festivos
            </label>
          </div>
        </div>
      </aside>

      {/* Main Calendar View Area */}
      <main className="calendar-main glass-card" role="main" aria-label="Vista principal del calendario">
        {/* Navigation & Header */}
        <header className="calendar-header">
          <div className="navigation-controls">
            <button className="nav-btn" aria-label="Mes anterior" onClick={goToPreviousMonth}>
              ◀
            </button>
            <h2 className="current-period">
              {monthNames[viewDate.month]} {viewDate.year}
            </h2>
            <button className="nav-btn" aria-label="Mes siguiente" onClick={goToNextMonth}>
              ▶
            </button>
            <button className="today-btn" onClick={goToToday}>Hoy</button>
          </div>

          {/* View Mode Toggle Buttons */}
          <div className="view-selector glass-card" role="tablist" aria-label="Selector de vista del calendario">
            {['month', 'year', 'day', 'agenda'].map((view) => (
              <button
                key={view}
                role="tab"
                aria-selected={activeView === view}
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

        {/* Calendar view container */}
        <div className="calendar-view-container" role="tabpanel">
          {renderActiveView()}
        </div>
      </main>
    </div>
  )
}

export default App

