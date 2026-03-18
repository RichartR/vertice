// Días de un mesociclo. Máximo 5 días ordenados por order_index.
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTrainingDays } from '../hooks/useTrainingDays'
import Modal from '../components/ui/Modal'
import FormField from '../components/ui/FormField'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function formatFecha(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

export default function EntrenamientoDiasPage() {
  const { blockId, clientId, mesocycleId } = useParams<{
    blockId: string
    clientId: string
    mesocycleId: string
  }>()
  const navigate = useNavigate()
  const { days, loading, createDay, getDayCount } = useTrainingDays(mesocycleId ?? '')

  const [blockName, setBlockName] = useState('')
  const [clientName, setClientName] = useState('')
  const [mesoName, setMesoName] = useState('')
  const [mesoStart, setMesoStart] = useState('')
  const [mesoEnd, setMesoEnd] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [nombreDia, setNombreDia] = useState('')
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

    supabase
      .from('training_mesocycles')
      .select('name, start_date, end_date')
      .eq('id', mesocycleId)
      .single()
      .then(({ data }) => {
        setMesoName(data?.name ?? '')
        setMesoStart(data?.start_date ?? '')
        setMesoEnd(data?.end_date ?? '')
      })
  }, [blockId, clientId, mesocycleId])

  async function abrirModal() {
    setNombreDia('')
    setErrModal('')
    setModalAbierto(true)
  }

  async function guardar() {
    if (!nombreDia.trim()) { setErrModal('El nombre del día es obligatorio'); return }
    setGuardando(true)
    try {
      const count = await getDayCount()
      if (count >= 5) { setErrModal('Máximo 5 días por mesociclo'); return }
      await createDay(nombreDia.trim(), count + 1)
      setModalAbierto(false)
    } catch (e: any) {
      setErrModal(e.message ?? 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const maxDaysReached = days.length >= 5
  const baseRoute = `/entrenamientos/bloques/${blockId}/clientes/${clientId}/mesociclos/${mesocycleId}`

  function renderContenido() {
    if (loading) {
      return (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )
    }
    if (days.length === 0) {
      return (
        <div className="text-center py-16 text-gray-400 text-sm">
          No hay días creados aún
        </div>
      )
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {days.map(day => (
          <button
            key={day.id}
            onClick={() => navigate(`${baseRoute}/dias/${day.id}`)}
            className="flex items-center justify-between gap-3 p-5 bg-white rounded-2xl border border-gray-200 hover:border-accent hover:shadow-sm transition-all text-left group"
          >
            <p className="font-semibold text-gray-900 group-hover:text-gray-700">{day.name}</p>
            <span className="text-gray-300 group-hover:text-accent transition-colors shrink-0">→</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <button
              onClick={() => navigate(`/entrenamientos/bloques/${blockId}/clientes/${clientId}/mesociclos`)}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-1 block"
            >
              ← {clientName || '…'}
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              {clientName || '…'} — {mesoName || '…'}
            </h1>
            {mesoStart && mesoEnd && (
              <p className="text-sm text-gray-400 mt-0.5">
                {formatFecha(mesoStart)} — {formatFecha(mesoEnd)}
              </p>
            )}
          </div>
          <div className="relative group shrink-0">
            <button
              onClick={abrirModal}
              disabled={maxDaysReached}
              className="px-4 py-2 bg-accent-dark hover:bg-accent text-gray-800 text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              + Nuevo día
            </button>
            {maxDaysReached && (
              <div className="absolute right-0 top-full mt-1.5 px-2.5 py-1.5 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Máximo 5 días por mesociclo
              </div>
            )}
          </div>
        </div>

        {renderContenido()}
      </main>

      {modalAbierto && (
        <Modal
          title="Nuevo día"
          confirmLabel={guardando ? 'Guardando…' : 'Guardar'}
          confirmDisabled={guardando}
          onClose={() => setModalAbierto(false)}
          onConfirm={guardar}
        >
          <FormField id="td-nombre" label="Nombre del día">
            <input
              id="td-nombre"
              type="text"
              value={nombreDia}
              onChange={e => { setNombreDia(e.target.value); setErrModal('') }}
              placeholder="Ej: Día A, Upper, Legs"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              autoFocus
            />
          </FormField>
          {errModal && <p className="text-xs text-red-500">{errModal}</p>}
        </Modal>
      )}
    </div>
  )
}
