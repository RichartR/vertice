// Barra de navegación superior — presente en todas las páginas protegidas.
// Admin: logo + "Gestión Servicios" → /dashboard. Empleado: logo (si >1 servicio) + nombre + cerrar sesión.
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

  const navLinkCls = 'px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-white/50 hover:text-gray-900 transition-colors'

  return (
    <nav className="bg-accent border-b border-accent-dark px-4 sm:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-1 md:gap-2">
        {/* Logo — enlace al dashboard */}
        <Link to="/dashboard" className="flex items-center gap-3 pr-4 mr-2 border-r border-accent-dark/40">
          <img src={logo} alt="Vértice" className="h-8 object-contain" />
          {isAdmin && (
            <span className="px-2 py-0.5 rounded-full bg-white/30 text-gray-600 text-xs font-medium tracking-wide">
              Admin
            </span>
          )}
        </Link>

        {/* Links de navegación — ocultos en móvil */}
        {isAdmin && (
          <Link to="/dashboard" className={`hidden md:block ${navLinkCls}`}>Gestión Servicios</Link>
        )}
        {!isAdmin && serviciosCount > 1 && (
          <Link to="/dashboard" className={`hidden md:block ${navLinkCls}`}>Mis servicios</Link>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden sm:inline text-sm text-gray-700 font-medium">{profile?.nombre ?? ''}</span>
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-white/50 hover:text-gray-900 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  )
}
