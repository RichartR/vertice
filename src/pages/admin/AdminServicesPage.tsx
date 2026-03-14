// Panel de gestión de servicios (admin) — tabla + modal de creación/edición.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Tooltip from '../../components/ui/Tooltip'
import SearchInput from '../../components/ui/SearchInput'
import Modal from '../../components/ui/Modal'
import FormField from '../../components/ui/FormField'
import CheckboxGroup from '../../components/ui/CheckboxGroup'
import SubPageHeader from '../../components/ui/SubPageHeader'
import { normalizar } from '../../utils/normalizar'

type Servicio = { id: string; nombre: string; descripcion: string; empleados: string[]; registros: number; activo: boolean }

const SERVICIOS: Servicio[] = []
const EMPLEADOS_ACTIVOS: string[] = []

export default function AdminServicesPage() {
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')
  const [servicioEdicion, setServicioEdicion] = useState<Servicio | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [asignados, setAsignados] = useState<string[]>([])

  const serviciosFiltrados = SERVICIOS.filter(s =>
    normalizar(s.nombre).includes(normalizar(busqueda))
  )

  function abrirNuevo() {
    setServicioEdicion(null)
    setNombre(''); setDescripcion(''); setAsignados([])
    setModalOpen(true)
  }

  function abrirEditar(s: Servicio) {
    setServicioEdicion(s)
    setNombre(s.nombre)
    setDescripcion(s.descripcion)
    setAsignados([...s.empleados])
    setModalOpen(true)
  }

  function toggleEmpleado(emp: string) {
    setAsignados(prev => prev.includes(emp) ? prev.filter(e => e !== emp) : [...prev, emp])
  }

  const esEdicion = servicioEdicion !== null

  return (
    <div className="min-h-screen bg-gray-50 pb-16">

      <SubPageHeader
        backLabel="← Dashboard"
        onBack={() => navigate('/admin/dashboard')}
        title="Gestión de servicios"
        rightSlot={
          <button onClick={abrirNuevo} className="px-4 py-2 bg-white hover:bg-white/80 text-gray-800 text-sm font-medium rounded-lg transition-colors">
            + Nuevo servicio
          </button>
        }
      />

      <main className="max-w-5xl mx-auto px-6 py-8">

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">{serviciosFiltrados.length} servicios activos</p>
            <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar servicio..." />
          </div>
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[28%]" />
              <col className="w-[20%]" />
              <col className="w-[12%]" />
              <col className="w-[22%]" />
            </colgroup>
            <thead className="bg-accent/10 border-b border-accent/20">
              <tr>
                {['Servicio', 'Descripción', 'Empleados', 'Registros', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {serviciosFiltrados.map(s => (
                <tr key={s.id} className="hover:bg-accent/5 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 shrink-0 rounded-xl bg-accent/30 flex items-center justify-center text-sm font-bold text-gray-700">
                        {s.nombre[0]}
                      </div>
                      <span className="font-semibold text-gray-900 truncate">{s.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-500 overflow-hidden">
                    <Tooltip text={s.descripcion}>{s.descripcion}</Tooltip>
                  </td>
                  <td className="px-4 py-4 text-gray-500 overflow-hidden">
                    <Tooltip text={s.empleados.join(', ')}>{s.empleados.join(', ')}</Tooltip>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">{s.registros}</span>
                    <span className="text-gray-400 text-xs ml-1">reg.</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-1.5 whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/services/${s.id}`)}
                        className="px-2 py-1 rounded-md border border-gray-200 text-xs text-gray-600 hover:border-accent hover:bg-accent/10 transition-colors"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => abrirEditar(s)}
                        className="px-2 py-1 rounded-md border border-gray-200 text-xs text-gray-600 hover:border-accent hover:bg-accent/10 transition-colors"
                      >
                        Editar
                      </button>
                      <button className="px-2 py-1 rounded-md border border-red-100 text-xs text-red-500 hover:bg-red-50 transition-colors">Desactivar</button>
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
        <Modal
          title={esEdicion ? 'Editar servicio' : 'Nuevo servicio'}
          confirmLabel={esEdicion ? 'Guardar cambios' : 'Crear servicio'}
          onClose={() => setModalOpen(false)}
        >
          <FormField id="s-nombre" label="Nombre del servicio">
            <input id="s-nombre" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Nutrición deportiva" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          </FormField>

          <FormField id="s-descripcion" label="Descripción" optional>
            <textarea id="s-descripcion" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Breve descripción del servicio..." rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none" />
          </FormField>

          <CheckboxGroup
            label="Empleados asignados"
            options={EMPLEADOS_ACTIVOS}
            selected={asignados}
            onToggle={toggleEmpleado}
            scrollable
          />
        </Modal>
      )}

    </div>
  )
}
