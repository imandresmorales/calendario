import React, { useState, useCallback } from 'react'
import { useCalendar } from './context/CalendarContext'
import { getMonthNames, getWeekdayName } from './utils/dateUtils'
import MonthGrid from './components/MonthGrid/MonthGrid'
import YearView from './components/YearView/YearView'
import DayView from './components/DayView/DayView'
import AgendaView from './components/AgendaView/AgendaView'
import EventModal from './components/EventModal/EventModal'
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation'
import { useTheme } from './hooks/useTheme'
import { useToast } from './context/ToastContext'
import { eventsToICSString, parseICS, parseJSON } from './utils/importExportUtils'
import ConfirmationModal from './components/ConfirmationModal/ConfirmationModal'

function App() {
  const {
    selectedDate,
    viewDate,
    activeView,
    events,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    setActiveView,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsForDay,
    searchQuery,
    setSearchQuery,
    selectedCategories,
    toggleCategory,
    importEvents,
    clearAllEvents,
    jumpToPeriod,
  } = useCalendar()

  // Estado del modal de eventos
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)

  // Estado del modal de confirmación personalizado
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger',
    onConfirm: () => {},
  })

  const triggerConfirm = useCallback((title, message, onConfirm, type = 'danger') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      type,
      onConfirm,
    })
  }, [])

  const closeConfirm = useCallback(() => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }))
  }, [])

  const monthNames = getMonthNames()
  const { theme, toggleTheme } = useTheme()
  const { addToast } = useToast()
  useKeyboardNavigation() // Activar navegación por teclado (flechas, Home, End, Escape)
  const weekdayName = getWeekdayName(selectedDate.year, selectedDate.month, selectedDate.day)

  const yearsRange = React.useMemo(() => {
    const startYear = new Date().getFullYear() - 10
    return Array.from({ length: 21 }, (_, i) => startYear + i)
  }, [])

  const handleMonthChange = useCallback((e) => {
    jumpToPeriod(viewDate.year, parseInt(e.target.value, 10))
  }, [viewDate.year, jumpToPeriod])

  const handleYearChange = useCallback((e) => {
    jumpToPeriod(parseInt(e.target.value, 10), viewDate.month)
  }, [viewDate.month, jumpToPeriod])

  // Eventos del día seleccionado para el sidebar
  const todaysEvents = getEventsForDay(selectedDate.year, selectedDate.month, selectedDate.day)

  /**
   * Abre el modal para crear un nuevo evento.
   */
  const handleNewEvent = useCallback(() => {
    setEditingEvent(null)
    setIsModalOpen(true)
  }, [])

  /**
   * Abre el modal para editar un evento existente.
   */
  const handleEditEvent = useCallback((event) => {
    setEditingEvent(event)
    setIsModalOpen(true)
  }, [])

  /**
   * Guarda un evento (nuevo o editado) a tráves del CRUD del contexto.
   */
  const handleSaveEvent = useCallback((eventData) => {
    if (eventData.id && editingEvent) {
      updateEvent(eventData)
      addToast('Evento actualizado correctamente', 'success')
    } else {
      addEvent(eventData)
      addToast('Evento creado exitosamente', 'success')
    }
  }, [editingEvent, addEvent, updateEvent, addToast])

  /**
   * Abre modal de confirmación antes de eliminar el evento.
   */
  const handleDeleteEvent = useCallback((eventId) => {
    const event = events.find((evt) => evt.id === eventId)
    if (!event) return

    triggerConfirm(
      '¿Eliminar Evento?',
      `¿Estás seguro de que deseas eliminar el evento "${event.title}"? Esta acción no se puede deshacer.`,
      () => {
        deleteEvent(eventId)
        addToast('Evento eliminado', 'info')
      },
      'danger'
    )
  }, [events, deleteEvent, triggerConfirm, addToast])

  /**
   * Abre modal de confirmación antes de borrar todos los eventos.
   */
  const handleClearAllEvents = useCallback(() => {
    if (events.length === 0) {
      addToast('No hay eventos para borrar', 'warning')
      return
    }
    triggerConfirm(
      '¿Borrar TODOS los Eventos?',
      '¿Estás seguro de que deseas eliminar TODOS los eventos agendados? Perderás de forma permanente todos los datos guardados.',
      () => {
        clearAllEvents()
        addToast('Todos los eventos han sido eliminados', 'info')
      },
      'danger'
    )
  }, [events, clearAllEvents, triggerConfirm, addToast])

  /**
   * Exporta todos los eventos en formato JSON.
   */
  const handleExportJSON = useCallback(() => {
    if (events.length === 0) {
      addToast('No hay eventos para exportar', 'warning')
      return
    }
    try {
      const dataStr = JSON.stringify(events, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
      const exportFileDefaultName = `astrocal_events_${new Date().toISOString().slice(0, 10)}.json`

      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
      addToast('Eventos exportados en JSON', 'success')
    } catch (e) {
      addToast('Error al exportar eventos', 'error')
    }
  }, [events, addToast])

  /**
   * Exporta todos los eventos en formato iCalendar (.ics).
   */
  const handleExportICS = useCallback(() => {
    if (events.length === 0) {
      addToast('No hay eventos para exportar', 'warning')
      return
    }
    try {
      const icsString = eventsToICSString(events)
      const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' })
      const dataUri = URL.createObjectURL(blob)
      const exportFileDefaultName = `astrocal_calendar_${new Date().toISOString().slice(0, 10)}.ics`

      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
      
      setTimeout(() => URL.revokeObjectURL(dataUri), 100)
      addToast('Calendario exportado en ICS', 'success')
    } catch (e) {
      addToast('Error al exportar iCalendar', 'error')
    }
  }, [events, addToast])

  /**
   * Importa eventos desde un archivo JSON o ICS con validación y sanitización estricta.
   */
  const handleImportFile = useCallback((e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target.result
      let imported = []

      if (file.name.endsWith('.json')) {
        imported = parseJSON(content)
      } else if (file.name.endsWith('.ics')) {
        imported = parseICS(content)
      } else {
        addToast('Formato de archivo no soportado. Use .json o .ics', 'error')
        return
      }

      if (imported.length === 0) {
        addToast('No se encontraron eventos válidos para importar', 'warning')
      } else {
        importEvents(imported)
        addToast(`Se importaron ${imported.length} eventos exitosamente`, 'success')
      }
    }
    
    reader.onerror = () => {
      addToast('Error al leer el archivo', 'error')
    }

    reader.readAsText(file)
    e.target.value = ''
  }, [importEvents, addToast])

  /**
   * Mapa de colores de categoría para los indicadores del sidebar.
   */
  const categoryColors = {
    work: 'dot-work',
    personal: 'dot-personal',
    meeting: 'dot-meeting',
    holiday: 'dot-holiday',
  }

  /**
   * Renderiza la vista activa del calendario.
   * Las 4 vistas están implementadas: Mes, Año, Día y Agenda.
   */
  const renderActiveView = () => {
    switch (activeView) {
      case 'month':
        return <MonthGrid />
      case 'year':
        return <YearView />
      case 'day':
        return <DayView />
      case 'agenda':
        return <AgendaView />
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
          <div className="sidebar-header__actions">
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              title={theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <span className="badge">v1.0.0</span>
          </div>
        </div>

        <div className="selected-date-preview">
          <p className="weekday-label">{weekdayName}</p>
          <h1 className="day-number">{selectedDate.day}</h1>
          <p className="month-year-label">
            {monthNames[selectedDate.month]}, {selectedDate.year}
          </p>
        </div>

        {/* Botón para agregar evento */}
        <button className="add-event-btn" onClick={handleNewEvent}>
          <span aria-hidden="true">+</span> Nuevo Evento
        </button>

        {/* Buscador de Eventos */}
        <div className="search-section">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar eventos..."
            className="search-input"
            aria-label="Buscar eventos por título o descripción"
            maxLength={100}
          />
        </div>

        <div className="divider" role="separator"></div>

        {/* Lista de eventos del día */}
        <div className="upcoming-events-section">
          <h3>Eventos del Día</h3>
          {todaysEvents.length > 0 ? (
            <div className="events-list">
              {todaysEvents.map((evt) => (
                <div key={evt.id} className="event-card" onClick={() => handleEditEvent(evt)}>
                  <div className="event-card__header">
                    <span className={`dot ${categoryColors[evt.category] || 'dot-work'}`} aria-hidden="true"></span>
                    <span className="event-card__time">{evt.startTime} - {evt.endTime}</span>
                  </div>
                  <p className="event-card__title">{evt.title}</p>
                  {evt.description && (
                    <p className="event-card__desc">{evt.description}</p>
                  )}
                  <button
                    className="event-card__delete"
                    onClick={(e) => { e.stopPropagation(); handleDeleteEvent(evt.id); }}
                    aria-label={`Eliminar evento: ${evt.title}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="events-list-placeholder">
              <p className="no-events-text">No hay eventos para este día.</p>
            </div>
          )}
        </div>

        {/* Filtros por categoría */}
        <div className="filters-section">
          <h3>Categorías</h3>
          <div className="category-list">
            {[
              { id: 'work', label: 'Trabajo', dotClass: 'dot-work' },
              { id: 'personal', label: 'Personal', dotClass: 'dot-personal' },
              { id: 'meeting', label: 'Reuniones', dotClass: 'dot-meeting' },
              { id: 'holiday', label: 'Festivos', dotClass: 'dot-holiday' },
            ].map((cat) => {
              const isChecked = selectedCategories.includes(cat.id)
              return (
                <label key={cat.id} className={`category-item ${isChecked ? 'active' : 'inactive'}`}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCategory(cat.id)}
                    className="category-checkbox"
                    aria-label={`Filtrar por ${cat.label}`}
                  />
                  <span className={`dot ${cat.dotClass}`} aria-hidden="true"></span>
                  {cat.label}
                </label>
              )
            })}
          </div>
        </div>

        <div className="divider" role="separator"></div>

        {/* Herramientas de Datos (Importar/Exportar/Borrar) */}
        <div className="data-section">
          <h3>Datos</h3>
          <div className="data-buttons">
            <button className="data-btn" onClick={handleExportJSON} title="Exportar eventos como JSON">
              📥 JSON
            </button>
            <button className="data-btn" onClick={handleExportICS} title="Exportar eventos como ICS (Outlook/Google)">
              📅 ICS
            </button>
            <label className="data-btn data-btn--upload" title="Importar desde JSON o ICS">
              📤 Importar
              <input
                type="file"
                accept=".json,.ics"
                onChange={handleImportFile}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          <button className="clear-all-btn" onClick={handleClearAllEvents} title="Borrar permanentemente todos los eventos">
            🗑️ Borrar todos los eventos
          </button>
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
            <div className="current-period-selectors">
              <select
                value={viewDate.month}
                onChange={handleMonthChange}
                className="period-select"
                aria-label="Seleccionar mes"
              >
                {monthNames.map((name, index) => (
                  <option key={index} value={index}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                value={viewDate.year}
                onChange={handleYearChange}
                className="period-select"
                aria-label="Seleccionar año"
              >
                {yearsRange.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
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

      {/* Modal de eventos */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
        initialData={editingEvent}
        selectedDate={selectedDate}
      />

      {/* Modal de confirmación personalizado */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />
    </div>
  )
}

export default App
