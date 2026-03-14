// Barra de navegación SOLO para el prototipo — no irá en producción.
// Permite al cliente saltar entre pantallas durante la revisión.
import { NavLink } from 'react-router-dom'

const screens = [
  { to: '/login',            label: 'Login' },
  { to: '/dashboard',        label: 'Dashboard Empleado' },
  { to: '/services/1',       label: 'Vista Servicio' },
  { to: '/admin/dashboard',  label: 'Dashboard Admin' },
  { to: '/admin/users',      label: 'Gestión Usuarios' },
  { to: '/admin/services',   label: 'Gestión Servicios' },
]

export default function PrototypeNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 px-4 py-2 flex items-center gap-1 overflow-x-auto">
      <span className="text-gray-500 text-xs font-semibold uppercase tracking-widest mr-3 shrink-0">
        Prototipo
      </span>
      {screens.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `shrink-0 px-3 py-1 rounded text-xs font-medium transition-colors ${
              isActive
                ? 'bg-accent text-gray-900'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </div>
  )
}
