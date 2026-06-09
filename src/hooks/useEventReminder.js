import { useEffect, useRef } from 'react'

/**
 * useEventReminder.js
 * Hook que revisa cada minuto si algún evento del día actual
 * comenzará en los próximos 15 minutos y dispara un toast de recordatorio.
 *
 * Buenas prácticas:
 * - Intervalo limpiado al desmontar (no memory leaks).
 * - Evita recordatorios duplicados usando un Set de IDs ya notificados.
 *   El Set se resetea cada vez que cambia el día (medianoche).
 * - Solo accede a datos ya sanitizados; no ejecuta strings como código.
 * - No usa eval() ni innerHTML.
 *
 * Seguridad:
 * - Los títulos de eventos se muestran como texto plano en el toast.
 * - No se expone ningún dato a contextos externos.
 *
 * @param {Array}    events   - Lista de eventos del calendario.
 * @param {Function} addToast - Función del contexto de toasts.
 */
export function useEventReminder(events, addToast) {
  /** Set de IDs ya notificados para evitar toast repetidos */
  const notifiedRef = useRef(new Set())
  /** El día actual guardado para detectar cambio de día y resetear el Set */
  const lastDayRef  = useRef(null)

  useEffect(() => {
    /**
     * Comprueba si algún evento del día actual empieza en los próximos
     * REMINDER_MINUTES minutos y emite un toast si aún no fue notificado.
     */
    const REMINDER_MINUTES = 15

    const check = () => {
      const now = new Date()
      const today = now.getDate()

      // Resetear notificaciones al cambiar de día
      if (lastDayRef.current !== today) {
        notifiedRef.current = new Set()
        lastDayRef.current  = today
      }

      const currentMinutes = now.getHours() * 60 + now.getMinutes()

      for (const evt of events) {
        // Solo eventos de hoy
        if (
          evt.year  !== now.getFullYear() ||
          evt.month !== now.getMonth()    ||
          evt.day   !== today
        ) {
          continue
        }

        // Parsear hora de inicio del evento
        const parts = evt.startTime?.split(':')
        if (!parts || parts.length < 2) continue
        const [hStr, mStr] = parts
        const h = parseInt(hStr, 10)
        const m = parseInt(mStr, 10)
        if (isNaN(h) || isNaN(m)) continue

        const eventMinutes = h * 60 + m
        const diff = eventMinutes - currentMinutes

        // Notificar si el evento empieza entre 0 y REMINDER_MINUTES minutos
        if (diff >= 0 && diff <= REMINDER_MINUTES && !notifiedRef.current.has(evt.id)) {
          notifiedRef.current.add(evt.id)

          const msg = diff === 0
            ? `"${evt.title}" está comenzando ahora`
            : `"${evt.title}" comienza en ${diff} min (${evt.startTime})`

          addToast(msg, 'warning')
        }
      }
    }

    // Revisar inmediatamente y luego cada 60 segundos
    check()
    const intervalId = setInterval(check, 60_000)

    // Limpieza: cancelar el intervalo al desmontar
    return () => clearInterval(intervalId)
  }, [events, addToast])
}
