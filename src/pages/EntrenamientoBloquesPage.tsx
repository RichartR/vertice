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

type Empleado = { id: string; nombre: string }

export default function EntrenamientoBloquesPage() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const { blocks, loading, createBlock, updateBlock } = useTrainingBlocks()

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [empleadoId, setEmpleadoId] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errModal, setErrModal] = useState('')
  const [empleados, setEmpleados] = useState<Empleado[]>([])

  useEffect(() => {
    if (!isAdmin) return
    supabase
      .from('profiles')
      .select('id, nombre')
      .eq('activo', true)
      .neq('rol', 'admin')
      .order('nombre')
      .then(({ data }) => setEmpleados(data ?? []))
  }, [isAdmin])

  function abrirModal() {
    setEditandoId(null)
    setNombre('')
    setEmpleadoId('')
    setErrModal('')
    setModalAbierto(true)
  }

  function abrirEditar(block: { id: string; name: string; employee_id: string }) {
    setEditandoId(block.id)
    setNombre(block.name)
    setEmpleadoId(block.employee_id ?? '')
    setErrModal('')
    setModalAbierto(true)
  }

  async function guardar() {
    if (!nombre.trim()) { setErrModal('El nombre del bloque es obligatorio'); return }
    setGuardando(true)
    try {
      if (editandoId) {
        await updateBlock(editandoId, nombre.trim(), empleadoId || null)
      } else {
        await createBlock(nombre.trim(), empleadoId || null)
      }
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
          <div
            key={block.id}
            className="flex items-stretch bg-white rounded-2xl border border-gray-200 hover:border-accent hover:shadow-sm transition-all group"
          >
            <button
              onClick={() => navigate(`/entrenamientos/bloques/${block.id}/clientes`)}
              className="flex-1 flex flex-col gap-3 p-5 text-left"
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
            {isAdmin && (
              <button
                onClick={() => abrirEditar(block)}
                className="shrink-0 px-3 border-l border-gray-100 text-gray-300 hover:text-gray-600 hover:bg-gray-50 transition-colors rounded-r-2xl"
                title="Editar bloque"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Bloques de Entrenamiento</h1>
          {isAdmin && (
            <button
              onClick={abrirModal}
              className="px-4 py-2 bg-accent-dark hover:bg-accent text-gray-800 text-sm font-medium rounded-lg transition-colors"
            >
              + Nuevo bloque
            </button>
          )}
        </div>
        {renderContenido()}
      </main>

      {isAdmin && modalAbierto && (
        <Modal
          title={editandoId ? 'Editar bloque' : 'Nuevo bloque'}
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
              options={empleados.map(e => ({ value: e.id, label: e.nombre }))}
              placeholder="Seleccionar empleado..."
            />
          </FormField>

          {errModal && <p className="text-xs text-red-500">{errModal}</p>}
        </Modal>
      )}
    </div>
  )
}
