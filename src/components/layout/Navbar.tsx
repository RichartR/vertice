// Barra de navegación superior — presente en todas las páginas protegidas.
// Links visibles según rol: admin ve Usuarios y Servicios; empleado ve Dashboard solo si tiene >1 servicio.
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.webp'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function Navbar() {
  const { profile, isAdmin, user } = useAuth()
  const navigate = useNavigate()
  const [serviciosCount, setServiciosCount] = useState(0)

  useEffect(() => {
    // Solo los empleados necesitan saber cuántos servicios tienen
    // para decidir si mostrar el enlace al dashboard.
    // La RLS filtra automáticamente por employee_id = auth.uid().
    if (isAdmin || !user) return

    supabase
      .from('service_employees')
      .select('*', { count: 'exact', head: true })
      .then(({ count }) => setServiciosCount(count ?? 0))
  }, [isAdmin, user])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="bg-accent border-b border-accent-dark px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="flex items-center gap-3">
          <img src={logo} alt="Vértice" className="h-8 object-contain" />
          {isAdmin && (
            <span className="px-2 py-0.5 rounded-full bg-white/40 text-gray-700 text-xs font-medium">Admin</span>
          )}
        </Link>

        {isAdmin ? (
          <div className="flex items-center gap-5">
            <Link to="/admin/users" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
              Usuarios
            </Link>
            <Link to="/admin/services" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
              Servicios
            </Link>
          </div>
        ) : serviciosCount > 1 ? (
          <Link to="/dashboard" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
            Mis servicios
          </Link>
        ) : null}
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700">{profile?.nombre ?? ''}</span>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  )
}
