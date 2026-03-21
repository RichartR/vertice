import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/layout/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import IosBanner from './components/ui/IosBanner'

const LoginPage               = lazy(() => import('./pages/LoginPage'))
const AccesoDenegadoPage      = lazy(() => import('./pages/AccesoDenegadoPage'))
const ResetPasswordPage       = lazy(() => import('./pages/ResetPasswordPage'))
const DashboardPage           = lazy(() => import('./pages/DashboardPage'))
const DashboardAdminPage      = lazy(() => import('./pages/admin/DashboardAdminPage'))
const ServicePage             = lazy(() => import('./pages/ServicePage'))
const AdminUsersPage          = lazy(() => import('./pages/admin/AdminUsersPage'))
const AdminServicesPage       = lazy(() => import('./pages/admin/AdminServicesPage'))
const AdminIncidenciasPage    = lazy(() => import('./pages/admin/AdminIncidenciasPage'))
const EntrenamientosPage      = lazy(() => import('./pages/EntrenamientosPage'))
const EntrenamientoBloquesPage    = lazy(() => import('./pages/EntrenamientoBloquesPage'))
const EntrenamientoClientesPage   = lazy(() => import('./pages/EntrenamientoClientesPage'))
const EntrenamientoMesociclosPage = lazy(() => import('./pages/EntrenamientoMesociclosPage'))
const EntrenamientoDiasPage   = lazy(() => import('./pages/EntrenamientoDiasPage'))
const EntrenamientoDiaPage    = lazy(() => import('./pages/EntrenamientoDiaPage'))
const IniciarEntrenamientoPage = lazy(() => import('./pages/IniciarEntrenamientoPage'))
const SesionTVPage             = lazy(() => import('./pages/SesionTVPage'))

// Renderiza el dashboard correcto según el rol del usuario.
function DashboardRouter() {
  const { isAdmin } = useAuth()
  return isAdmin ? <DashboardAdminPage /> : <DashboardPage />
}

export default function App() {
  return (
    <>
      <IosBanner />
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/acceso-denegado" element={<AccesoDenegadoPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />
        <Route path="/sesion-tv"       element={<SesionTVPage />} />

        {/* Rutas protegidas — empleado y admin. Navbar se monta una sola vez. */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard"          element={<DashboardRouter />} />
          <Route path="/services/:id"       element={<ServicePage />} />
          <Route path="/entrenamientos"     element={<EntrenamientosPage />} />
          <Route path="/entrenamientos/iniciar" element={<IniciarEntrenamientoPage />} />
          <Route path="/entrenamientos/bloques" element={<EntrenamientoBloquesPage />} />
          <Route path="/entrenamientos/bloques/:blockId/clientes" element={<EntrenamientoClientesPage />} />
          <Route path="/entrenamientos/bloques/:blockId/clientes/:clientId/mesociclos" element={<EntrenamientoMesociclosPage />} />
          <Route path="/entrenamientos/bloques/:blockId/clientes/:clientId/mesociclos/:mesocycleId/dias" element={<EntrenamientoDiasPage />} />
          <Route path="/entrenamientos/bloques/:blockId/clientes/:clientId/mesociclos/:mesocycleId/dias/:dayId" element={<EntrenamientoDiaPage />} />
        </Route>

        {/* Rutas protegidas — solo admin. Navbar se monta una sola vez. */}
        <Route element={<ProtectedRoute requireAdmin />}>
          <Route path="/admin/users"        element={<AdminUsersPage />} />
          <Route path="/admin/services"     element={<AdminServicesPage />} />
          <Route path="/admin/services/:id" element={<ServicePage />} />
          <Route path="/admin/incidencias"  element={<AdminIncidenciasPage />} />
        </Route>

        {/* Fallback — redirigir al dashboard (ProtectedRoute gestiona si no hay sesión) */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      </Suspense>
    </>
  )
}
