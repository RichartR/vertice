// Vista de registros de un servicio — tabla con filtros + pestaña de estadísticas.
// Empleado: solo lectura, sin columna Empleado.
// Admin: columna Empleado visible, botones Editar y Eliminar por fila.
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useRecords, type Registro } from '../hooks/useRecords'
import Tooltip from '../components/ui/Tooltip'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import FormField from '../components/ui/FormField'
import { normalizar } from '../utils/normalizar'

const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent'

// YYYY-MM-DD → DD/MM/YYYY
function formatFecha(fecha: string) {
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
}

// HH:MM:SS → HH:MM
function formatHora(hora: string) {
  return hora.substring(0, 5)
}

type Tab = 'registros' | 'estadisticas'

export default function ServicePage() {
  const { id: serviceId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile, isAdmin, user } = useAuth()

  const { registros, cargando, recargar } = useRecords(serviceId ?? '')

  // Nombre del servicio
  const [nombreServicio, setNombreServicio] = useState('')

  // Mostrar botón "← Mis servicios" solo si el empleado tiene más de 1 servicio
  const [serviciosCount, setServiciosCount] = useState(0)

  // Tabs y filtros
  const [tab, setTab] = useState<Tab>('registros')
  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroTratamiento, setFiltroTratamiento] = useState('')
  const [filtroFecha, setFiltroFecha] = useState('')
  const [filtroMetodo, setFiltroMetodo] = useState('')

  // Modal crear/editar (funcionalidad real en VER-26)
  const [registroModal, setRegistroModal] = useState<{ open: boolean; registro: Registro | null }>({ open: false, registro: null })
  const [rFecha, setRFecha]             = useState('')
  const [rHora, setRHora]               = useState('')
  const [rCliente, setRCliente]         = useState('')
  const [rTratamiento, setRTratamiento] = useState('')
  const [rNotas, setRNotas]             = useState('')
  const [rMetodo, setRMetodo]           = useState('tarjeta')
  const [rPrecio, setRPrecio]           = useState('')

  useEffect(() => {
    if (!serviceId) return

    // Nombre del servicio
    supabase
      .from('services')
      .select('nombre')
      .eq('id', serviceId)
      .single()
      .then(({ data }) => setNombreServicio(data?.nombre ?? ''))

    // Conteo de servicios del empleado (para mostrar botón volver)
    if (!isAdmin && user) {
      supabase
        .from('service_employees')
        .select('*', { count: 'exact', head: true })
        .then(({ count }) => setServiciosCount(count ?? 0))
    }
  }, [serviceId, isAdmin, user])

  function abrirNuevo() {
    const hoy = new Date().toISOString().split('T')[0]
    setRFecha(hoy); setRHora(''); setRCliente('')
    setRTratamiento(''); setRNotas(''); setRMetodo('tarjeta'); setRPrecio('')
    setRegistroModal({ open: true, registro: null })
  }

  function abrirEditar(r: Registro) {
    setRFecha(r.fecha)
    setRHora(formatHora(r.hora))
    setRCliente(r.cliente)
    setRTratamiento(r.tratamiento)
    setRNotas(r.notas ?? '')
    setRMetodo(r.metodo_pago)
    setRPrecio(String(r.precio))
    setRegistroModal({ open: true, registro: r })
  }

  // Filtrado
  const registrosFiltrados = registros.filter(r => {
    const okCliente     = normalizar(r.cliente).includes(normalizar(filtroCliente))
    const okTratamiento = normalizar(r.tratamiento).includes(normalizar(filtroTratamiento))
    const okFecha       = filtroFecha ? r.fecha === filtroFecha : true
    const okMetodo      = filtroMetodo ? r.metodo_pago === filtroMetodo : true
    return okCliente && okTratamiento && okFecha && okMetodo
  })

  const totalIngresos = registrosFiltrados.reduce((sum, r) => sum + r.precio, 0)
  const mostrarVolver = !isAdmin && serviciosCount > 1

  // Columnas de la tabla según rol
  const columnas = isAdmin
    ? ['Fecha', 'Hora', 'Cliente', 'Tratamiento', 'Empleado', 'Notas', 'Método', 'Precio', '']
    : ['Fecha', 'Hora', 'Cliente', 'Tratamiento', 'Notas', 'Método', 'Precio']

  return (
    <div className="min-h-screen bg-gray-50 pb-16">

      {/* Cabecera de página */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {mostrarVolver && (
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              ← Mis servicios
            </button>
          )}
          <div>
            <h1 className="font-semibold text-gray-900">{nombreServicio || '…'}</h1>
            {!isAdmin && profile?.nombre && (
              <p className="text-xs text-gray-500 mt-0.5">{profile.nombre}</p>
            )}
          </div>
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
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
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
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent w-48"
              />
              <input
                type="date"
                value={filtroFecha}
                onChange={e => setFiltroFecha(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                type="text"
                placeholder="Tratamiento..."
                value={filtroTratamiento}
                onChange={e => setFiltroTratamiento(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent w-44"
              />
              <select
                value={filtroMetodo}
                onChange={e => setFiltroMetodo(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Método de pago</option>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
              {(filtroCliente || filtroFecha || filtroTratamiento || filtroMetodo) && (
                <button
                  onClick={() => { setFiltroCliente(''); setFiltroFecha(''); setFiltroTratamiento(''); setFiltroMetodo('') }}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <span className="text-sm text-gray-500">
                  {cargando ? 'Cargando...' : `${registrosFiltrados.length} registros · ${totalIngresos.toFixed(2)} €`}
                </span>
                {isAdmin && (
                  <button
                    onClick={abrirNuevo}
                    className="px-4 py-1.5 rounded-lg bg-accent hover:bg-accent-dark text-gray-900 text-sm font-medium transition-colors"
                  >
                    + Nuevo registro
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-accent/10 border-b border-accent/20">
                    <tr>
                      {columnas.map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {!cargando && registrosFiltrados.length === 0 && (
                      <tr>
                        <td colSpan={columnas.length} className="px-4 py-10 text-center text-sm text-gray-400">
                          No hay registros para mostrar.
                        </td>
                      </tr>
                    )}
                    {registrosFiltrados.map(r => (
                      <tr key={r.id} className="hover:bg-accent/5 transition-colors">
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatFecha(r.fecha)}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatHora(r.hora)}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">{r.cliente}</td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{r.tratamiento}</td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                            {r.profiles?.nombre ?? <span className="text-gray-300">—</span>}
                          </td>
                        )}
                        <td className="px-4 py-3 text-gray-400 max-w-48 overflow-hidden">
                          {r.notas
                            ? <Tooltip text={r.notas}>{r.notas}</Tooltip>
                            : <span className="text-gray-200">—</span>
                          }
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={r.metodo_pago === 'efectivo' ? 'efectivo' : 'tarjeta'} />
                        </td>
                        <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">
                          {Number(r.precio).toFixed(2)} €
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex gap-2">
                              <button
                                onClick={() => abrirEditar(r)}
                                className="px-2.5 py-1 rounded-md border border-gray-200 text-xs text-gray-600 hover:border-accent hover:bg-accent/10 transition-colors"
                              >
                                Editar
                              </button>
                              <button className="px-2.5 py-1 rounded-md border border-red-100 text-xs text-red-500 hover:bg-red-50 transition-colors">
                                Eliminar
                              </button>
                            </div>
                          </td>
                        )}
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
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Las estadísticas detalladas se implementarán próximamente.</p>
            </div>

            {/* KPIs básicos calculados desde los registros actuales */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Ingresos totales"
                value={`${registros.reduce((s, r) => s + r.precio, 0).toFixed(2)} €`}
                sub="Todos los registros"
              />
              <StatCard
                label="Sesiones"
                value={String(registros.length)}
                sub="Todos los registros"
              />
              <StatCard
                label="Ticket medio"
                value={registros.length > 0 ? `${(registros.reduce((s, r) => s + r.precio, 0) / registros.length).toFixed(2)} €` : '—'}
                sub="Por sesión"
              />
              <StatCard
                label="Efectivo / Tarjeta"
                value={`${registros.filter(r => r.metodo_pago === 'efectivo').length} / ${registros.filter(r => r.metodo_pago === 'tarjeta').length}`}
                sub="Número de pagos"
              />
            </div>
          </div>
        )}

      </main>

      {/* Modal nuevo / editar registro — funcionalidad real en VER-26 */}
      {registroModal.open && (
        <Modal
          title={registroModal.registro ? 'Editar registro' : 'Nuevo registro'}
          confirmLabel={registroModal.registro ? 'Guardar cambios' : 'Crear registro'}
          onConfirm={() => { recargar(); setRegistroModal({ open: false, registro: null }) }}
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
                <option value="tarjeta">Tarjeta</option>
                <option value="efectivo">Efectivo</option>
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
