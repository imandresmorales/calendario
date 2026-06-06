import { useState, useEffect } from 'react'

/**
 * useDebounce.js
 * Hook personalizado que retrasa la actualización de un valor
 * hasta que el usuario deje de escribir durante el período especificado.
 *
 * Buenas prácticas de rendimiento:
 * - Evita re-renders excesivos al filtrar grandes listas de eventos.
 * - Reduce la carga de trabajo en useMemo del CalendarContext.
 * - Timer limpiado correctamente al desmontar (sin memory leaks).
 *
 * @param {*}      value    - El valor a debouncear.
 * @param {number} delayMs  - Milisegundos de espera (default: 250).
 * @returns {*} El valor debounceado.
 */
export function useDebounce(value, delayMs = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)

    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debouncedValue
}
