// Dashboard del empleado — muestra sus servicios asignados como tarjetas clicables.
// El RLS en service_employees filtra automáticamente a las filas del empleado actual.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

type Servicio = { id: string; nombre: string; descripcion: string }

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!user) return
    cargarServicios()
  }, [user])

  async function cargarServicios() {
    // La RLS "Empleado activo ve sus asignaciones" filtra por auth.uid() = employee_id
    const { data } = await supabase
      .from('service_employees')
      .select('services(id, nombre, descripcion)')

    setServicios(
      data
        ?.map(row => row.services as unknown as Servicio | null)
        .filter((s): s is Servicio => s !== null) ?? []
    )
    setCargando(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-900">
            {profile?.nombre ? `Bienvenido, ${profile.nombre.split(' ')[0]}` : 'Bienvenido'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Selecciona un servicio para ver sus registros</p>
        </div>

        {cargando ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : servicios.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-16">
            No tienes servicios asignados todavía.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {servicios.map(servicio => (
              <button
                key={servicio.id}
                onClick={() => navigate(`/services/${servicio.id}`)}
                className="text-left p-6 rounded-2xl border border-gray-200 bg-white hover:border-accent hover:shadow-md transition-all group"
              >
                <h2 className="font-semibold text-gray-900 text-base group-hover:text-gray-700">
                  {servicio.nombre}
                </h2>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  {servicio.descripcion}
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-dark inline-block" />
                  <span>Ver registros →</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
