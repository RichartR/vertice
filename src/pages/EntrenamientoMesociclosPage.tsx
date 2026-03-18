// Mesociclos de un cliente dentro de un bloque de entrenamiento.
// Ordenados por número DESC: el primero es el ACTIVO, el resto HISTORIAL.
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTrainingMesocycles } from '../hooks/useTrainingMesocycles'
import Modal from '../components/ui/Modal'
import FormField from '../components/ui/FormField'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function formatFecha(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

export default function EntrenamientoMesociclosPage() {
  const { blockId, clientId } = useParams<{ blockId: string; clientId: string }>()
  const navigate = useNavigate()
  const { mesocycles, loading, createMesocycle, getNextNumber } = useTrainingMesocycles(clientId ?? '', blockId ?? '')

  const [blockName, setBlockName] = useState('')
  const [clientName, setClientName] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [nombreMeso, setNombreMeso] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errModal, setErrModal] = useState('')

  useEffect(() => {
    supabase
      .from('training_blocks')
      .select('name')
      .eq('id', blockId)
      .single()
      .then(({ data }) => setBlockName(data?.name ?? ''))

    supabase
      .from('training_clients')
      .select('full_name')
      .eq('id', clientId)
      .single()
      .then(({ data }) => setClientName(data?.full_name ?? ''))
  }, [blockId, clientId])

  async function abrirModal() {
    const nextNum = await getNextNumber()
    setNombreMeso(`Mesociclo ${nextNum}`)
    setFechaInicio('')
    setFechaFin('')
    setErrModal('')
    setModalAbierto(true)
  }

  async function guardar() {
    if (!fechaInicio) { setErrModal('La fecha de inicio es obligatoria'); return }
    if (!fechaFin) { setErrModal('La fecha de fin es obligatoria'); return }
    if (fechaFin <= fechaInicio) { setErrModal('La fecha de fin debe ser posterior al inicio'); return }
    setGuardando(true)
    try {
      await createMesocycle(nombreMeso.trim() || 'Mesociclo', fechaInicio, fechaFin)
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
    if (mesocycles.length === 0) {
      return (
        <div className="text-center py-16 text-gray-400 text-sm">
          No hay mesociclos creados aún
        </div>
      )
    }
    return (
      <div className="flex flex-col gap-3">
        {mesocycles.map((meso, idx) => {
          const esActivo = idx === 0
          return (
            <button
              key={meso.id}
              onClick={() => navigate(`/entrenamientos/bloques/${blockId}/clientes/${clientId}/mesociclos/${meso.id}/dias`)}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 bg-white rounded-2xl border border-gray-200 hover:border-accent hover:shadow-sm transition-all text-left group"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 group-hover:text-gray-700">{meso.name}</p>
                  {esActivo
                    ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">ACTIVO</span>
                    : <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">HISTORIAL</span>
                  }
                </div>
                <p className="text-sm text-gray-500">
                  {formatFecha(meso.start_date)} — {formatFecha(meso.end_date)}
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400 shrink-0">
                <span>{meso.day_count} días</span>
                <span className="text-gray-300 group-hover:text-accent transition-colors">→</span>
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <button
              onClick={() => navigate(`/entrenamientos/bloques/${blockId}/clientes`)}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-1 block"
            >
              ← {blockName || 'Clientes'}
            </button>
            <h1 className="text-xl font-semibold text-gray-900">{clientName || '…'}</h1>
          </div>
          <button
            onClick={abrirModal}
            className="px-4 py-2 bg-accent-dark hover:bg-accent text-gray-800 text-sm font-medium rounded-lg transition-colors shrink-0"
          >
            + Nuevo mesociclo
          </button>
        </div>
        {renderContenido()}
      </main>

      {modalAbierto && (
        <Modal
          title="Nuevo mesociclo"
          confirmLabel={guardando ? 'Guardando…' : 'Guardar'}
          confirmDisabled={guardando}
          onClose={() => setModalAbierto(false)}
          onConfirm={guardar}
        >
          <FormField id="tm-nombre" label="Nombre">
            <input
              id="tm-nombre"
              type="text"
              value={nombreMeso}
              onChange={e => { setNombreMeso(e.target.value); setErrModal('') }}
              placeholder="Ej: Mesociclo 1"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </FormField>

          <FormField id="tm-inicio" label="Fecha inicio">
            <input
              id="tm-inicio"
              type="date"
              value={fechaInicio}
              onChange={e => { setFechaInicio(e.target.value); setErrModal('') }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </FormField>

          <FormField id="tm-fin" label="Fecha fin">
            <input
              id="tm-fin"
              type="date"
              value={fechaFin}
              onChange={e => { setFechaFin(e.target.value); setErrModal('') }}
              min={fechaInicio || undefined}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </FormField>

          {errModal && <p className="text-xs text-red-500">{errModal}</p>}
        </Modal>
      )}
    </div>
  )
}
