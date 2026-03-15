// Dashboard del admin — accesos rápidos a gestión + lista de todos los servicios activos.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import SearchInput from '../../components/ui/SearchInput'
import { normalizar } from '../../utils/normalizar'

type Servicio = { id: string; nombre: string; descripcion: string; empleados: number }

export default function DashboardAdminPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    const [{ data: svcs }, { data: asignaciones }] = await Promise.all([
      supabase.from('services').select('id, nombre, descripcion').eq('activo', true).order('nombre'),
      supabase.from('service_employees').select('service_id'),
    ])

    const countsPorServicio = new Map<string, number>()
    asignaciones?.forEach(a => {
      countsPorServicio.set(a.service_id, (countsPorServicio.get(a.service_id) ?? 0) + 1)
    })

    setServicios(
      svcs?.map(s => ({ ...s, empleados: countsPorServicio.get(s.id) ?? 0 })) ?? []
    )
    setCargando(false)
  }

  const serviciosFiltrados = servicios.filter(s =>
    normalizar(s.nombre).includes(normalizar(busqueda))
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        <div className="mb-2">
          <h1 className="text-xl font-semibold text-gray-900">
            {profile?.nombre ? `Bienvenido, ${profile.nombre.split(' ')[0]}` : 'Bienvenido'}
          </h1>
        </div>

        {/* Accesos rápidos */}
        <div className="mb-10 mt-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Administración</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* Lista de servicios */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Todos los servicios</h2>
            <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar servicio..." />
          </div>

          {cargando ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
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
                      <p className="text-sm font-semibold text-gray-900">{s.empleados}</p>
                      <p className="text-xs text-gray-400">empleados</p>
                    </div>
                    <span className="text-gray-300 group-hover:text-accent transition-colors">→</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
