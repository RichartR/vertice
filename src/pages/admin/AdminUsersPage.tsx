// Panel de gestión de usuarios (admin) — tabla de empleados + modal de creación.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const EMPLEADOS = [
  { id: '1', nombre: 'Ana García López',      email: 'ana@vertice.es',     rol: 'employee', activo: true,  servicios: ['Podología', 'Fisioterapia'] },
  { id: '2', nombre: 'Carlos Martínez Ruiz',  email: 'carlos@vertice.es',  rol: 'employee', activo: true,  servicios: ['Fisioterapia'] },
  { id: '3', nombre: 'Laura Sánchez Pérez',   email: 'laura@vertice.es',   rol: 'employee', activo: true,  servicios: ['Estética'] },
  { id: '4', nombre: 'Ricardo Torres Vidal',  email: 'ricardo@vertice.es', rol: 'admin',    activo: true,  servicios: [] },
  { id: '5', nombre: 'Marta Ruiz Blanco',     email: 'marta@vertice.es',   rol: 'employee', activo: false, servicios: ['Podología'] },
]

export default function AdminUsersPage() {
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [nombre, setNombre] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [email, setEmail] = useState('')
  const [rol, setRol] = useState('employee')

  return (
    <div className="min-h-screen bg-gray-50 pb-16">

      {/* Header */}
      <header className="bg-accent border-b border-accent-dark px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
          >
            ← Dashboard
          </button>
          <h1 className="font-semibold text-gray-900">Gestión de usuarios</h1>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-white hover:bg-white/80 text-gray-800 text-sm font-medium rounded-lg transition-colors"
        >
          + Nuevo empleado
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">

        {/* Tabla de empleados */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">{EMPLEADOS.length} usuarios registrados</p>
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
              {EMPLEADOS.map(emp => (
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
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      emp.rol === 'admin'
                        ? 'bg-purple-50 text-purple-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {emp.rol === 'admin' ? 'Admin' : 'Empleado'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {emp.servicios.length > 0
                      ? emp.servicios.join(', ')
                      : <span className="text-gray-300">—</span>
                    }
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      emp.activo
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {emp.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-3">
                      <button className="text-gray-400 hover:text-gray-600 text-xs font-medium">Editar</button>
                      <button className="text-gray-400 hover:text-red-500 text-xs font-medium">
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

      {/* Modal de creación */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Nuevo empleado</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre</label>
                  <input
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    placeholder="Ana"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Apellidos</label>
                  <input
                    value={apellidos}
                    onChange={e => setApellidos(e.target.value)}
                    placeholder="García López"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ana@vertice.es"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Rol</label>
                <select
                  value={rol}
                  onChange={e => setRol(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="employee">Empleado</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Servicios asignados</label>
                <div className="space-y-2">
                  {['Podología', 'Fisioterapia', 'Estética'].map(s => (
                    <label key={s} className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" className="accent-[#b9d9ce] w-4 h-4" />
                      <span className="text-sm text-gray-700">{s}</span>
                    </label>
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                El empleado recibirá un email para establecer su contraseña al crear la cuenta.
              </p>
            </div>

            <div className="flex gap-3 px-6 py-5 border-t border-gray-100">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button className="flex-1 px-4 py-2 rounded-lg bg-accent hover:bg-accent-dark text-gray-900 text-sm font-medium transition-colors">
                Enviar invitación
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
