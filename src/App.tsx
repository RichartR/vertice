import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/layout/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import AccesoDenegadoPage from './pages/AccesoDenegadoPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import DashboardAdminPage from './pages/admin/DashboardAdminPage'
import ServicePage from './pages/ServicePage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminServicesPage from './pages/admin/AdminServicesPage'
import AdminIncidenciasPage from './pages/admin/AdminIncidenciasPage'
import EntrenamientosPage from './pages/EntrenamientosPage'
import EntrenamientoBloquesPage from './pages/EntrenamientoBloquesPage'
import EntrenamientoClientesPage from './pages/EntrenamientoClientesPage'
import EntrenamientoMesociclosPage from './pages/EntrenamientoMesociclosPage'
import EntrenamientoDiasPage from './pages/EntrenamientoDiasPage'
import EntrenamientoDiaPage from './pages/EntrenamientoDiaPage'
import IniciarEntrenamientoPage from './pages/IniciarEntrenamientoPage'
import { useAuth } from './context/AuthContext'
import IosBanner from './components/ui/IosBanner'

// Renderiza el dashboard correcto según el rol del usuario.
function DashboardRouter() {
  const { isAdmin } = useAuth()
  return isAdmin ? <DashboardAdminPage /> : <DashboardPage />
}

export default function App() {
  return (
    <>
    <IosBanner />
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/acceso-denegado" element={<AccesoDenegadoPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />

      {/* Rutas protegidas — empleado y admin */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardRouter />
        </ProtectedRoute>
      } />

      <Route path="/services/:id" element={
        <ProtectedRoute>
          <ServicePage />
        </ProtectedRoute>
      } />

      {/* Rutas protegidas — solo admin */}
      <Route path="/admin/users" element={
        <ProtectedRoute requireAdmin>
          <AdminUsersPage />
        </ProtectedRoute>
      } />

      <Route path="/admin/services" element={
        <ProtectedRoute requireAdmin>
          <AdminServicesPage />
        </ProtectedRoute>
      } />

      <Route path="/admin/services/:id" element={
        <ProtectedRoute requireAdmin>
          <ServicePage />
        </ProtectedRoute>
      } />

      <Route path="/admin/incidencias" element={
        <ProtectedRoute requireAdmin>
          <AdminIncidenciasPage />
        </ProtectedRoute>
      } />

      {/* Rutas protegidas — admin y empleado */}
      <Route path="/entrenamientos" element={
        <ProtectedRoute>
          <EntrenamientosPage />
        </ProtectedRoute>
      } />

      <Route path="/entrenamientos/iniciar" element={
        <ProtectedRoute>
          <IniciarEntrenamientoPage />
        </ProtectedRoute>
      } />

      <Route path="/entrenamientos/bloques" element={
        <ProtectedRoute>
          <EntrenamientoBloquesPage />
        </ProtectedRoute>
      } />

      <Route path="/entrenamientos/bloques/:blockId/clientes" element={
        <ProtectedRoute>
          <EntrenamientoClientesPage />
        </ProtectedRoute>
      } />

      <Route path="/entrenamientos/bloques/:blockId/clientes/:clientId/mesociclos" element={
        <ProtectedRoute>
          <EntrenamientoMesociclosPage />
        </ProtectedRoute>
      } />

      <Route path="/entrenamientos/bloques/:blockId/clientes/:clientId/mesociclos/:mesocycleId/dias" element={
        <ProtectedRoute>
          <EntrenamientoDiasPage />
        </ProtectedRoute>
      } />

      <Route path="/entrenamientos/bloques/:blockId/clientes/:clientId/mesociclos/:mesocycleId/dias/:dayId" element={
        <ProtectedRoute>
          <EntrenamientoDiaPage />
        </ProtectedRoute>
      } />

      {/* Fallback — redirigir al dashboard (el ProtectedRoute se encarga si no hay sesión) */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </>
  )
}
