// Página de bloques de entrenamiento.
// Admin: ve todos los bloques, puede crear nuevos.
// Empleado: solo ve los bloques asignados a él (RLS en Supabase).
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useTrainingBlocks } from '../hooks/useTrainingBlocks'
import Modal from '../components/ui/Modal'
import FormField from '../components/ui/FormField'
import Select from '../components/ui/Select'
import SubPageHeader from '../components/ui/SubPageHeader'

type Empleado = { id: string; full_name: string }

export default function EntrenamientoBloquesPage() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const { blocks, loading, createBlock } = useTrainingBlocks()

  const [modalAbierto, setModalAbierto] = useState(false)
  const [nombre, setNombre] = useState('')
  const [empleadoId, setEmpleadoId] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errModal, setErrModal] = useState('')
  const [empleados, setEmpleados] = useState<Empleado[]>([])

  useEffect(() => {
    if (!isAdmin) return
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('is_active', true)
      .eq('is_admin', false)
      .order('full_name')
      .then(({ data }) => setEmpleados(data ?? []))
  }, [isAdmin])

  function abrirModal() {
    setNombre('')
    setEmpleadoId('')
    setErrModal('')
    setModalAbierto(true)
  }

  async function guardar() {
    if (!nombre.trim()) { setErrModal('El nombre del bloque es obligatorio'); return }
    if (!empleadoId) { setErrModal('Selecciona un empleado'); return }
    setGuardando(true)
    try {
      await createBlock(nombre.trim(), empleadoId)
      setModalAbierto(false)
    } catch (e: any) {
      setErrModal(e.message ?? 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  function renderContenido() {
    if (loading) {
      return (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )
    }
    if (blocks.length === 0) {
      return (
        <div className="text-center py-16 text-gray-400 text-sm">
          No hay bloques de entrenamiento creados aún
        </div>
      )
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {blocks.map(block => (
          <button
            key={block.id}
            onClick={() => navigate(`/entrenamientos/bloques/${block.id}/clientes`)}
            className="flex flex-col gap-3 p-5 bg-white rounded-2xl border border-gray-200 hover:border-accent hover:shadow-sm transition-all text-left group"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-gray-900 group-hover:text-gray-700 leading-snug">
                {block.name}
              </p>
              <span className="text-gray-300 group-hover:text-accent transition-colors shrink-0">→</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>{block.employee_name}</span>
              <span className="font-medium text-gray-600">{block.client_count} clientes</span>
            </div>
          </button>
        ))}
      </div>
    )
  }

  const nuevoBoton = isAdmin ? (
    <button
      onClick={abrirModal}
      className="px-4 py-2 bg-accent-dark hover:bg-accent text-gray-800 text-sm font-medium rounded-lg transition-colors"
    >
      + Nuevo bloque
    </button>
  ) : undefined

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <SubPageHeader
        backLabel="← Entrenamientos"
        onBack={() => navigate('/entrenamientos')}
        title="Bloques de Entrenamiento"
        rightSlot={nuevoBoton}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {renderContenido()}
      </main>

      {isAdmin && modalAbierto && (
        <Modal
          title="Nuevo bloque"
          confirmLabel={guardando ? 'Guardando…' : 'Guardar'}
          confirmDisabled={guardando}
          onClose={() => setModalAbierto(false)}
          onConfirm={guardar}
        >
          <FormField id="tb-nombre" label="Nombre del bloque">
            <input
              id="tb-nombre"
              type="text"
              value={nombre}
              onChange={e => { setNombre(e.target.value); setErrModal('') }}
              placeholder="Ej: Grupo lunes/miércoles"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </FormField>

          <FormField id="tb-empleado" label="Empleado asignado">
            <Select
              value={empleadoId}
              onChange={v => { setEmpleadoId(v); setErrModal('') }}
              options={empleados.map(e => ({ value: e.id, label: e.full_name }))}
              placeholder="Seleccionar empleado..."
            />
          </FormField>

          {errModal && <p className="text-xs text-red-500">{errModal}</p>}
        </Modal>
      )}
    </div>
  )
}
