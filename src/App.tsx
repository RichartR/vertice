import { Routes, Route, Navigate } from 'react-router-dom'
import PrototypeNav from './prototype/PrototypeNav'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ServicePage from './pages/ServicePage'
import DashboardAdminPage from './pages/admin/DashboardAdminPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminServicesPage from './pages/admin/AdminServicesPage'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login"            element={<LoginPage />} />
        <Route path="/dashboard"        element={<DashboardPage />} />
        <Route path="/services/:id"     element={<ServicePage />} />
        <Route path="/admin/dashboard"  element={<DashboardAdminPage />} />
        <Route path="/admin/users"      element={<AdminUsersPage />} />
        <Route path="/admin/services"   element={<AdminServicesPage />} />
        <Route path="*"                 element={<Navigate to="/login" replace />} />
      </Routes>

      {/* Barra de navegación del prototipo — solo para revisión con el cliente */}
      <PrototypeNav />
    </>
  )
}
