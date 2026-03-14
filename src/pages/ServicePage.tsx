// Vista de registros de un servicio — con filtros, tabla y pestaña de estadísticas.
// En producción: empleado ve solo lectura, admin ve edición. Aquí mostramos la vista completa.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const REGISTROS = [
  { id: '1', fecha: '14/03/2026', hora: '09:00', cliente: 'María Pérez Gómez',    tratamiento: 'Quiropodia',          notas: '',                          metodo: 'Tarjeta', precio: 35.00 },
  { id: '2', fecha: '14/03/2026', hora: '10:30', cliente: 'José Martínez López',  tratamiento: 'Plantillas ortopédicas', notas: 'Revisión en 3 meses',    metodo: 'Efectivo', precio: 120.00 },
  { id: '3', fecha: '13/03/2026', hora: '11:00', cliente: 'Laura Sánchez Ruiz',   tratamiento: 'Uña encarnada',       notas: '',                          metodo: 'Tarjeta', precio: 40.00 },
  { id: '4', fecha: '13/03/2026', hora: '16:00', cliente: 'Carlos Díaz Moreno',   tratamiento: 'Quiropodia',          notas: 'Pie diabético, extremar cuidado', metodo: 'Efectivo', precio: 35.00 },
  { id: '5', fecha: '12/03/2026', hora: '09:30', cliente: 'Elena Fernández Gil',  tratamiento: 'Verrugas plantares',  notas: '2ª sesión',                 metodo: 'Tarjeta', precio: 55.00 },
  { id: '6', fecha: '12/03/2026', hora: '12:00', cliente: 'Lucía Romero Castro',  tratamiento: 'Quiropodia',          notas: '',                          metodo: 'Tarjeta', precio: 35.00 },
]

type Tab = 'registros' | 'estadisticas'

export default function ServicePage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('registros')
  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroMetodo, setFiltroMetodo] = useState('')

  const registrosFiltrados = REGISTROS.filter(r => {
    const okCliente = r.cliente.toLowerCase().includes(filtroCliente.toLowerCase())
    const okMetodo = filtroMetodo ? r.metodo === filtroMetodo : true
    return okCliente && okMetodo
  })

  const totalIngresos = registrosFiltrados.reduce((sum, r) => sum + r.precio, 0)

  return (
    <div className="min-h-screen bg-gray-50 pb-16">

      {/* Header */}
      <header className="bg-white border-b-2 border-accent/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Volver"
          >
            ← Volver
          </button>
          <div>
            <h1 className="font-semibold text-gray-900">Podología</h1>
            <p className="text-xs text-gray-400">Ana García López</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <span>↓</span> Exportar Excel
        </button>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-6">
          {(['registros', 'estadisticas'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                tab === t
                  ? 'border-accent-dark text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t === 'registros' ? 'Registros' : 'Estadísticas'}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-6">

        {tab === 'registros' && (
          <>
            {/* Filtros */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={filtroCliente}
                onChange={e => setFiltroCliente(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent w-52"
              />
              <input
                type="date"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                type="text"
                placeholder="Tratamiento..."
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent w-44"
              />
              <select
                value={filtroMetodo}
                onChange={e => setFiltroMetodo(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Método de pago</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
              </select>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <span className="text-sm text-gray-500">{registrosFiltrados.length} registros · {totalIngresos.toFixed(2)} €</span>
                <button className="px-4 py-1.5 rounded-lg bg-accent hover:bg-accent-dark text-gray-900 text-sm font-medium transition-colors">
                  + Nuevo registro
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-accent/10 border-b border-accent/20">
                    <tr>
                      {['Fecha', 'Hora', 'Cliente', 'Tratamiento', 'Notas', 'Método', 'Precio', ''].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {registrosFiltrados.map(r => (
                      <tr key={r.id} className="hover:bg-accent/5 transition-colors">
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{r.fecha}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.hora}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">{r.cliente}</td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{r.tratamiento}</td>
                        <td className="px-4 py-3 text-gray-400 max-w-48 truncate">{r.notas || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            r.metodo === 'Efectivo'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}>
                            {r.metodo}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">{r.precio.toFixed(2)} €</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button className="text-gray-400 hover:text-gray-600 text-xs">Editar</button>
                            <button className="text-gray-400 hover:text-red-500 text-xs">Eliminar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === 'estadisticas' && (
          <div className="space-y-6">
            {/* Selector de mes */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <select className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-accent">
                  <option>Marzo 2026</option>
                  <option>Febrero 2026</option>
                  <option>Enero 2026</option>
                </select>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <span>↓</span> Exportar mes
              </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Ingresos totales', value: '320,00 €', sub: 'Marzo 2026' },
                { label: 'Sesiones',         value: '6',        sub: 'Marzo 2026' },
                { label: 'Ticket medio',     value: '53,33 €',  sub: 'Por sesión' },
                { label: 'Efectivo / Tarjeta', value: '155 / 165 €', sub: '2 / 4 pagos' },
              ].map(kpi => (
                <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-accent p-5">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{kpi.label}</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-2">{kpi.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
                </div>
              ))}
            </div>

            {/* Tabla resumen anual */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Resumen anual</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-accent/10 border-b border-accent/20">
                  <tr>
                    {['Mes', 'Sesiones', 'Ingresos', 'Efectivo', 'Tarjeta', 'Ticket medio'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    ['Enero 2026',   '24', '960,00 €',  '340,00 €', '620,00 €', '40,00 €'],
                    ['Febrero 2026', '20', '810,00 €',  '275,00 €', '535,00 €', '40,50 €'],
                    ['Marzo 2026',   '6',  '320,00 €',  '155,00 €', '165,00 €', '53,33 €'],
                  ].map(row => (
                    <tr key={row[0]} className="hover:bg-accent/5">
                      {row.map((cell, i) => (
                        <td key={i} className={`px-4 py-3 ${i === 0 ? 'text-gray-700 font-medium' : 'text-gray-600'}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
