// Clientes de un bloque de entrenamiento.
// Búsqueda local insensible a mayúsculas y acentos + paginación de 10 por página.
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTrainingClients } from '../hooks/useTrainingClients'
import Modal from '../components/ui/Modal'
import FormField from '../components/ui/FormField'
import SearchInput from '../components/ui/SearchInput'

const PAGE_SIZE = 10

function normalizar(s: string) {
  return s.normalize('NFD').replaceAll(/[\u0300-\u036f]/g, '').toLowerCase()
}

export default function EntrenamientoClientesPage() {
  const { blockId } = useParams<{ blockId: string }>()
  const navigate = useNavigate()
  const { clients, loading, createClient, updateClient } = useTrainingClients(blockId ?? '')

  const [blockName, setBlockName] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errModal, setErrModal] = useState('')

  useEffect(() => {
    supabase
      .from('training_blocks')
      .select('name')
      .eq('id', blockId)
      .single()
      .then(({ data }) => setBlockName(data?.name ?? ''))
  }, [blockId])

  const filtrados = clients.filter(c =>
    normalizar(c.full_name).includes(normalizar(busqueda))
  )
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const paginaActual = Math.min(pagina, totalPaginas)
  const visibles = filtrados.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE)

  function abrirModal() {
    setEditandoId(null)
    setNombreNuevo('')
    setErrModal('')
    setModalAbierto(true)
  }

  function abrirEditar(client: { id: string; full_name: string }) {
    setEditandoId(client.id)
    setNombreNuevo(client.full_name)
    setErrModal('')
    setModalAbierto(true)
  }

  async function guardar() {
    if (!nombreNuevo.trim()) { setErrModal('El nombre es obligatorio'); return }
    setGuardando(true)
    try {
      if (editandoId) {
        await updateClient(editandoId, nombreNuevo.trim())
      } else {
        await createClient(nombreNuevo.trim())
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
    if (clients.length === 0) {
      return (
        <div className="text-center py-16 text-gray-400 text-sm">
          No hay clientes en este bloque aún
        </div>
      )
    }
    if (filtrados.length === 0) {
      return (
        <div className="text-center py-16 text-gray-400 text-sm">
          No se encontraron clientes para "{busqueda}"
        </div>
      )
    }
    return (
      <>
        <div className="divide-y divide-gray-100 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {visibles.map(client => (
            <div key={client.id} className="flex items-center group hover:bg-accent/5 transition-colors">
              <button
                onClick={() => navigate(`/entrenamientos/bloques/${blockId}/clientes/${client.id}/mesociclos`)}
                className="flex-1 flex items-center justify-between px-5 py-4 text-left"
              >
                <span className="font-medium text-gray-900 group-hover:text-gray-700">
                  {client.full_name}
                </span>
                <span className="text-xs font-medium text-accent-dark bg-accent/20 px-2.5 py-1 rounded-full shrink-0">
                  {client.mesocycle_count} mesociclos
                </span>
              </button>
              <button
                onClick={() => abrirEditar(client)}
                className="shrink-0 px-4 py-4 text-gray-300 hover:text-gray-600 transition-colors"
                title="Editar cliente"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {totalPaginas > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
            <button
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-accent/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Anterior
            </button>
            <span>{paginaActual} / {totalPaginas}</span>
            <button
              onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual === totalPaginas}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-accent/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente →
            </button>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <button
              onClick={() => navigate('/entrenamientos/bloques')}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-1 block"
            >
              ← Bloques
            </button>
            <h1 className="text-xl font-semibold text-gray-900">{blockName || '…'}</h1>
          </div>
          <button
            onClick={abrirModal}
            className="px-4 py-2 bg-accent-dark hover:bg-accent text-gray-800 text-sm font-medium rounded-lg transition-colors shrink-0"
          >
            + Nuevo cliente
          </button>
        </div>
        <div className="mb-4">
          <SearchInput
            value={busqueda}
            onChange={v => { setBusqueda(v); setPagina(1) }}
            placeholder="Buscar cliente..."
          />
        </div>
        {renderContenido()}
      </main>

      {modalAbierto && (
        <Modal
          title={editandoId ? 'Editar cliente' : 'Nuevo cliente'}
          confirmLabel={guardando ? 'Guardando…' : 'Guardar'}
          confirmDisabled={guardando}
          onClose={() => setModalAbierto(false)}
          onConfirm={guardar}
        >
          <FormField id="tc-nombre" label="Nombre completo">
            <input
              id="tc-nombre"
              type="text"
              value={nombreNuevo}
              onChange={e => { setNombreNuevo(e.target.value); setErrModal('') }}
              placeholder="Ej: María García López"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </FormField>
          {errModal && <p className="text-xs text-red-500">{errModal}</p>}
        </Modal>
      )}
    </div>
  )
}
