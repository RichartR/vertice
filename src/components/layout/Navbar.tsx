// Barra de navegación superior — presente en todas las páginas protegidas.
// Desktop: logo + links de navegación + nombre + cerrar sesión.
// Móvil: logo + botón hamburger que despliega menú con links y cerrar sesión.
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.webp'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function Navbar() {
  const { profile, isAdmin, user } = useAuth()
  const navigate = useNavigate()
  const [serviciosCount, setServiciosCount] = useState(0)
  const [menuAbierto, setMenuAbierto] = useState(false)

  useEffect(() => {
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

  function cerrarMenu() { setMenuAbierto(false) }

  const navLinkCls = 'px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-white/50 hover:text-gray-900 transition-colors'
  const menuLinkCls = 'block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-accent-dark/20 transition-colors'

  const tieneLinks = isAdmin || (!isAdmin && serviciosCount > 1)

  return (
    <nav className="bg-accent border-b border-accent-dark px-4 sm:px-6 py-3 flex items-center justify-between relative">
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

        {/* Links de navegación — visibles en md+ */}
        {isAdmin && (
          <Link to="/dashboard" className={`hidden md:block ${navLinkCls}`}>Gestión Servicios</Link>
        )}
        {!isAdmin && serviciosCount > 1 && (
          <Link to="/dashboard" className={`hidden md:block ${navLinkCls}`}>Mis servicios</Link>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Nombre — visible en sm+ en desktop */}
        <span className="hidden md:inline text-sm text-gray-700 font-medium">{profile?.nombre ?? ''}</span>

        {/* Cerrar sesión — visible en md+ */}
        <button
          onClick={handleLogout}
          className="hidden md:block px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-white/50 hover:text-gray-900 transition-colors"
        >
          Cerrar sesión
        </button>

        {/* Botón hamburger — visible solo en móvil */}
        <button
          onClick={() => setMenuAbierto(v => !v)}
          aria-label="Menú"
          className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-white/30 transition-colors"
        >
          <span className={`block w-5 h-0.5 bg-gray-700 transition-transform duration-200 ${menuAbierto ? 'translate-y-2 rotate-45' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-700 transition-opacity duration-200 ${menuAbierto ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-700 transition-transform duration-200 ${menuAbierto ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>
      </div>

      {/* Menú desplegable móvil */}
      {menuAbierto && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-accent border-b border-accent-dark shadow-md z-50">
          {/* Links de navegación */}
          {isAdmin && (
            <Link to="/dashboard" onClick={cerrarMenu} className={menuLinkCls}>
              Gestión Servicios
            </Link>
          )}
          {!isAdmin && serviciosCount > 1 && (
            <Link to="/dashboard" onClick={cerrarMenu} className={menuLinkCls}>
              Mis servicios
            </Link>
          )}

          {/* Separador solo si hay links */}
          {tieneLinks && <div className="border-t border-accent-dark/30" />}

          {/* Cerrar sesión */}
          <button
            onClick={() => { cerrarMenu(); handleLogout() }}
            className="w-full text-left px-4 py-3 text-sm text-gray-600 hover:bg-accent-dark/20 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </nav>
  )
}
