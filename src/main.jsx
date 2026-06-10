import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CalendarProvider } from './context/CalendarContext'
import { ToastProvider } from './context/ToastContext'
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <CalendarProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </CalendarProvider>
    </ErrorBoundary>
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('[AstroCal] Service Worker registrado:', reg.scope))
      .catch((err) => console.error('[AstroCal] Error al registrar Service Worker:', err));
  });
}

