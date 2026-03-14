// Panel de gestión de usuarios (admin) — tabla de empleados + modal de creación/edición.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import SearchInput from '../../components/ui/SearchInput'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import FormField from '../../components/ui/FormField'
import CheckboxGroup from '../../components/ui/CheckboxGroup'
import SubPageHeader from '../../components/ui/SubPageHeader'
import { normalizar } from '../../utils/normalizar'

type Empleado = {
  id: string
  nombre: string
  email: string
  rol: string
  activo: boolean
  servicios: string[] // IDs de servicios asignados
}

type Servicio = {
  id: string
  nombre: string
}

export default function AdminUsersPage() {
  const navigate = useNavigate()

  // --- Datos ---
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [cargando, setCargando] = useState(true)

  // --- Búsqueda ---
  const [busqueda, setBusqueda] = useState('')

  // --- Modal ---
  const [modalOpen, setModalOpen] = useState(false)
  const [empleadoEdicion, setEmpleadoEdicion] = useState<Empleado | null>(null)
  const [nombre, setNombre] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [email, setEmail] = useState('')
  const [rol, setRol] = useState('employee')
  // Almacena IDs de servicios seleccionados en el modal
  const [serviciosAsignados, setServiciosAsignados] = useState<string[]>([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)

  const esEdicion = empleadoEdicion !== null
  const labelConfirmar = esEdicion ? 'Guardar cambios' : 'Enviar invitación'

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    setCargando(true)

    // Cargamos en paralelo los perfiles, servicios activos y asignaciones
    const [{ data: perfiles }, { data: svcs }, { data: asignaciones }] = await Promise.all([
      supabase.from('profiles').select('*').order('nombre'),
      supabase.from('services').select('id, nombre').eq('activo', true).order('nombre'),
      supabase.from('service_employees').select('employee_id, service_id'),
    ])

    // Agrupamos las asignaciones por employee_id para consultarlas fácilmente
    const asignacionesPorEmpleado = new Map<string, string[]>()
    asignaciones?.forEach(a => {
      const lista = asignacionesPorEmpleado.get(a.employee_id) ?? []
      lista.push(a.service_id)
      asignacionesPorEmpleado.set(a.employee_id, lista)
    })

    setEmpleados(
      perfiles?.map(p => ({
        ...p,
        servicios: asignacionesPorEmpleado.get(p.id) ?? [],
      })) ?? []
    )
    setServicios(svcs ?? [])
    setCargando(false)
  }

  // --- Abrir modal ---

  function abrirNuevo() {
    setEmpleadoEdicion(null)
    setNombre(''); setApellidos(''); setEmail(''); setRol('employee'); setServiciosAsignados([])
    setError(null)
    setModalOpen(true)
  }

  function abrirEditar(emp: Empleado) {
    setEmpleadoEdicion(emp)
    const partes = emp.nombre.split(' ')
    setNombre(partes[0] ?? '')
    setApellidos(partes.slice(1).join(' '))
    setEmail(emp.email)
    setRol(emp.rol)
    setServiciosAsignados([...emp.servicios])
    setError(null)
    setModalOpen(true)
  }

  // --- CheckboxGroup trabaja con nombres; internamente usamos IDs ---

  function toggleServicio(nombreServicio: string) {
    const servicio = servicios.find(s => s.nombre === nombreServicio)
    if (!servicio) return
    setServiciosAsignados(prev =>
      prev.includes(servicio.id)
        ? prev.filter(id => id !== servicio.id)
        : [...prev, servicio.id]
    )
  }

  // Convierte IDs seleccionados → nombres para mostrar en CheckboxGroup
  const nombresSeleccionados = serviciosAsignados
    .map(id => servicios.find(s => s.id === id)?.nombre ?? '')
    .filter(Boolean)

  // --- Crear usuario (via Edge Function) ---

  async function handleCrear() {
    setGuardando(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            nombre: `${nombre} ${apellidos}`.trim(),
            email,
            rol,
          }),
        }
      )

      if (!response.ok) {
        const body = await response.json()
        throw new Error(body.error ?? 'Error al crear el usuario')
      }

      const { user: nuevoUsuario } = await response.json()

      // Asignar servicios si se seleccionaron
      if (serviciosAsignados.length > 0 && nuevoUsuario?.id) {
        await supabase.from('service_employees').insert(
          serviciosAsignados.map(sid => ({ employee_id: nuevoUsuario.id, service_id: sid }))
        )
      }

      setModalOpen(false)
      setExito(`Invitación enviada a ${email}`)
      setTimeout(() => setExito(null), 5000)
      cargarDatos()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el usuario')
    } finally {
      setGuardando(false)
    }
  }

  // --- Editar usuario ---

  async function handleEditar() {
    if (!empleadoEdicion) return
    setGuardando(true)
    setError(null)

    try {
      await supabase
        .from('profiles')
        .update({ nombre: `${nombre} ${apellidos}`.trim(), rol })
        .eq('id', empleadoEdicion.id)

      // Reemplazar asignaciones: borrar las actuales e insertar las nuevas
      await supabase.from('service_employees').delete().eq('employee_id', empleadoEdicion.id)

      if (serviciosAsignados.length > 0) {
        await supabase.from('service_employees').insert(
          serviciosAsignados.map(sid => ({ employee_id: empleadoEdicion.id, service_id: sid }))
        )
      }

      setModalOpen(false)
      cargarDatos()
    } catch {
      setError('Error al guardar los cambios. Inténtalo de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  // --- Activar/desactivar usuario ---

  async function toggleActivo(emp: Empleado) {
    await supabase.from('profiles').update({ activo: !emp.activo }).eq('id', emp.id)
    cargarDatos()
  }

  // --- Filtro ---

  const empleadosFiltrados = empleados.filter(e =>
    normalizar(e.nombre).includes(normalizar(busqueda)) ||
    normalizar(e.email).includes(normalizar(busqueda))
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-16">

      <SubPageHeader
        backLabel="← Dashboard"
        onBack={() => navigate('/dashboard')}
        title="Gestión de usuarios"
        rightSlot={
          <button onClick={abrirNuevo} className="px-4 py-2 bg-white hover:bg-white/80 text-gray-800 text-sm font-medium rounded-lg transition-colors">
            + Nuevo empleado
          </button>
        }
      />

      <main className="max-w-5xl mx-auto px-6 py-8">

        {/* Mensaje de éxito */}
        {exito && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
            {exito}
          </div>
        )}

        {/* Tabla de empleados */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {cargando ? 'Cargando...' : `${empleadosFiltrados.length} usuarios registrados`}
            </p>
            <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar empleado..." />
          </div>

          <table className="w-full text-sm">
            <thead className="bg-accent/10 border-b border-accent/20">
              <tr>
                {['Nombre', 'Email', 'Rol', 'Servicios asignados', 'Estado', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {empleadosFiltrados.map(emp => (
                <tr key={emp.id} className="hover:bg-accent/5 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/40 flex items-center justify-center text-xs font-semibold text-gray-700">
                        {emp.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <span className="font-medium text-gray-900">{emp.nombre}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-500">{emp.email}</td>
                  <td className="px-5 py-4">
                    <Badge variant={emp.rol === 'admin' ? 'admin' : 'empleado'} />
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {emp.servicios.length > 0
                      ? emp.servicios
                          .map(id => servicios.find(s => s.id === id)?.nombre ?? id)
                          .join(', ')
                      : <span className="text-gray-300">—</span>
                    }
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={emp.activo ? 'activo' : 'inactivo'} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => abrirEditar(emp)}
                        className="px-2.5 py-1 rounded-md border border-gray-200 text-xs text-gray-600 hover:border-accent hover:bg-accent/10 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => toggleActivo(emp)}
                        className={`px-2.5 py-1 rounded-md border text-xs transition-colors ${
                          emp.activo
                            ? 'border-red-100 text-red-500 hover:bg-red-50'
                            : 'border-green-100 text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {emp.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal creación/edición */}
      {modalOpen && (
        <Modal
          title={esEdicion ? 'Editar empleado' : 'Nuevo empleado'}
          confirmLabel={guardando ? 'Guardando...' : labelConfirmar}
          confirmDisabled={guardando}
          onConfirm={esEdicion ? handleEditar : handleCrear}
          onClose={() => setModalOpen(false)}
        >
          <div className="grid grid-cols-2 gap-3">
            <FormField id="u-nombre" label="Nombre">
              <input
                id="u-nombre"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ana"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </FormField>
            <FormField id="u-apellidos" label="Apellidos">
              <input
                id="u-apellidos"
                value={apellidos}
                onChange={e => setApellidos(e.target.value)}
                placeholder="García López"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </FormField>
          </div>

          <FormField id="u-email" label="Email">
            <input
              id="u-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ana@vertice.es"
              disabled={esEdicion}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent disabled:bg-gray-50 disabled:text-gray-400"
            />
          </FormField>

          <FormField id="u-rol" label="Rol">
            <select
              id="u-rol"
              value={rol}
              onChange={e => setRol(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="employee">Empleado</option>
              <option value="admin">Admin</option>
            </select>
          </FormField>

          <CheckboxGroup
            label="Servicios asignados"
            options={servicios.map(s => s.nombre)}
            selected={nombresSeleccionados}
            onToggle={toggleServicio}
            scrollable
          />

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {!esEdicion && (
            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
              El empleado recibirá un email para establecer su contraseña al crear la cuenta.
            </p>
          )}
        </Modal>
      )}

    </div>
  )
}
