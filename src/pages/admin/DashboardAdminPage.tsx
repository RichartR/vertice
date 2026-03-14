// Dashboard del admin — accesos rápidos y lista de todos los servicios.
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.webp'

const SERVICIOS = [
  { id: '1', nombre: 'Podología',    descripcion: 'Tratamientos del pie', empleados: 2, registros: 142, activo: true },
  { id: '2', nombre: 'Fisioterapia', descripcion: 'Rehabilitación y dolor', empleados: 3, registros: 98,  activo: true },
  { id: '3', nombre: 'Estética',     descripcion: 'Tratamientos faciales y corporales', empleados: 1, registros: 76, activo: true },
]

export default function DashboardAdminPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 pb-16">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Vértice" className="h-8 object-contain" />
          <span className="font-semibold text-gray-900">Vértice</span>
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Ricardo Torres</span>
          <button className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* Accesos rápidos */}
        <div className="mb-10">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Administración</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/admin/users')}
              className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-200 hover:border-accent hover:shadow-sm transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/30 flex items-center justify-center text-lg">
                👥
              </div>
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-gray-700">Gestión de usuarios</p>
                <p className="text-sm text-gray-400 mt-0.5">Crear y editar empleados</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/admin/services')}
              className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-200 hover:border-accent hover:shadow-sm transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/30 flex items-center justify-center text-lg">
                📋
              </div>
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-gray-700">Gestión de servicios</p>
                <p className="text-sm text-gray-400 mt-0.5">Crear y editar servicios</p>
              </div>
            </button>
          </div>
        </div>

        {/* Servicios */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Todos los servicios</h2>
          <div className="space-y-3">
            {SERVICIOS.map(s => (
              <button
                key={s.id}
                onClick={() => navigate(`/services/${s.id}`)}
                className="w-full flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-200 hover:border-accent hover:shadow-sm transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-base font-semibold text-gray-500">
                    {s.nombre[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{s.nombre}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{s.descripcion}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{s.registros}</p>
                    <p className="text-xs text-gray-400">registros</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{s.empleados}</p>
                    <p className="text-xs text-gray-400">empleados</p>
                  </div>
                  <span className="text-gray-300 group-hover:text-accent transition-colors">→</span>
                </div>
              </button>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
