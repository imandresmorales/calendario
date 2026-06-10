import React, { useState, useEffect } from 'react'

/**
 * AriaLiveAnnouncer.jsx
 * Componente accesible global para anuncios dinámicos a lectores de pantalla (ARIA Live Region).
 */
export function AriaLiveAnnouncer() {
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    const handleAnnounce = (e) => {
      setAnnouncement(e.detail)
    }
    window.addEventListener('announce-aria', handleAnnounce)
    return () => window.removeEventListener('announce-aria', handleAnnounce)
  }, [])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        border: '0'
      }}
    >
      {announcement}
    </div>
  )
}

/**
 * Función helper para disparar anuncios en vivo desde cualquier parte de la aplicación.
 * @param {string} message - El mensaje a anunciar por el lector de pantalla.
 */
export function announceToScreenReader(message) {
  const event = new CustomEvent('announce-aria', { detail: message })
  window.dispatchEvent(event)
}
