// Panel de gestión de incidencias (admin) — VER-46 + VER-47 + VER-48.
// Tres pestanyas de gestión: Pendientes / Resueltas / Caducadas.
// Pestanya Estadísticas con buscador por socio y 5 métricas (VER-48).
// Filtros en frontend por socio, sesión, fecha y aviso.
// Modal de creación/edición inline (VER-47).
// Popups para transiciones de estado con campos extra.
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Modal from '../../components/ui/Modal'
import FormField from '../../components/ui/FormField'
import { normalizar } from '../../utils/normalizar'
import { useIncidenciasStats } from '../../hooks/useIncidenciasStats'
import Select from '../../components/ui/Select'

type Estado = 'pendiente' | 'resuelta' | 'caducada'
type Vista = Estado | 'estadisticas'

type Incidencia = {
  id: string
  fecha: string
  nombre_socio: string
  sesion: string
  aviso: boolean
  hora_aviso: string | null
  estado: Estado
  observaciones: string | null
  fecha_nueva_clase: string | null
}

type IncidenciaStat = {
  id: string
  fecha: string
  nombre_socio: string
  estado: Estado
  aviso: boolean
}

type Filtros = {
  socio: string
  sesion: string
  fechaDesde: string
  fechaHasta: string
  aviso: 'todos' | 'si' | 'no'
}

const FILTROS_VACIO: Filtros = { socio: '', sesion: '', fechaDesde: '', fechaHasta: '', aviso: 'todos' }

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const PESTANYAS_GESTION: Estado[] = ['pendiente', 'resuelta', 'caducada']
const LABELS: Record<Estado, string> = { pendiente: 'Pendientes', resuelta: 'Resueltas', caducada: 'Caducadas' }

function formatFecha(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function hoy(): string {
  return new Date().toISOString().split('T')[0]
}

function hayFiltrosActivos(f: Filtros): boolean {
  return f.socio !== '' || f.sesion !== '' || f.fechaDesde !== '' || f.fechaHasta !== '' || f.aviso !== 'todos'
}

export default function AdminIncidenciasPage() {
  // --- Datos de gestión (por estado) ---
  const [incidencias, setIncidencias] = useState<Incidencia[]>([])
  const [cargando, setCargando] = useState(true)

  // --- Datos de estadísticas (todas, sin filtro de estado) ---
  const [todasIncidencias, setTodasIncidencias] = useState<IncidenciaStat[]>([])
  const [busquedaStats, setBusquedaStats] = useState('')
  const [mesStats, setMesStats] = useState('')
  const [anyoStats, setAnyoStats] = useState('')

  // --- Pestanyas y filtros ---
  const [pestanya, setPestanya] = useState<Vista>('pendiente')
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIO)

  // --- Modal crear/editar (VER-47) ---
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Incidencia | null>(null)
  const [formFecha, setFormFecha] = useState(hoy())
  const [formSocio, setFormSocio] = useState('')
  const [formSesion, setFormSesion] = useState('')
  const [formAviso, setFormAviso] = useState(false)
  const [formHoraAviso, setFormHoraAviso] = useState('')
  const [formObs, setFormObs] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // --- Popup: marcar como Resuelta ---
  const [popupResuelta, setPopupResuelta] = useState<{ id: string } | null>(null)
  const [fechaNuevaClase, setFechaNuevaClase] = useState('')
  const [errTransicion, setErrTransicion] = useState<string | null>(null)
  const [guardandoT, setGuardandoT] = useState(false)

  // --- Popup: marcar como Caducada ---
  const [popupCaducada, setPopupCaducada] = useState<{ id: string; obsActual: string | null } | null>(null)
  const [obsExtra, setObsExtra] = useState('')

  // --- Confirmación borrado ---
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // --- Estadísticas (VER-48) ---
  const incidenciasParaStats = todasIncidencias.filter(i => {
    if (mesStats && i.fecha.substring(5, 7) !== mesStats.padStart(2, '0')) return false
    if (anyoStats && i.fecha.substring(0, 4) !== anyoStats) return false
    return true
  })
  const { stats } = useIncidenciasStats(incidenciasParaStats, busquedaStats)
  const anyosStats = Array.from(new Set(todasIncidencias.map(i => i.fecha.substring(0, 4)))).sort((a, b) => b.localeCompare(a))
  const hayFiltroStats = !!(busquedaStats || mesStats || anyoStats)
  const opcionesMeses = MESES.map((m, idx) => ({ value: String(idx + 1), label: m }))
  const opcionesAnyos = anyosStats.map(a => ({ value: a, label: a }))

  // Carga las incidencias de la pestanya activa (solo pestanyas de gestión)
  useEffect(() => {
    if (pestanya !== 'estadisticas') cargar()
  }, [pestanya])

  // Carga todas las incidencias para estadísticas (fetch independiente, al montar)
  useEffect(() => {
    cargarStats()
  }, [])

  async function cargar() {
    setCargando(true)
    const { data } = await supabase
      .from('incidencias')
      .select('*')
      .eq('estado', pestanya as Estado)
      .order('fecha', { ascending: false })
    setIncidencias((data as Incidencia[]) ?? [])
    setCargando(false)
  }

  async function cargarStats() {
    const { data } = await supabase
      .from('incidencias')
      .select('id, fecha, nombre_socio, estado, aviso')
      .order('fecha', { ascending: false })
    setTodasIncidencias((data as IncidenciaStat[]) ?? [])
  }

  // --- Filtrado en frontend ---
  const lista = incidencias.filter(i => {
    if (filtros.socio && !normalizar(i.nombre_socio).includes(normalizar(filtros.socio))) return false
    if (filtros.sesion && !normalizar(i.sesion).includes(normalizar(filtros.sesion))) return false
    if (filtros.fechaDesde && i.fecha < filtros.fechaDesde) return false
    if (filtros.fechaHasta && i.fecha > filtros.fechaHasta) return false
    if (filtros.aviso === 'si' && !i.aviso) return false
    if (filtros.aviso === 'no' && i.aviso) return false
    return true
  })

  function cambiarPestanya(tab: Vista) {
    setPestanya(tab)
    setFiltros(FILTROS_VACIO)
  }

  // --- Modal crear/editar ---

  function abrirNuevo() {
    setEditando(null)
    setFormFecha(hoy())
    setFormSocio('')
    setFormSesion('')
    setFormAviso(false)
    setFormHoraAviso('')
    setFormObs('')
    setError(null)
    setModalOpen(true)
  }

  function abrirEditar(i: Incidencia) {
    setEditando(i)
    setFormFecha(i.fecha)
    setFormSocio(i.nombre_socio)
    setFormSesion(i.sesion)
    setFormAviso(i.aviso)
    setFormHoraAviso(i.hora_aviso ?? '')
    setFormObs(i.observaciones ?? '')
    setError(null)
    setModalOpen(true)
  }

  async function guardarModal() {
    if (!formFecha || !formSocio.trim() || !formSesion.trim()) {
      setError('Fecha, nombre del socio y sesión son obligatorios')
      return
    }
    setGuardando(true)
    setError(null)
    const payload = {
      fecha: formFecha,
      nombre_socio: formSocio.trim(),
      sesion: formSesion.trim(),
      aviso: formAviso,
      hora_aviso: formAviso && formHoraAviso ? formHoraAviso : null,
      observaciones: formObs.trim() || null,
    }
    if (editando) {
      await supabase.from('incidencias').update(payload).eq('id', editando.id)
    } else {
      await supabase.from('incidencias').insert({ ...payload, estado: 'pendiente' })
    }
    setGuardando(false)
    setModalOpen(false)
    cargar()
    cargarStats()
  }

  // --- Transiciones de estado ---

  async function marcarResuelta() {
    if (!popupResuelta || !fechaNuevaClase) {
      setErrTransicion('La fecha de nueva clase es obligatoria')
      return
    }
    setGuardandoT(true)
    setErrTransicion(null)
    await supabase
      .from('incidencias')
      .update({ estado: 'resuelta', fecha_nueva_clase: fechaNuevaClase })
      .eq('id', popupResuelta.id)
    setPopupResuelta(null)
    setGuardandoT(false)
    cargar()
    cargarStats()
  }

  async function marcarCaducada() {
    if (!popupCaducada) return
    setGuardandoT(true)
    const update: Record<string, string | null> = { estado: 'caducada' }
    if (obsExtra.trim()) {
      const base = popupCaducada.obsActual ?? ''
      update.observaciones = `${base}\nObservaciones tras caducar: ${obsExtra.trim()}`
    }
    await supabase.from('incidencias').update(update).eq('id', popupCaducada.id)
    setPopupCaducada(null)
    setGuardandoT(false)
    cargar()
    cargarStats()
  }

  async function volverPendienteDesdeResuelta(id: string) {
    await supabase.from('incidencias').update({ estado: 'pendiente', fecha_nueva_clase: null }).eq('id', id)
    cargar()
    cargarStats()
  }

  async function volverPendienteDesdeCaducada(id: string, obs: string | null) {
    const textoLimpio = obs?.split('\nObservaciones tras caducar:')[0] ?? null
    await supabase.from('incidencias').update({ estado: 'pendiente', observaciones: textoLimpio || null }).eq('id', id)
    cargar()
    cargarStats()
  }

  async function eliminar(id: string) {
    await supabase.from('incidencias').delete().eq('id', id)
    setConfirmDeleteId(null)
    cargar()
    cargarStats()
  }

  // --- Estilos reutilizables ---
  const inputCls = 'px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent'
  const btnAccion = 'px-2 py-1 rounded-md border text-xs transition-colors'
  const colSpan = pestanya === 'resuelta' ? 8 : 7
  const labelModal = editando ? 'Guardar cambios' : 'Crear incidencia'
  const confirmLabelModal = guardando ? 'Guardando...' : labelModal

  function renderFilas() {
    if (cargando) {
      return (
        <tr>
          <td colSpan={colSpan} className="text-center py-16">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          </td>
        </tr>
      )
    }
    if (lista.length === 0) {
      return (
        <tr>
          <td colSpan={colSpan} className="text-center py-16 text-gray-400 text-sm">
            No hay incidencias {LABELS[pestanya as Estado].toLowerCase()}
          </td>
        </tr>
      )
    }
    return lista.map(i => (
      <tr key={i.id} className="hover:bg-accent/5 transition-colors">
        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatFecha(i.fecha)}</td>
        <td className="px-4 py-3 text-gray-900 font-medium">{i.nombre_socio}</td>
        <td className="px-4 py-3 text-gray-700">{i.sesion}</td>
        <td className="px-4 py-3">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            i.aviso ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {i.aviso ? 'Sí' : 'No'}
          </span>
        </td>
        <td className="px-4 py-3 text-gray-500">{i.hora_aviso ? i.hora_aviso.substring(0, 5) : '—'}</td>
        <td className="px-4 py-3 text-gray-500 overflow-hidden">
          <span className="block truncate" title={i.observaciones ?? undefined}>
            {i.observaciones || '—'}
          </span>
        </td>
        {pestanya === 'resuelta' && (
          <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
            {i.fecha_nueva_clase ? formatFecha(i.fecha_nueva_clase) : '—'}
          </td>
        )}
        <td className="px-4 py-3 text-right">
          <div className="flex gap-1 whitespace-nowrap justify-end">
            <button
              onClick={() => abrirEditar(i)}
              className={`${btnAccion} border-gray-200 text-gray-600 hover:border-accent hover:bg-accent/10`}
            >
              Editar
            </button>
            {pestanya === 'pendiente' && (
              <>
                <button
                  onClick={() => { setPopupResuelta({ id: i.id }); setFechaNuevaClase(''); setErrTransicion(null) }}
                  className={`${btnAccion} border-green-100 text-green-700 hover:bg-green-50`}
                >
                  Resuelta
                </button>
                <button
                  onClick={() => { setPopupCaducada({ id: i.id, obsActual: i.observaciones }); setObsExtra(''); setErrTransicion(null) }}
                  className={`${btnAccion} border-orange-100 text-orange-600 hover:bg-orange-50`}
                >
                  Caducada
                </button>
              </>
            )}
            {pestanya === 'resuelta' && (
              <button
                onClick={() => volverPendienteDesdeResuelta(i.id)}
                className={`${btnAccion} border-blue-100 text-blue-600 hover:bg-blue-50`}
              >
                Pendiente
              </button>
            )}
            {pestanya === 'caducada' && (
              <button
                onClick={() => volverPendienteDesdeCaducada(i.id, i.observaciones)}
                className={`${btnAccion} border-blue-100 text-blue-600 hover:bg-blue-50`}
              >
                Pendiente
              </button>
            )}
            <button
              onClick={() => setConfirmDeleteId(i.id)}
              className={`${btnAccion} border-red-100 text-red-500 hover:bg-red-50`}
            >
              Eliminar
            </button>
          </div>
        </td>
      </tr>
    ))
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Cabecera */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Incidencias de clases</h1>
          {pestanya !== 'estadisticas' && (
            <button
              onClick={abrirNuevo}
              className="px-4 py-2 bg-accent-dark hover:bg-accent text-gray-800 text-sm font-medium rounded-lg transition-colors"
            >
              + Nueva incidencia
            </button>
          )}
        </div>

        <div className={`bg-white rounded-2xl border border-gray-200 ${pestanya === 'estadisticas' ? '' : 'overflow-hidden'}`}>

          {/* Pestanyas */}
          <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {PESTANYAS_GESTION.map(tab => (
                  <button
                    key={tab}
                    onClick={() => cambiarPestanya(tab)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      pestanya === tab
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {LABELS[tab]}
                  </button>
                ))}
              </div>
              <button
                onClick={() => cambiarPestanya('estadisticas')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  pestanya === 'estadisticas'
                    ? 'bg-accent border-accent-dark text-gray-800'
                    : 'border-gray-200 text-gray-500 hover:border-accent hover:text-gray-700 bg-white'
                }`}
              >
                Estadísticas
              </button>
            </div>
            {pestanya !== 'estadisticas' && (
              <p className="text-sm text-gray-400">
                {cargando ? 'Cargando...' : `${lista.length} registros`}
              </p>
            )}
          </div>

          {/* Vista de gestión: filtros + tabla */}
          {pestanya !== 'estadisticas' && (
            <>
              {/* Barra de filtros */}
              <div className="px-4 sm:px-5 py-3 border-b border-gray-100 flex flex-wrap gap-2">
                <input
                  type="text"
                  value={filtros.socio}
                  onChange={e => setFiltros(f => ({ ...f, socio: e.target.value }))}
                  placeholder="Buscar socio..."
                  className={`${inputCls} w-full md:flex-1`}
                />
                <input
                  type="text"
                  value={filtros.sesion}
                  onChange={e => setFiltros(f => ({ ...f, sesion: e.target.value }))}
                  placeholder="Buscar sesión..."
                  className={`${inputCls} w-full md:flex-1`}
                />
                <input
                  type="date"
                  value={filtros.fechaDesde}
                  onChange={e => setFiltros(f => ({ ...f, fechaDesde: e.target.value }))}
                  className={`${inputCls} w-full md:flex-1`}
                />
                <input
                  type="date"
                  value={filtros.fechaHasta}
                  onChange={e => setFiltros(f => ({ ...f, fechaHasta: e.target.value }))}
                  className={`${inputCls} w-full md:flex-1`}
                />
                <select
                  value={filtros.aviso}
                  onChange={e => setFiltros(f => ({ ...f, aviso: e.target.value as 'todos' | 'si' | 'no' }))}
                  className={`${inputCls} w-full md:flex-1`}
                >
                  <option value="todos">¿Avisó? Todos</option>
                  <option value="si">Sí avisó</option>
                  <option value="no">No avisó</option>
                </select>
                {hayFiltrosActivos(filtros) && (
                  <button
                    onClick={() => setFiltros(FILTROS_VACIO)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm table-fixed min-w-[980px]">
                  <colgroup>
                    <col className="w-[90px]" />
                    <col className="w-[110px]" />
                    <col className="w-[120px]" />
                    <col className="w-[70px]" />
                    <col className="w-[85px]" />
                    <col />{/* Observaciones — toma el espacio restante */}
                    {pestanya === 'resuelta' && <col className="w-[130px]" />}
                    <col className="w-[260px]" />
                  </colgroup>
                  <thead className="bg-accent/10 border-b border-accent/20">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Socio</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sesión</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">¿Avisó?</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Hora aviso</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Observaciones</th>
                      {pestanya === 'resuelta' && (
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha nueva clase</th>
                      )}
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {renderFilas()}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Vista Estadísticas — VER-48 */}
          {pestanya === 'estadisticas' && (
            <div className="px-4 sm:px-6 py-6">

              {/* Filtros: socio + mes + año + limpiar */}
              <div className="flex flex-col md:flex-row gap-2 md:items-center mb-4">
                <input
                  type="text"
                  value={busquedaStats}
                  onChange={e => setBusquedaStats(e.target.value)}
                  placeholder="Buscar socio..."
                  className={`${inputCls} w-full md:flex-1`}
                />
                <Select
                  value={mesStats}
                  onChange={setMesStats}
                  options={opcionesMeses}
                  placeholder="Todos los meses"
                  className="w-full md:flex-1"
                />
                <Select
                  value={anyoStats}
                  onChange={setAnyoStats}
                  options={opcionesAnyos}
                  placeholder="Todos los años"
                  className="w-full md:flex-1"
                />
                {hayFiltroStats && (
                  <button
                    onClick={() => { setBusquedaStats(''); setMesStats(''); setAnyoStats('') }}
                    className="text-xs text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {/* Etiqueta de contexto */}
              <p className="text-base font-semibold text-gray-700 mb-4">
                {[busquedaStats, mesStats ? MESES[Number.parseInt(mesStats) - 1] : '', anyoStats].filter(Boolean).join(' · ') || 'Totales'}
              </p>

              {/* 5 tarjetas de métricas */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-xs font-medium text-gray-500 mt-1">Total incidencias</p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
                  <p className="text-2xl font-bold text-yellow-700">{stats.pendientes}</p>
                  <p className="text-xs font-medium text-yellow-600 mt-1">Pendientes</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <p className="text-2xl font-bold text-green-700">{stats.resueltas}</p>
                  <p className="text-xs font-medium text-green-600 mt-1">Resueltas</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <p className="text-2xl font-bold text-orange-600">{stats.caducadas}</p>
                  <p className="text-xs font-medium text-orange-500 mt-1">Caducadas</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                  <p className="text-2xl font-bold text-red-600">{stats.sinAviso}</p>
                  <p className="text-xs font-medium text-red-500 mt-1">Sin aviso</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Modal crear/editar — VER-47 */}
      {modalOpen && (
        <Modal
          title={editando ? 'Editar incidencia' : 'Nueva incidencia'}
          confirmLabel={confirmLabelModal}
          confirmDisabled={guardando}
          onConfirm={guardarModal}
          onClose={() => setModalOpen(false)}
        >
          <FormField id="i-fecha" label="Fecha">
            <input
              id="i-fecha"
              type="date"
              value={formFecha}
              onChange={e => setFormFecha(e.target.value)}
              className={`w-full ${inputCls}`}
            />
          </FormField>

          <FormField id="i-socio" label="Nombre del socio">
            <input
              id="i-socio"
              type="text"
              value={formSocio}
              onChange={e => setFormSocio(e.target.value)}
              placeholder="Nombre y apellidos"
              className={`w-full ${inputCls}`}
            />
          </FormField>

          <FormField id="i-sesion" label="Sesión">
            <input
              id="i-sesion"
              type="text"
              value={formSesion}
              onChange={e => setFormSesion(e.target.value)}
              placeholder="Ej: Yoga martes 10:00"
              className={`w-full ${inputCls}`}
            />
          </FormField>

          {/* Toggle ¿Avisó? */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const next = !formAviso
                setFormAviso(next)
                if (!next) setFormHoraAviso('')
              }}
              className={`relative w-10 h-5 rounded-full transition-colors ${formAviso ? 'bg-accent' : 'bg-gray-200'}`}
              aria-label="¿Avisó?"
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${formAviso ? 'translate-x-5' : ''}`} />
            </button>
            <span className="text-xs font-medium text-gray-600">¿Avisó?</span>
          </div>

          {formAviso && (
            <FormField id="i-hora" label="Hora aviso" optional>
              <input
                id="i-hora"
                type="time"
                value={formHoraAviso}
                onChange={e => setFormHoraAviso(e.target.value)}
                className={`w-full ${inputCls}`}
              />
            </FormField>
          )}

          <FormField id="i-obs" label="Observaciones" optional>
            <textarea
              id="i-obs"
              value={formObs}
              onChange={e => setFormObs(e.target.value)}
              rows={3}
              placeholder="Notas adicionales..."
              className={`w-full ${inputCls} resize-none`}
            />
          </FormField>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </Modal>
      )}

      {/* Popup: marcar como Resuelta */}
      {popupResuelta && (
        <Modal
          title="Marcar como resuelta"
          confirmLabel={guardandoT ? 'Guardando...' : 'Confirmar'}
          confirmDisabled={guardandoT}
          onConfirm={marcarResuelta}
          onClose={() => setPopupResuelta(null)}
        >
          <FormField id="p-fecha-nueva" label="Fecha de la nueva clase">
            <input
              id="p-fecha-nueva"
              type="date"
              value={fechaNuevaClase}
              onChange={e => { setFechaNuevaClase(e.target.value); setErrTransicion(null) }}
              className={`w-full ${inputCls}`}
            />
          </FormField>
          {errTransicion && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{errTransicion}</p>
          )}
        </Modal>
      )}

      {/* Popup: marcar como Caducada */}
      {popupCaducada && (
        <Modal
          title="Marcar como caducada"
          confirmLabel={guardandoT ? 'Guardando...' : 'Confirmar'}
          confirmDisabled={guardandoT}
          onConfirm={marcarCaducada}
          onClose={() => setPopupCaducada(null)}
        >
          <FormField id="p-obs-extra" label="Observaciones adicionales" optional>
            <textarea
              id="p-obs-extra"
              value={obsExtra}
              onChange={e => setObsExtra(e.target.value)}
              rows={3}
              placeholder="Se añadirán al final de las observaciones existentes..."
              className={`w-full ${inputCls} resize-none`}
            />
          </FormField>
          <p className="text-xs text-gray-400">
            Si hay observaciones previas, el texto se añadirá a continuación sin sobreescribir nada.
          </p>
        </Modal>
      )}

      {/* Confirmación eliminar */}
      {confirmDeleteId && (
        <Modal
          title="Eliminar incidencia"
          confirmLabel="Eliminar definitivamente"
          onConfirm={() => eliminar(confirmDeleteId)}
          onClose={() => setConfirmDeleteId(null)}
        >
          <p className="text-sm text-gray-600">
            Esta acción eliminará la incidencia permanentemente. No se puede deshacer.
          </p>
        </Modal>
      )}
    </div>
  )
}
