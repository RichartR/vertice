// Panel de gestión de servicios (admin) — tabla con pestañas Activos/Inactivos + modal creación/edición.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Tooltip from '../../components/ui/Tooltip'
import SearchInput from '../../components/ui/SearchInput'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import FormField from '../../components/ui/FormField'
import MultiSelect from '../../components/ui/MultiSelect'
import { normalizar } from '../../utils/normalizar'
import { updateServiceEmployees } from '../../utils/assignments'

type Servicio = {
  id: string
  nombre: string
  descripcion: string
  empleados: string[] // IDs de empleados asignados
  activo: boolean
}

type Empleado = {
  id: string
  nombre: string
}

type Pestanya = 'activos' | 'inactivos'

export default function AdminServicesPage() {
  const navigate = useNavigate()

  // --- Datos ---
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [empleadosActivos, setEmpleadosActivos] = useState<Empleado[]>([])
  const [cargando, setCargando] = useState(true)

  // --- Pestanyas y búsqueda ---
  const [pestanyaActiva, setPestanyaActiva] = useState<Pestanya>('activos')
  const [busqueda, setBusqueda] = useState('')

  // --- Modal ---
  const [modalOpen, setModalOpen] = useState(false)
  const [servicioEdicion, setServicioEdicion] = useState<Servicio | null>(null)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [empleadosAsignados, setEmpleadosAsignados] = useState<string[]>([])
  
  const [confirmDeactivate, setConfirmDeactivate] = useState<Servicio | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const esEdicion = servicioEdicion !== null
  const labelAccion = esEdicion ? 'Guardar cambios' : 'Crear servicio'
  const labelConfirmar = guardando ? 'Guardando...' : labelAccion

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    setCargando(true)

    // El admin puede ver todos los servicios (activos e inactivos) gracias a la RLS "Admin gestiona servicios"
    const [{ data: svcs }, { data: emps }, { data: asignaciones }] = await Promise.all([
      supabase.from('services').select('*').order('nombre'),
      supabase.from('profiles').select('id, nombre').eq('activo', true).eq('rol', 'employee').order('nombre'),
      supabase.from('service_employees').select('service_id, employee_id'),
    ])

    const asignacionesPorServicio = new Map<string, string[]>()
    asignaciones?.forEach(a => {
      const lista = asignacionesPorServicio.get(a.service_id) ?? []
      lista.push(a.employee_id)
      asignacionesPorServicio.set(a.service_id, lista)
    })

    setServicios(
      svcs?.map(s => ({
        ...s,
        empleados: asignacionesPorServicio.get(s.id) ?? [],
      })) ?? []
    )
    setEmpleadosActivos(emps ?? [])
    setCargando(false)
  }

  // --- Abrir modal ---

  function abrirNuevo() {
    setServicioEdicion(null)
    setNombre(''); setDescripcion(''); setEmpleadosAsignados([])
    setError(null)
    setModalOpen(true)
  }

  function abrirEditar(s: Servicio) {
    setServicioEdicion(s)
    setNombre(s.nombre)
    setDescripcion(s.descripcion)
    setEmpleadosAsignados([...s.empleados])
    setError(null)
    setModalOpen(true)
  }

  // --- CheckboxGroup trabaja con nombres; internamente usamos IDs ---

  function toggleEmpleado(nombreEmpleado: string) {
    const emp = empleadosActivos.find(e => e.nombre === nombreEmpleado)
    if (!emp) return
    setEmpleadosAsignados(prev =>
      prev.includes(emp.id)
        ? prev.filter(id => id !== emp.id)
        : [...prev, emp.id]
    )
  }

  const nombresSeleccionados = empleadosAsignados
    .map(id => empleadosActivos.find(e => e.id === id)?.nombre ?? '')
    .filter(Boolean)

  // --- Crear servicio ---

  async function handleCrear() {
    if (!nombre.trim()) { setError('El nombre del servicio es obligatorio'); return }
    setGuardando(true)
    setError(null)

    try {
      const { data: nuevoServicio, error: errInsert } = await supabase
        .from('services')
        .insert({ nombre: nombre.trim(), descripcion: descripcion.trim(), activo: true })
        .select('id')
        .single()

      if (errInsert) throw errInsert

      await updateServiceEmployees(nuevoServicio.id, empleadosAsignados)

      setModalOpen(false)
      cargarDatos()
    } catch {
      setError('Error al crear el servicio. Inténtalo de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  // --- Editar servicio ---

  async function handleEditar() {
    if (!servicioEdicion || !nombre.trim()) return
    setGuardando(true)
    setError(null)

    try {
      await supabase
        .from('services')
        .update({ nombre: nombre.trim(), descripcion: descripcion.trim() })
        .eq('id', servicioEdicion.id)

      await updateServiceEmployees(servicioEdicion.id, empleadosAsignados)

      setModalOpen(false)
      cargarDatos()
    } catch {
      setError('Error al guardar los cambios. Inténtalo de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  // --- Activar / desactivar (eliminación lógica) ---

  async function setActivo(s: Servicio, activo: boolean) {
    await supabase.from('services').update({ activo }).eq('id', s.id)
    cargarDatos()
    setConfirmDeactivate(null)
  }

  // --- Listas filtradas por pestaña ---

  const activos = servicios.filter(s => s.activo && normalizar(s.nombre).includes(normalizar(busqueda)))
  const inactivos = servicios.filter(s => !s.activo && normalizar(s.nombre).includes(normalizar(busqueda)))
  const lista = pestanyaActiva === 'activos' ? activos : inactivos

  return (
    <div className="min-h-screen bg-gray-50 pb-16">

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Gestión de servicios</h1>
          <button onClick={abrirNuevo} className="px-4 py-2 bg-accent-dark hover:bg-accent text-gray-800 text-sm font-medium rounded-lg transition-colors">
            + Nuevo servicio
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

          {/* Cabecera con pestañas y búsqueda */}
          <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {(['activos', 'inactivos'] as Pestanya[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setPestanyaActiva(tab); setBusqueda('') }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                    pestanyaActiva === tab
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-400">
                {cargando ? 'Cargando...' : `${lista.length} ${pestanyaActiva}`}
              </p>
              <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar servicio..." />
            </div>
          </div>

          <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed min-w-[600px]">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[32%]" />
              {pestanyaActiva === 'activos' && <col className="w-[26%]" />}
              <col className={pestanyaActiva === 'activos' ? 'w-[20%]' : 'w-[46%]'} />
            </colgroup>
            <thead className="bg-accent/10 border-b border-accent/20">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Servicio</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Descripción</th>
                {pestanyaActiva === 'activos' && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Empleados asignados</th>
                )}
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lista.map(s => {
                const nombresEmpleados = s.empleados
                  .map(id => empleadosActivos.find(e => e.id === id)?.nombre ?? '')
                  .filter(Boolean)
                  .join(', ')

                return (
                  <tr key={s.id} className="hover:bg-accent/5 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 shrink-0 rounded-xl bg-accent/30 flex items-center justify-center text-sm font-bold text-gray-700">
                          {s.nombre[0]}
                        </div>
                        <span className="font-semibold text-gray-900 truncate">{s.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-500 overflow-hidden">
                      {s.descripcion
                        ? <Tooltip text={s.descripcion}>{s.descripcion}</Tooltip>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    {pestanyaActiva === 'activos' && (
                      <td className="px-4 py-4 text-gray-500 overflow-hidden">
                        {nombresEmpleados
                          ? <Tooltip text={nombresEmpleados}>{nombresEmpleados}</Tooltip>
                          : <span className="text-gray-300">Sin asignar</span>
                        }
                      </td>
                    )}
                    <td className="px-4 py-4">
                      <div className="flex gap-1.5 whitespace-nowrap">
                        {pestanyaActiva === 'activos' ? (
                          <>
                            <button
                              onClick={() => navigate(`/services/${s.id}`)}
                              className="px-2 py-1 rounded-md border border-gray-200 text-xs text-gray-600 hover:border-accent hover:bg-accent/10 transition-colors"
                            >
                              Ver
                            </button>
                            <button
                              onClick={() => abrirEditar(s)}
                              className="px-2 py-1 rounded-md border border-gray-200 text-xs text-gray-600 hover:border-accent hover:bg-accent/10 transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => setConfirmDeactivate(s)}
                              className="px-2.5 py-1 rounded-md border border-red-100 text-xs text-red-500 hover:bg-red-50 transition-colors"
                            >
                              Desactivar
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setActivo(s, true)}
                            className="px-2 py-1 rounded-md border border-green-100 text-xs text-green-600 hover:bg-green-50 transition-colors"
                          >
                            Reactivar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-4 px-1">
          Los servicios desactivados no se eliminan — sus registros históricos se conservan siempre.
        </p>
      </main>

      {/* Modal creación/edición — solo para servicios activos */}
      {modalOpen && (
        <Modal
          title={esEdicion ? 'Editar servicio' : 'Nuevo servicio'}
          confirmLabel={labelConfirmar}
          confirmDisabled={guardando}
          onConfirm={esEdicion ? handleEditar : handleCrear}
          onClose={() => setModalOpen(false)}
        >
          <FormField id="s-nombre" label="Nombre del servicio">
            <input
              id="s-nombre"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Nutrición deportiva"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </FormField>

          <FormField id="s-descripcion" label="Descripción" optional>
            <textarea
              id="s-descripcion"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Breve descripción del servicio..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </FormField>

          <MultiSelect
            label="Empleados asignados"
            options={empleadosActivos.map(e => e.nombre)}
            selected={nombresSeleccionados}
            onToggle={toggleEmpleado}
            placeholder="Sin asignar"
          />

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </Modal>
      )}

      <ConfirmModal
        isOpen={!!confirmDeactivate}
        title="Desactivar servicio"
        message={`¿Estás seguro de que deseas desactivar el servicio "${confirmDeactivate?.nombre}"? Los registros históricos se conservarán siempre.`}
        confirmLabel="Desactivar"
        onConfirm={() => confirmDeactivate && setActivo(confirmDeactivate, false)}
        onClose={() => setConfirmDeactivate(null)}
        variant="danger"
      />
    </div>
  )
}
