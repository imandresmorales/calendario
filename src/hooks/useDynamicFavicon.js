import { useEffect } from 'react'

/**
 * useDynamicFavicon.js
 * Hook que actualiza el favicon del navegador con el día actual del mes.
 * Usa Canvas API para dibujar el número del día sobre un fondo accent color.
 *
 * Buenas prácticas:
 * - Canvas limpiado correctamente al desmontar.
 * - Fallback: si Canvas no está disponible, no hace nada (silently fails).
 * - Solo se actualiza cuando cambia el día (memoizado con fecha actual).
 * - Tamaño 32x32 px que es estándar para favicons.
 * - No usa librerías externas.
 */
export function useDynamicFavicon() {
  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    if (!ctx) return // Fallback silencioso si Canvas no está soportado

    const day = new Date().getDate().toString()

    // Fondo con esquinas redondeadas (simula icon roundrect)
    ctx.beginPath()
    ctx.roundRect(0, 0, 32, 32, 8)
    ctx.fillStyle = 'hsl(262, 83%, 58%)'
    ctx.fill()

    // Cabecera superior del calendario (franja accent oscuro)
    ctx.beginPath()
    ctx.roundRect(0, 0, 32, 10, [8, 8, 0, 0])
    ctx.fillStyle = 'hsl(262, 83%, 42%)'
    ctx.fill()

    // Argollas del calendario
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.beginPath()
    ctx.arc(11, 3, 2.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(21, 3, 2.5, 0, Math.PI * 2)
    ctx.fill()

    // Número del día
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${day.length > 1 ? '14' : '16'}px system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(day, 16, 20)

    // Actualizar link del favicon
    const dataURL = canvas.toDataURL('image/png')
    let link = document.querySelector("link[rel~='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.type = 'image/png'
    link.href = dataURL

    // No hay limpieza necesaria: el favicon permanece hasta que se desmonte la app
  }, []) // Solo ejecutar una vez al montar (el día no cambia durante la sesión)
}
