// Vista de registros de un servicio — con filtros, tabla y pestaña de estadísticas.
// En producción: empleado ve solo lectura, admin ve edición. Aquí mostramos la vista completa.
import { useState } from 'react'
import Tooltip from '../components/ui/Tooltip'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import FormField from '../components/ui/FormField'
import { normalizar } from '../utils/normalizar'

// Clase reutilizable para inputs del formulario
const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent'

type Registro = { id: string; fecha: string; hora: string; cliente: string; tratamiento: string; notas: string; metodo: string; precio: number }

const REGISTROS: Registro[] = []

type Tab = 'registros' | 'estadisticas'

export default function ServicePage() {
  const [tab, setTab] = useState<Tab>('registros')
  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroMetodo, setFiltroMetodo] = useState('')

  // Estado del modal de registro (null = nuevo, objeto = editar)
  const [registroModal, setRegistroModal] = useState<{ open: boolean; registro: Registro | null }>({ open: false, registro: null })
  const [rFecha, setRFecha]           = useState('2026-03-14')
  const [rHora, setRHora]             = useState('')
  const [rCliente, setRCliente]       = useState('')
  const [rTratamiento, setRTratamiento] = useState('')
  const [rNotas, setRNotas]           = useState('')
  const [rMetodo, setRMetodo]         = useState('Tarjeta')
  const [rPrecio, setRPrecio]         = useState('')

  function abrirNuevo() {
    setRFecha('2026-03-14'); setRHora(''); setRCliente('')
    setRTratamiento(''); setRNotas(''); setRMetodo('Tarjeta'); setRPrecio('')
    setRegistroModal({ open: true, registro: null })
  }

  function abrirEditar(r: Registro) {
    // Convierte DD/MM/YYYY → YYYY-MM-DD para input[type=date]
    const [d, m, y] = r.fecha.split('/')
    setRFecha(`${y}-${m}-${d}`)
    setRHora(r.hora); setRCliente(r.cliente); setRTratamiento(r.tratamiento)
    setRNotas(r.notas); setRMetodo(r.metodo); setRPrecio(String(r.precio))
    setRegistroModal({ open: true, registro: r })
  }

  const registrosFiltrados = REGISTROS.filter(r => {
    const okCliente = normalizar(r.cliente).includes(normalizar(filtroCliente))
    const okMetodo = filtroMetodo ? r.metodo === filtroMetodo : true
    return okCliente && okMetodo
  })

  const totalIngresos = registrosFiltrados.reduce((sum, r) => sum + r.precio, 0)

  return (
    <div className="min-h-screen bg-gray-50 pb-16">

      {/* Cabecera de página */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-gray-900">Podología</h1>
          <p className="text-xs text-gray-500 mt-0.5">Ana García López</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-sm text-gray-700 hover:bg-gray-200 transition-colors">
          <span>↓</span> Exportar Excel
        </button>
      </div>

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
                <button
                  onClick={abrirNuevo}
                  className="px-4 py-1.5 rounded-lg bg-accent hover:bg-accent-dark text-gray-900 text-sm font-medium transition-colors"
                >
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
                        <td className="px-4 py-3 text-gray-400 overflow-hidden max-w-48">
                          {r.notas
                            ? <Tooltip text={r.notas}>{r.notas}</Tooltip>
                            : '—'
                          }
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={r.metodo === 'Efectivo' ? 'efectivo' : 'tarjeta'} />
                        </td>
                        <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">{r.precio.toFixed(2)} €</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => abrirEditar(r)}
                              className="px-2.5 py-1 rounded-md border border-gray-200 text-xs text-gray-600 hover:border-accent hover:bg-accent/10 transition-colors"
                            >
                              Editar
                            </button>
                            <button className="px-2.5 py-1 rounded-md border border-red-100 text-xs text-red-500 hover:bg-red-50 transition-colors">Eliminar</button>
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
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors bg-white">
                <span>↓</span> Exportar mes
              </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Ingresos totales',   value: '320,00 €',     sub: 'Marzo 2026'  },
                { label: 'Sesiones',            value: '6',            sub: 'Marzo 2026'  },
                { label: 'Ticket medio',        value: '53,33 €',      sub: 'Por sesión'  },
                { label: 'Efectivo / Tarjeta',  value: '155 / 165 €',  sub: '2 / 4 pagos' },
              ].map(kpi => (
                <StatCard key={kpi.label} label={kpi.label} value={kpi.value} sub={kpi.sub} />
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
                    ['Enero 2026',   '24', '960,00 €', '340,00 €', '620,00 €', '40,00 €'],
                    ['Febrero 2026', '20', '810,00 €', '275,00 €', '535,00 €', '40,50 €'],
                    ['Marzo 2026',   '6',  '320,00 €', '155,00 €', '165,00 €', '53,33 €'],
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

      {/* Modal nuevo / editar registro */}
      {registroModal.open && (
        <Modal
          title={registroModal.registro ? 'Editar registro' : 'Nuevo registro'}
          confirmLabel={registroModal.registro ? 'Guardar cambios' : 'Crear registro'}
          onClose={() => setRegistroModal({ open: false, registro: null })}
        >
          <div className="grid grid-cols-2 gap-3">
            <FormField id="r-fecha" label="Fecha">
              <input id="r-fecha" type="date" value={rFecha} onChange={e => setRFecha(e.target.value)} className={inputCls} />
            </FormField>
            <FormField id="r-hora" label="Hora">
              <input id="r-hora" type="time" value={rHora} onChange={e => setRHora(e.target.value)} className={inputCls} />
            </FormField>
          </div>

          <FormField id="r-cliente" label="Cliente">
            <input id="r-cliente" value={rCliente} onChange={e => setRCliente(e.target.value)} placeholder="Nombre completo del cliente" className={inputCls} />
          </FormField>

          <FormField id="r-tratamiento" label="Tratamiento">
            <input id="r-tratamiento" value={rTratamiento} onChange={e => setRTratamiento(e.target.value)} placeholder="Ej: Quiropodia" className={inputCls} />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField id="r-metodo" label="Método de pago">
              <select id="r-metodo" value={rMetodo} onChange={e => setRMetodo(e.target.value)} className={inputCls}>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Efectivo">Efectivo</option>
              </select>
            </FormField>
            <FormField id="r-precio" label="Precio (€)">
              <input id="r-precio" type="number" min="0" step="0.01" value={rPrecio} onChange={e => setRPrecio(e.target.value)} placeholder="35.00" className={inputCls} />
            </FormField>
          </div>

          <FormField id="r-notas" label="Notas" optional>
            <textarea id="r-notas" value={rNotas} onChange={e => setRNotas(e.target.value)} placeholder="Observaciones..." rows={2} className={`${inputCls} resize-none`} />
          </FormField>
        </Modal>
      )}

    </div>
  )
}
