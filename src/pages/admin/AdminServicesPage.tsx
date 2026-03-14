// Panel de gestión de servicios (admin) — tabla + modal de creación/edición.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SERVICIOS = [
  { id: '1', nombre: 'Podología',    descripcion: 'Tratamientos del pie: quiropodia, plantillas, uñas encarnadas.', empleados: ['Ana García López', 'Carlos Martínez Ruiz'], registros: 142, activo: true },
  { id: '2', nombre: 'Fisioterapia', descripcion: 'Rehabilitación, masajes terapéuticos y tratamiento del dolor.',   empleados: ['Ana García López', 'Carlos Martínez Ruiz', 'Laura Sánchez Pérez'], registros: 98,  activo: true },
  { id: '3', nombre: 'Estética',     descripcion: 'Tratamientos faciales, corporales y cuidado de la piel.',         empleados: ['Laura Sánchez Pérez'],  registros: 76,  activo: true },
]

const EMPLEADOS_ACTIVOS = ['Ana García López', 'Carlos Martínez Ruiz', 'Laura Sánchez Pérez', 'Ricardo Torres Vidal']

export default function AdminServicesPage() {
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [asignados, setAsignados] = useState<string[]>([])

  function toggleEmpleado(emp: string) {
    setAsignados(prev => prev.includes(emp) ? prev.filter(e => e !== emp) : [...prev, emp])
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">

      {/* Header */}
      <header className="bg-accent border-b border-accent-dark px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
          >
            ← Dashboard
          </button>
          <h1 className="font-semibold text-gray-900">Gestión de servicios</h1>
        </div>
        <button
          onClick={() => { setModalOpen(true); setNombre(''); setDescripcion(''); setAsignados([]) }}
          className="px-4 py-2 bg-accent hover:bg-accent-dark text-gray-900 text-sm font-medium rounded-lg transition-colors"
        >
          + Nuevo servicio
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm text-gray-500">{SERVICIOS.length} servicios activos</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-accent/10 border-b border-accent/20">
              <tr>
                {['Servicio', 'Descripción', 'Empleados', 'Registros', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {SERVICIOS.map(s => (
                <tr key={s.id} className="hover:bg-accent/5 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-accent/30 flex items-center justify-center text-sm font-bold text-gray-700">
                        {s.nombre[0]}
                      </div>
                      <span className="font-semibold text-gray-900">{s.nombre}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-500 max-w-xs truncate">{s.descripcion}</td>
                  <td className="px-5 py-4 text-gray-500">{s.empleados.join(', ')}</td>
                  <td className="px-5 py-4">
                    <span className="font-medium text-gray-900">{s.registros}</span>
                    <span className="text-gray-400 text-xs ml-1">registros</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => navigate(`/services/${s.id}`)}
                        className="text-gray-400 hover:text-gray-600 text-xs font-medium"
                      >
                        Ver registros
                      </button>
                      <button className="text-gray-400 hover:text-gray-600 text-xs font-medium">Editar</button>
                      <button className="text-gray-400 hover:text-red-500 text-xs font-medium">Desactivar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Nota sobre eliminación lógica */}
        <p className="text-xs text-gray-400 mt-4 px-1">
          Los servicios desactivados no se eliminan — sus registros históricos se conservan siempre.
        </p>
      </main>

      {/* Modal creación/edición */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Nuevo servicio</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre del servicio</label>
                <input
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Nutrición deportiva"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Descripción <span className="text-gray-400">(opcional)</span></label>
                <textarea
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  placeholder="Breve descripción del servicio..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Empleados asignados</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {EMPLEADOS_ACTIVOS.map(emp => (
                    <label key={emp} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={asignados.includes(emp)}
                        onChange={() => toggleEmpleado(emp)}
                        className="accent-[#b9d9ce] w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">{emp}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-5 border-t border-gray-100">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button className="flex-1 px-4 py-2 rounded-lg bg-accent hover:bg-accent-dark text-gray-900 text-sm font-medium transition-colors">
                Crear servicio
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
