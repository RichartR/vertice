// Vista de registros de un servicio — tabla con filtros + pestaña de estadísticas.
// Empleado: solo lectura, sin columna Empleado.
// Admin: columna Empleado visible, botones Editar y Eliminar por fila + CRUD conectado a Supabase.
import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useRecords, type Registro } from '../hooks/useRecords'
import { useFilteredRecords, FILTROS_VACIOS, type Filtros } from '../hooks/useFilteredRecords'
import { useStats } from '../hooks/useStats'
import FilterBar from '../components/ui/FilterBar'
import Tooltip from '../components/ui/Tooltip'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Select from '../components/ui/Select'
import FormField from '../components/ui/FormField'
import { exportToExcel } from '../utils/exportExcel'

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

type Empleado = { id: string; nombre: string }

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
               'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

// Rango de años disponibles en el selector: 5 años atrás hasta el año actual
const CURRENT_YEAR = new Date().getFullYear()

export default function ServicePage() {
  const { id: serviceId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile, isAdmin, user } = useAuth()

  const { registros, cargando, recargar } = useRecords(serviceId ?? '')

  // Nombre del servicio
  const [nombreServicio, setNombreServicio] = useState('')

  // Mostrar botón "← Mis servicios" solo si el empleado tiene más de 1 servicio
  const [serviciosCount, setServiciosCount] = useState(0)

  // Tabs
  const [tab, setTab] = useState<Tab>('registros')

  // Selector de mes/año para la pestaña de estadísticas (por defecto el mes actual)
  const hoy = new Date()
  const [mesSel, setMesSel]   = useState(hoy.getMonth() + 1)  // 1–12
  const [yearSel, setYearSel] = useState(hoy.getFullYear())

  // Filtros — gestionados como un objeto plano para facilitar el reset
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS)
  const registrosFiltrados = useFilteredRecords(registros, filtros)
  const { resumenAnual } = useStats(registros, mesSel, yearSel)

  // Años disponibles: años con al menos un registro + el año actual siempre presente
  const yearsDisponibles = useMemo(() => {
    const enRegistros = new Set(registros.map(r => Number(r.fecha.split('-')[0])))
    enRegistros.add(CURRENT_YEAR)
    return Array.from(enRegistros).sort((a, b) => a - b)
  }, [registros])

  // Registros del año seleccionado — usados para exportar desde la pestaña de estadísticas
  const registrosAnio = useMemo(
    () => registros.filter(r => Number(r.fecha.split('-')[0]) === yearSel),
    [registros, yearSel]
  )

  function handleFiltroChange(key: keyof Filtros, value: string) {
    setFiltros(prev => ({ ...prev, [key]: value }))
  }

  // --- Modal crear/editar ---

  const [registroModal, setRegistroModal] = useState<{ open: boolean; registro: Registro | null }>({ open: false, registro: null })
  const [rFecha, setRFecha]             = useState('')
  const [rHora, setRHora]               = useState('')
  const [rCliente, setRCliente]         = useState('')
  const [rTratamiento, setRTratamiento] = useState('')
  const [rNotas, setRNotas]             = useState('')
  const [rMetodo, setRMetodo]           = useState<'efectivo' | 'tarjeta'>('tarjeta')
  const [rPrecio, setRPrecio]           = useState('')
  const [rEmpleado, setREmpleado]       = useState('')  // employee_id seleccionado

  // Lista de empleados activos asignados a este servicio (para el select del modal)
  const [empleados, setEmpleados]         = useState<Empleado[]>([])
  const [mostrarSelectorEmpleado, setMostrarSelectorEmpleado] = useState(false)
  const [rGuardando, setRGuardando] = useState(false)
  const [rError, setRError]         = useState<string | null>(null)

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

  // Carga los empleados activos asignados a este servicio y devuelve la lista
  async function cargarEmpleados(): Promise<Empleado[]> {
    if (!serviceId) return []
    const { data } = await supabase
      .from('service_employees')
      .select('profiles(id, nombre, activo)')
      .eq('service_id', serviceId)

    const lista: Empleado[] = (data ?? [])
      .map((row: any) => row.profiles)
      .filter((p: any) => p?.activo === true)
      .map((p: any) => ({ id: p.id, nombre: p.nombre }))

    setEmpleados(lista)
    return lista
  }

  async function abrirNuevo() {
    const hoy = new Date().toISOString().split('T')[0]
    setRFecha(hoy); setRHora(''); setRCliente('')
    setRTratamiento(''); setRNotas(''); setRMetodo('tarjeta'); setRPrecio('')
    setRError(null)

    const lista = await cargarEmpleados()
    // 1 empleado → asignación automática, sin selector
    // 0 empleados → employee_id null, sin selector
    // 2+ empleados → mostrar selector
    setREmpleado(lista.length === 1 ? lista[0].id : '')
    setMostrarSelectorEmpleado(lista.length > 1)
    setRegistroModal({ open: true, registro: null })
  }

  async function abrirEditar(r: Registro) {
    setRFecha(r.fecha)
    setRHora(formatHora(r.hora))
    setRCliente(r.cliente)
    setRTratamiento(r.tratamiento)
    setRNotas(r.notas ?? '')
    setRMetodo(r.metodo_pago)
    setRPrecio(String(r.precio))
    setREmpleado(r.employee_id ?? '')
    setRError(null)

    const lista = await cargarEmpleados()
    // Al editar siempre mostramos el selector si hay 2+ empleados (para poder corregir)
    setMostrarSelectorEmpleado(lista.length > 1)
    setRegistroModal({ open: true, registro: r })
  }

  // Validación + INSERT / UPDATE en Supabase
  async function guardarRegistro() {
    const empleadoRequerido = mostrarSelectorEmpleado && !rEmpleado
    if (!rFecha || !rHora || !rCliente.trim() || !rTratamiento.trim() || !rPrecio || empleadoRequerido) {
      setRError('Completa todos los campos obligatorios')
      return
    }

    setRGuardando(true)
    setRError(null)

    const payload = {
      service_id: serviceId,
      employee_id: rEmpleado || null,
      fecha: rFecha,
      hora: rHora,
      cliente: rCliente.trim(),
      tratamiento: rTratamiento.trim(),
      notas: rNotas.trim() || null,
      metodo_pago: rMetodo,
      precio: Number.parseFloat(rPrecio),
    }

    const { error } = registroModal.registro
      ? await supabase.from('records').update(payload).eq('id', registroModal.registro.id)
      : await supabase.from('records').insert(payload)

    if (error) {
      setRError('Error al guardar el registro. Inténtalo de nuevo.')
      setRGuardando(false)
      return
    }

    recargar()
    setRegistroModal({ open: false, registro: null })
    setRGuardando(false)
  }

  async function eliminarRegistro(id: string) {
    await supabase.from('records').delete().eq('id', id)
    recargar()
  }

  const totalIngresos = registrosFiltrados.reduce((sum, r) => sum + r.precio, 0)
  const mostrarVolver = !isAdmin && serviciosCount > 1

  // Columnas de la tabla según rol
  const columnas = isAdmin
    ? ['Fecha', 'Hora', 'Cliente', 'Tratamiento', 'Empleado', 'Notas', 'Método', 'Precio', '']
    : ['Fecha', 'Hora', 'Cliente', 'Tratamiento', 'Notas', 'Método', 'Precio']

  const labelAccion = registroModal.registro ? 'Guardar cambios' : 'Crear registro'
  const confirmLabel = rGuardando ? 'Guardando...' : labelAccion

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
            <h1 className="font-semibold text-gray-900">
              {nombreServicio || '…'}
              {!isAdmin && profile?.nombre && (
                <span className="font-normal text-gray-500"> — {profile.nombre}</span>
              )}
            </h1>
          </div>
        </div>
        <button
          onClick={() => exportToExcel(registrosFiltrados, nombreServicio)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
        >
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
            {/* Filtros — rango de fechas + precio mín/máx + texto parcial */}
            <FilterBar
              filtros={filtros}
              onChange={handleFiltroChange}
              onReset={() => setFiltros(FILTROS_VACIOS)}
            />

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
                          No hay registros con estos filtros.
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
                              <button
                                onClick={() => eliminarRegistro(r.id)}
                                className="px-2.5 py-1 rounded-md border border-red-100 text-xs text-red-500 hover:bg-red-50 transition-colors"
                              >
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

            {/* Selector de año */}
            <div className="flex items-center gap-3">
              <Select
                value={String(yearSel)}
                onChange={v => setYearSel(Number(v))}
                options={yearsDisponibles.map(y => ({ value: String(y), label: String(y) }))}
              />
            </div>

            {/* Tabla resumen anual — clic en una fila para destacarla */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Resumen {yearSel}</span>
                <button
                  onClick={() => exportToExcel(registrosAnio, nombreServicio)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-xs text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <span>↓</span> Exportar año
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-accent/10 border-b border-accent/20">
                    <tr>
                      {['Mes', 'Total (€)', 'Efectivo (€)', 'Tarjeta (€)', 'Sesiones', 'Ticket medio'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {resumenAnual.map(s => (
                      <tr
                        key={s.mes}
                        onClick={() => setMesSel(s.mes)}
                        className={`transition-colors cursor-pointer ${s.mes === mesSel ? 'bg-accent/40 font-semibold' : 'hover:bg-accent/10'}`}
                      >
                        <td className="px-4 py-3 text-gray-700 font-medium">{MESES[s.mes - 1]}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium">{s.totalIngresos.toFixed(2)} €</td>
                        <td className="px-4 py-3 text-gray-600">{s.totalEfectivo.toFixed(2)} €</td>
                        <td className="px-4 py-3 text-gray-600">{s.totalTarjeta.toFixed(2)} €</td>
                        <td className="px-4 py-3 text-gray-600">{s.numSesiones}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {s.numSesiones > 0 ? `${s.ticketMedio.toFixed(2)} €` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Modal nuevo / editar registro */}
      {registroModal.open && (
        <Modal
          title={registroModal.registro ? 'Editar registro' : 'Nuevo registro'}
          confirmLabel={confirmLabel}
          confirmDisabled={rGuardando}
          onConfirm={guardarRegistro}
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

          {/* Selector de empleado — solo visible si hay 2+ empleados asignados */}
          {mostrarSelectorEmpleado && (
            <FormField id="r-empleado" label="Empleado">
              <Select
                value={rEmpleado}
                onChange={setREmpleado}
                placeholder="Selecciona un empleado"
                options={empleados.map(emp => ({ value: emp.id, label: emp.nombre }))}
              />
            </FormField>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormField id="r-metodo" label="Método de pago">
              <Select
                value={rMetodo}
                onChange={v => setRMetodo(v as 'efectivo' | 'tarjeta')}
                options={[
                  { value: 'tarjeta', label: 'Tarjeta' },
                  { value: 'efectivo', label: 'Efectivo' },
                ]}
              />
            </FormField>
            <FormField id="r-precio" label="Precio (€)">
              <input id="r-precio" type="number" min="0" step="0.01" value={rPrecio} onChange={e => setRPrecio(e.target.value)} placeholder="35.00" className={inputCls} />
            </FormField>
          </div>

          <FormField id="r-notas" label="Notas" optional>
            <textarea id="r-notas" value={rNotas} onChange={e => setRNotas(e.target.value)} placeholder="Observaciones..." rows={2} className={`${inputCls} resize-none`} />
          </FormField>

          {rError && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{rError}</p>
          )}
        </Modal>
      )}

    </div>
  )
}
