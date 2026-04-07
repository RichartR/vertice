// Hook para debounce. Retrasa la ejecución de una función hasta que ha pasado
// un tiempo determinado sin que se vuelva a llamar. Útil para autoguardado.
import { useCallback, useRef } from 'react'

export function useDebounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fnRef = useRef(fn)

  // Update ref on every render with the latest version of the input function
  fnRef.current = fn

  return useCallback((...args: Parameters<T>) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      fnRef.current(...args)
    }, delay)
  }, [delay]) as T
}
