// Dashboard del admin — accesos rápidos y lista de todos los servicios.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.webp'
import SearchInput from '../../components/ui/SearchInput'
import { normalizar } from '../../utils/normalizar'

type Servicio = { id: string; nombre: string; descripcion: string; empleados: number; registros: number; activo: boolean }

const SERVICIOS: Servicio[] = []


export default function DashboardAdminPage() {
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')

  const serviciosFiltrados = SERVICIOS.filter(s =>
    normalizar(s.nombre).includes(normalizar(busqueda))
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-16">

      {/* Header */}
      <header className="bg-accent border-b border-accent-dark px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Vértice" className="h-8 object-contain" />
          <span className="px-2 py-0.5 rounded-full bg-white/40 text-gray-700 text-xs font-medium">Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700">Admin</span>
          <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
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
              <div className="w-10 h-10 rounded-xl bg-accent/30 flex items-center justify-center text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
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
              <div className="w-10 h-10 rounded-xl bg-accent/30 flex items-center justify-center text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Todos los servicios</h2>
            <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar servicio..." />
          </div>
          <div className="space-y-3">
            {serviciosFiltrados.map(s => (
              <button
                key={s.id}
                onClick={() => navigate(`/services/${s.id}`)}
                className="w-full flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-200 hover:border-accent hover:bg-accent/5 hover:shadow-sm transition-all text-left group"
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
