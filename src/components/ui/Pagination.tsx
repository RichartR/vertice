// Componente reutilizable para los controles de paginación (selector de tamaño y botones)
import Select from './Select'

type PaginationProps = {
  totalPaginas: number
  paginaActual: number
  registrosPorPagina: number
  opcionesRegistrosPorPagina: { value: string; label: string }[]
  onPaginaChange: (pagina: number) => void
  onRegistrosPorPaginaChange: (numero: number) => void
}

export default function Pagination({
  totalPaginas,
  paginaActual,
  registrosPorPagina,
  opcionesRegistrosPorPagina,
  onPaginaChange,
  onRegistrosPorPaginaChange,
}: PaginationProps) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm">
      <div className="flex-1">
        <Select
          value={String(registrosPorPagina)}
          onChange={v => onRegistrosPorPaginaChange(Number(v))}
          options={opcionesRegistrosPorPagina}
          className="w-40"
        />
      </div>
      
      <div className="flex items-center gap-2">
        {totalPaginas > 1 && (
          <button
            onClick={() => onPaginaChange(paginaActual - 1)}
            disabled={paginaActual === 1}
            className="px-2.5 py-1 rounded-md border border-gray-200 text-xs text-gray-600 hover:border-accent hover:bg-accent/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            Anterior
          </button>
        )}
        <span className="text-gray-500">
          Página {paginaActual} de {totalPaginas}
        </span>
        {totalPaginas > 1 && (
          <button
            onClick={() => onPaginaChange(paginaActual + 1)}
            disabled={paginaActual === totalPaginas}
            className="px-2.5 py-1 rounded-md border border-gray-200 text-xs text-gray-600 hover:border-accent hover:bg-accent/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            Siguiente
          </button>
        )}
      </div>

      <div className="flex-1" />
    </div>
  )
}
