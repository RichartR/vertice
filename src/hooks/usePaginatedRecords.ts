// Hook para paginar una lista de registros en el frontend.
import { useMemo } from 'react'

export function usePaginatedRecords<T>(
  registros: T[],
  pagina: number,
  registrosPorPagina: number,
) {
  const totalPaginas = Math.max(1, Math.ceil(registros.length / registrosPorPagina))
  const paginaActual = Math.min(pagina, totalPaginas)

  const registrosPaginados = useMemo(
    () => registros.slice((paginaActual - 1) * registrosPorPagina, paginaActual * registrosPorPagina),
    [registros, paginaActual, registrosPorPagina],
  )

  return { registrosPaginados, totalPaginas, paginaActual }
}
