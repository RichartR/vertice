// Barra de filtros para la tabla de registros.
// Recibe el estado de filtros y callbacks desde ServicePage — no gestiona estado propio.
import type { Filtros } from '../../hooks/useFilteredRecords'
import Select from './Select'

const inputCls = 'px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent'

interface FilterBarProps {
  filtros: Filtros
  onChange: (key: keyof Filtros, value: string) => void
  onReset: () => void
}

export default function FilterBar({ filtros, onChange, onReset }: FilterBarProps) {
  // Solo mostramos el botón "Limpiar" si hay algún filtro activo
  const hayFiltros = Object.values(filtros).some(v => v !== '')

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">

      {/* Todos los filtros en una sola fila — flex-1 en texto, ancho fijo en fecha/precio/select */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={filtros.cliente}
          onChange={e => onChange('cliente', e.target.value)}
          className={`${inputCls} flex-1 min-w-0`}
        />

        <input
          type="date"
          title="Fecha desde"
          value={filtros.fechaDesde}
          onChange={e => onChange('fechaDesde', e.target.value)}
          className={`${inputCls} text-gray-500 shrink-0`}
        />
        <input
          type="date"
          title="Fecha hasta"
          value={filtros.fechaHasta}
          onChange={e => onChange('fechaHasta', e.target.value)}
          className={`${inputCls} text-gray-500 shrink-0`}
        />

        <input
          type="text"
          placeholder="Tratamiento..."
          value={filtros.tratamiento}
          onChange={e => onChange('tratamiento', e.target.value)}
          className={`${inputCls} flex-1 min-w-0`}
        />

        <Select
          value={filtros.metodoPago}
          onChange={v => onChange('metodoPago', v)}
          placeholder="Método de pago"
          options={[
            { value: 'efectivo', label: 'Efectivo' },
            { value: 'tarjeta', label: 'Tarjeta' },
          ]}
          className="shrink-0"
        />

        <input
          type="number"
          placeholder="Precio mín"
          min="0"
          step="0.01"
          value={filtros.precioMin}
          onChange={e => onChange('precioMin', e.target.value)}
          className={`${inputCls} w-32 shrink-0`}
        />
        <input
          type="number"
          placeholder="Precio máx"
          min="0"
          step="0.01"
          value={filtros.precioMax}
          onChange={e => onChange('precioMax', e.target.value)}
          className={`${inputCls} w-32 shrink-0`}
        />
      </div>

      {/* Botón limpiar en su propia fila, alineado a la izquierda */}
      {hayFiltros && (
        <div className="mt-2">
          <button
            onClick={onReset}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  )
}
