import React, { Component } from 'react'

/**
 * ErrorBoundary.jsx
 * Componente de clase que captura errores de renderizado en cualquier
 * componente hijo, evitando que la aplicación completa se rompa.
 *
 * Buenas prácticas:
 * - Muestra un fallback amigable en lugar de una pantalla en blanco.
 * - Registra el error en consola para depuración (sin exponer datos al usuario).
 * - Permite al usuario intentar recuperarse recargando la vista.
 *
 * Seguridad:
 * - No expone stack traces ni información interna al usuario final.
 * - Solo muestra un mensaje genérico y un botón de acción.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      errorMessage: '',
    }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Error desconocido',
    }
  }

  componentDidCatch(error, errorInfo) {
    // Registrar error para depuración (nunca exponer al usuario)
    console.error('[AstroCal] Error capturado por ErrorBoundary:', error)
    console.error('[AstroCal] Información del componente:', errorInfo?.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback" role="alert" aria-live="assertive">
          <div className="error-boundary-content glass-card">
            <div className="error-icon" aria-hidden="true">⚠️</div>
            <h2 className="error-title">Algo salió mal</h2>
            <p className="error-description">
              Ha ocurrido un error inesperado en la aplicación.
              Puedes intentar recargar esta sección o volver al inicio.
            </p>
            <div className="error-actions">
              <button
                className="error-btn error-btn-primary"
                onClick={this.handleReset}
              >
                Reintentar
              </button>
              <button
                className="error-btn error-btn-secondary"
                onClick={() => window.location.reload()}
              >
                Recargar página
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
