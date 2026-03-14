// Dashboard del empleado — muestra sus servicios asignados como tarjetas clicables.
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.webp'

const SERVICIOS = [
  {
    id: '1',
    nombre: 'Podología',
    descripcion: 'Tratamientos del pie: quiropodia, plantillas, uñas encarnadas y más.',
    registros: 142,
  },
  {
    id: '2',
    nombre: 'Fisioterapia',
    descripcion: 'Rehabilitación, masajes terapéuticos y tratamiento del dolor.',
    registros: 98,
  },
  {
    id: '3',
    nombre: 'Estética',
    descripcion: 'Tratamientos faciales, corporales y cuidado de la piel.',
    registros: 76,
  },
]

export default function DashboardPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 pb-16">

      {/* Header */}
      <header className="bg-accent border-b border-accent-dark px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Vértice" className="h-8 object-contain" />
          <span className="font-semibold text-gray-900">Vértice</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Ana García López</span>
          <button className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-900">Bienvenida, Ana</h1>
          <p className="text-sm text-gray-500 mt-1">Selecciona un servicio para ver sus registros</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICIOS.map(servicio => (
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
                {servicio.registros} registros
              </div>
            </button>
          ))}
        </div>
      </main>

    </div>
  )
}
