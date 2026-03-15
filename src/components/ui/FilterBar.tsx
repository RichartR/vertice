// Barra de filtros para la tabla de registros.
// Recibe el estado de filtros y callbacks desde ServicePage — no gestiona estado propio.
// En móvil los filtros se colapsan con un botón toggle; en md+ siempre visibles en fila.
import { useState } from 'react'
import type { Filtros } from '../../hooks/useFilteredRecords'
import Select from './Select'

const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent'

interface FilterBarProps {
  filtros: Filtros
  onChange: (key: keyof Filtros, value: string) => void
  onReset: () => void
}

export default function FilterBar({ filtros, onChange, onReset }: FilterBarProps) {
  const [abierto, setAbierto] = useState(false)
  const hayFiltros = Object.values(filtros).some(v => v !== '')

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">

      {/* Cabecera móvil — botón toggle */}
      <div className="flex items-center justify-between md:hidden">
        <button
          onClick={() => setAbierto(v => !v)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700"
        >
          <span>Filtros</span>
          {hayFiltros && <span className="w-2 h-2 rounded-full bg-accent-dark inline-block" />}
          <span className="text-xs text-gray-400">{abierto ? '▲' : '▼'}</span>
        </button>
        {hayFiltros && (
          <button
            onClick={onReset}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Panel de filtros — visible en md+, toggle en móvil */}
      <div className={`${abierto ? 'block mt-3' : 'hidden'} md:block`}>

        {/* Móvil: columna. Desktop: fila */}
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={filtros.cliente}
            onChange={e => onChange('cliente', e.target.value)}
            className={`${inputCls} md:flex-1`}
          />

          <div className="flex gap-2">
            <input
              type="date"
              title="Fecha desde"
              value={filtros.fechaDesde}
              onChange={e => onChange('fechaDesde', e.target.value)}
              className={`${inputCls} flex-1 text-gray-500`}
            />
            <input
              type="date"
              title="Fecha hasta"
              value={filtros.fechaHasta}
              onChange={e => onChange('fechaHasta', e.target.value)}
              className={`${inputCls} flex-1 text-gray-500`}
            />
          </div>

          <input
            type="text"
            placeholder="Tratamiento..."
            value={filtros.tratamiento}
            onChange={e => onChange('tratamiento', e.target.value)}
            className={`${inputCls} md:flex-1`}
          />

          <Select
            value={filtros.metodoPago}
            onChange={v => onChange('metodoPago', v)}
            placeholder="Método de pago"
            options={[
              { value: 'efectivo', label: 'Efectivo' },
              { value: 'tarjeta', label: 'Tarjeta' },
            ]}
            className="md:shrink-0"
          />

          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Precio mín"
              min="0"
              step="0.01"
              value={filtros.precioMin}
              onChange={e => onChange('precioMin', e.target.value)}
              className={`${inputCls} flex-1 md:w-32 md:flex-none`}
            />
            <input
              type="number"
              placeholder="Precio máx"
              min="0"
              step="0.01"
              value={filtros.precioMax}
              onChange={e => onChange('precioMax', e.target.value)}
              className={`${inputCls} flex-1 md:w-32 md:flex-none`}
            />
          </div>
        </div>

        {/* Botón limpiar en desktop */}
        {hayFiltros && (
          <div className="mt-2 hidden md:block">
            <button
              onClick={onReset}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
