// Panel de gestión de usuarios (admin) — tabla con pestañas Activos/Inactivos + modal de creación/edición.
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import SearchInput from '../../components/ui/SearchInput'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import FormField from '../../components/ui/FormField'
import MultiSelect from '../../components/ui/MultiSelect'
import { normalizar } from '../../utils/normalizar'
import { updateEmployeeServices } from '../../utils/assignments'
import Select from '../../components/ui/Select'

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

type Pestanya = 'activos' | 'inactivos'

export default function AdminUsersPage() {

  // --- Datos ---
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [cargando, setCargando] = useState(true)

  // --- Pestanyas y búsqueda ---
  const [pestanyaActiva, setPestanyaActiva] = useState<Pestanya>('activos')
  const [busqueda, setBusqueda] = useState('')

  // --- Modal ---
  const [modalOpen, setModalOpen] = useState(false)
  const [empleadoEdicion, setEmpleadoEdicion] = useState<Empleado | null>(null)
  const [nombre, setNombre] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [email, setEmail] = useState('')
  const [rol, setRol] = useState('employee')
  const [serviciosAsignados, setServiciosAsignados] = useState<string[]>([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)

  const esEdicion = empleadoEdicion !== null
  const labelAccion = esEdicion ? 'Guardar cambios' : 'Enviar invitación'
  const labelConfirmar = guardando ? 'Guardando...' : labelAccion

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    setCargando(true)

    const [{ data: perfiles }, { data: svcs }, { data: asignaciones }] = await Promise.all([
      supabase.from('profiles').select('*').order('nombre'),
      supabase.from('services').select('id, nombre').eq('activo', true).order('nombre'),
      supabase.from('service_employees').select('employee_id, service_id'),
    ])

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

  function toggleServicio(nombreServicio: string) {
    const servicio = servicios.find(s => s.nombre === nombreServicio)
    if (!servicio) return
    setServiciosAsignados(prev =>
      prev.includes(servicio.id)
        ? prev.filter(id => id !== servicio.id)
        : [...prev, servicio.id]
    )
  }

  const nombresSeleccionados = serviciosAsignados
    .map(id => servicios.find(s => s.id === id)?.nombre ?? '')
    .filter(Boolean)

  // --- Crear usuario (via Edge Function) ---

  async function handleCrear() {
    setGuardando(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.refreshSession()

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

      if (nuevoUsuario?.id) {
        await updateEmployeeServices(nuevoUsuario.id, serviciosAsignados)
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

      await updateEmployeeServices(empleadoEdicion.id, serviciosAsignados)

      setModalOpen(false)
      cargarDatos()
    } catch {
      setError('Error al guardar los cambios. Inténtalo de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  // --- Activar / desactivar ---

  async function setActivo(emp: Empleado, activo: boolean) {
    await supabase.from('profiles').update({ activo }).eq('id', emp.id)
    cargarDatos()
  }

  // --- Reset de contraseña ---

  const [resetEmail, setResetEmail] = useState<string | null>(null)
  const [enviandoReset, setEnviandoReset] = useState(false)

  async function handleReset() {
    if (!resetEmail) return
    setEnviandoReset(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${globalThis.location.origin}/reset-password`,
    })
    setResetEmail(null)
    setEnviandoReset(false)
    if (!err) {
      setExito(`Email enviado a ${resetEmail}`)
      setTimeout(() => setExito(null), 5000)
    }
  }

  // --- Listas filtradas por pestaña ---

  const activos = empleados.filter(e => e.activo && (
    normalizar(e.nombre).includes(normalizar(busqueda)) ||
    normalizar(e.email).includes(normalizar(busqueda))
  ))
  const inactivos = empleados.filter(e => !e.activo && (
    normalizar(e.nombre).includes(normalizar(busqueda)) ||
    normalizar(e.email).includes(normalizar(busqueda))
  ))
  const lista = pestanyaActiva === 'activos' ? activos : inactivos

  return (
    <div className="min-h-screen bg-gray-50 pb-16">

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Gestión de usuarios</h1>
          {pestanyaActiva === 'activos' && (
            <button onClick={abrirNuevo} className="px-4 py-2 bg-accent-dark hover:bg-accent text-gray-800 text-sm font-medium rounded-lg transition-colors">
              + Nuevo empleado
            </button>
          )}
        </div>

        {exito && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
            {exito}
          </div>
        )}

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
              <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar empleado..." />
            </div>
          </div>

          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-accent/10 border-b border-accent/20">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rol</th>
                {pestanyaActiva === 'activos' && (
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Servicios asignados</th>
                )}
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lista.map(emp => (
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
                  {pestanyaActiva === 'activos' && (
                    <td className="px-5 py-4 text-gray-500">
                      {emp.servicios.length > 0
                        ? emp.servicios
                            .map(id => servicios.find(s => s.id === id)?.nombre ?? id)
                            .join(', ')
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                  )}
                  <td className="px-5 py-4">
                    <div className="flex gap-2 whitespace-nowrap">
                      {pestanyaActiva === 'activos' ? (
                        <>
                          <button
                            onClick={() => abrirEditar(emp)}
                            className="px-2.5 py-1 rounded-md border border-gray-200 text-xs text-gray-600 hover:border-accent hover:bg-accent/10 transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setResetEmail(emp.email)}
                            className="px-2.5 py-1 rounded-md border border-blue-100 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            Restablecer contraseña
                          </button>
                          <button
                            onClick={() => setActivo(emp, false)}
                            className="px-2.5 py-1 rounded-md border border-red-100 text-xs text-red-500 hover:bg-red-50 transition-colors"
                          >
                            Desactivar
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setActivo(emp, true)}
                          className="px-2.5 py-1 rounded-md border border-green-100 text-xs text-green-600 hover:bg-green-50 transition-colors"
                        >
                          Reactivar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </main>

      {/* Modal confirmación reset contraseña */}
      {resetEmail && (
        <Modal
          title="Restablecer contraseña"
          confirmLabel={enviandoReset ? 'Enviando...' : 'Enviar email'}
          confirmDisabled={enviandoReset}
          onConfirm={handleReset}
          onClose={() => setResetEmail(null)}
        >
          <p className="text-sm text-gray-600">
            ¿Enviar email de restablecimiento de contraseña a <span className="font-medium text-gray-900">{resetEmail}</span>?
          </p>
        </Modal>
      )}

      {/* Modal creación/edición */}
      {modalOpen && (
        <Modal
          title={esEdicion ? 'Editar empleado' : 'Nuevo empleado'}
          confirmLabel={labelConfirmar}
          confirmDisabled={guardando}
          onConfirm={esEdicion ? handleEditar : handleCrear}
          onClose={() => setModalOpen(false)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <Select
              value={rol}
              onChange={setRol}
              options={[
                { value: 'employee', label: 'Empleado' },
                { value: 'admin', label: 'Admin' },
              ]}
            />
          </FormField>

          <MultiSelect
            label="Servicios asignados"
            options={servicios.map(s => s.nombre)}
            selected={nombresSeleccionados}
            onToggle={toggleServicio}
            placeholder="Sin asignar"
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
