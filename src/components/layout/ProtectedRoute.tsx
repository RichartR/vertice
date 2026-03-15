import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Navbar from './Navbar'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

// Equivalente a un AuthGuard en Angular.
// Protege rutas comprobando sesión, estado activo y rol.
export default function ProtectedRoute({ children, requireAdmin = false }: Readonly<ProtectedRouteProps>) {
  const { user, loading, isAdmin, isActive } = useAuth()

  // Esperar a que AuthContext cargue la sesión y el perfil antes de decidir.
  // Sin este guard, puede haber redirecciones prematuras a /login en el primer render.
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Sin sesión → login
  if (!user) return <Navigate to="/login" replace />

  // Empleado desactivado → acceso denegado
  if (!isActive) return <Navigate to="/acceso-denegado" replace />

  // Ruta solo para admin y el usuario no lo es → dashboard
  if (requireAdmin && !isAdmin) return <Navigate to="/dashboard" replace />

  return (
    <>
      <Navbar />
      {children}
    </>
  )
}
