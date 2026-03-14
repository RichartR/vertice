// Panel de gestión de usuarios (admin) — tabla de empleados + modal de creación/edición.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchInput from '../../components/ui/SearchInput'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import FormField from '../../components/ui/FormField'
import CheckboxGroup from '../../components/ui/CheckboxGroup'
import SubPageHeader from '../../components/ui/SubPageHeader'
import { normalizar } from '../../utils/normalizar'

type Empleado = { id: string; nombre: string; email: string; rol: string; activo: boolean; servicios: string[] }

const EMPLEADOS: Empleado[] = []
const SERVICIOS_DISPONIBLES: string[] = []

export default function AdminUsersPage() {
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')
  const [empleadoEdicion, setEmpleadoEdicion] = useState<Empleado | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [nombre, setNombre] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [email, setEmail] = useState('')
  const [rol, setRol] = useState('employee')
  const [serviciosAsignados, setServiciosAsignados] = useState<string[]>([])

  const empleadosFiltrados = EMPLEADOS.filter(e =>
    normalizar(e.nombre).includes(normalizar(busqueda))
  )

  function abrirNuevo() {
    setEmpleadoEdicion(null)
    setNombre(''); setApellidos(''); setEmail(''); setRol('employee'); setServiciosAsignados([])
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
    setModalOpen(true)
  }

  function toggleServicio(s: string) {
    setServiciosAsignados(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const esEdicion = empleadoEdicion !== null

  return (
    <div className="min-h-screen bg-gray-50 pb-16">

      <SubPageHeader
        backLabel="← Dashboard"
        onBack={() => navigate('/admin/dashboard')}
        title="Gestión de usuarios"
        rightSlot={
          <button onClick={abrirNuevo} className="px-4 py-2 bg-white hover:bg-white/80 text-gray-800 text-sm font-medium rounded-lg transition-colors">
            + Nuevo empleado
          </button>
        }
      />

      <main className="max-w-5xl mx-auto px-6 py-8">

        {/* Tabla de empleados */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">{empleadosFiltrados.length} usuarios registrados</p>
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
                      ? emp.servicios.join(', ')
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
                      <button className={`px-2.5 py-1 rounded-md border text-xs transition-colors ${
                        emp.activo
                          ? 'border-red-100 text-red-500 hover:bg-red-50'
                          : 'border-green-100 text-green-600 hover:bg-green-50'
                      }`}>
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
          confirmLabel={esEdicion ? 'Guardar cambios' : 'Enviar invitación'}
          onClose={() => setModalOpen(false)}
        >
          <div className="grid grid-cols-2 gap-3">
            <FormField id="u-nombre" label="Nombre">
              <input id="u-nombre" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ana" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </FormField>
            <FormField id="u-apellidos" label="Apellidos">
              <input id="u-apellidos" value={apellidos} onChange={e => setApellidos(e.target.value)} placeholder="García López" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </FormField>
          </div>

          <FormField id="u-email" label="Email">
            <input id="u-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ana@vertice.es" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          </FormField>

          <FormField id="u-rol" label="Rol">
            <select id="u-rol" value={rol} onChange={e => setRol(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent">
              <option value="employee">Empleado</option>
              <option value="admin">Admin</option>
            </select>
          </FormField>

          <CheckboxGroup
            label="Servicios asignados"
            options={SERVICIOS_DISPONIBLES}
            selected={serviciosAsignados}
            onToggle={toggleServicio}
          />

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
