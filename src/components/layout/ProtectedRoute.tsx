import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Navbar from './Navbar'

interface ProtectedRouteProps {
  requireAdmin?: boolean
}

// Layout route — renderiza Navbar una sola vez y deja que las rutas hijas
// cambien el contenido sin desmontar la barra de navegación.
export default function ProtectedRoute({ requireAdmin = false }: Readonly<ProtectedRouteProps>) {
  const { user, loading, isAdmin, isActive } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (!isActive) return <Navigate to="/acceso-denegado" replace />
  if (requireAdmin && !isAdmin) return <Navigate to="/dashboard" replace />

  return (
    <>
      <Navbar />
      <Outlet />
    </>
  )
}
