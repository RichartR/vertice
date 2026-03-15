// Barra de filtros para la tabla de registros.
// Recibe el estado de filtros y callbacks desde ServicePage — no gestiona estado propio.
import type { Filtros } from '../../hooks/useFilteredRecords'

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
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-center">

      <input
        type="text"
        placeholder="Buscar cliente..."
        value={filtros.cliente}
        onChange={e => onChange('cliente', e.target.value)}
        className={`${inputCls} w-44`}
      />

      {/* Rango de fechas: dos campos independientes */}
      <input
        type="date"
        title="Fecha desde"
        value={filtros.fechaDesde}
        onChange={e => onChange('fechaDesde', e.target.value)}
        className={`${inputCls} text-gray-500`}
      />
      <input
        type="date"
        title="Fecha hasta"
        value={filtros.fechaHasta}
        onChange={e => onChange('fechaHasta', e.target.value)}
        className={`${inputCls} text-gray-500`}
      />

      <input
        type="text"
        placeholder="Tratamiento..."
        value={filtros.tratamiento}
        onChange={e => onChange('tratamiento', e.target.value)}
        className={`${inputCls} w-40`}
      />

      <select
        value={filtros.metodoPago}
        onChange={e => onChange('metodoPago', e.target.value)}
        className={`${inputCls} text-gray-600`}
      >
        <option value="">Método de pago</option>
        <option value="efectivo">Efectivo</option>
        <option value="tarjeta">Tarjeta</option>
      </select>

      <input
        type="number"
        placeholder="Precio mín"
        min="0"
        step="0.01"
        value={filtros.precioMin}
        onChange={e => onChange('precioMin', e.target.value)}
        className={`${inputCls} w-28`}
      />
      <input
        type="number"
        placeholder="Precio máx"
        min="0"
        step="0.01"
        value={filtros.precioMax}
        onChange={e => onChange('precioMax', e.target.value)}
        className={`${inputCls} w-28`}
      />

      {hayFiltros && (
        <button
          onClick={onReset}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}
