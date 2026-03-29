// Hook que pagina en memoria una lista de registros ya filtrados.
// Se recalcula solo cuando cambian los registros o los parámetros de paginación.
import { useMemo } from 'react'
import type { Registro } from './useRecords'

export function usePaginatedRecords(
  registros: Registro[],
  pagina: number,
  registrosPorPagina: number
) {
  const [registrosPaginados, totalPaginas] = useMemo(() => {
    const inicio = (pagina - 1) * registrosPorPagina
    const fin = inicio + registrosPorPagina
    const paginated = registros.slice(inicio, fin)
    const total = Math.ceil(registros.length / registrosPorPagina)
    return [paginated, total]
  }, [registros, pagina, registrosPorPagina])

  return { registrosPaginados, totalPaginas }
}
