import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CalendarProvider } from './context/CalendarContext'
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <CalendarProvider>
        <App />
      </CalendarProvider>
    </ErrorBoundary>
  </StrictMode>,
)
