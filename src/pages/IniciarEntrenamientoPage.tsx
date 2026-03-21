// Página para iniciar una sesión de entrenamiento.
// Paso 1 (Asistente): seleccionar bloque → seleccionar clientes (máx 4) → seleccionar día por cliente.
// Paso 2 (Sesión): pantalla completa con un panel por cliente en horizontal.
import { useState } from 'react'
import { useTrainingBlocks } from '../hooks/useTrainingBlocks'
import { useTrainingSession } from '../hooks/useTrainingSession'
import PanelCliente from '../components/training/PanelCliente'

type PanelConfig = {
  clientId: string
  clientName: string
  mesocycleId: string
  mesocycleName: string
  dayId: string
  dayName: string
}

type Phase = 'block' | 'setup' | 'session'

export default function IniciarEntrenamientoPage() {
  const { blocks, loading: blocksLoading } = useTrainingBlocks()
  const { clients, loading: clientsLoading, fetchActiveData } = useTrainingSession()

  const [phase, setPhase] = useState<Phase>('block')
  const [_selectedBlockId, setSelectedBlockId] = useState('')
  const [selectedBlockName, setSelectedBlockName] = useState('')

  // IDs de clientes marcados para la sesión (max 4)
  const [checkedClientIds, setCheckedClientIds] = useState<string[]>([])
  // Día seleccionado por cliente (clientId → dayId)
  const [clientDayMap, setClientDayMap] = useState<Record<string, string>>({})

  // Configuración final de paneles (solo en fase 'session')
  const [sessionPanels, setSessionPanels] = useState<PanelConfig[]>([])

  // ── Selección de bloque ──────────────────────────────────────────────────────

  function handleSelectBlock(id: string, name: string) {
    setSelectedBlockId(id)
    setSelectedBlockName(name)
    setCheckedClientIds([])
    setClientDayMap({})
    fetchActiveData(id)
    setPhase('setup')
  }

  // ── Selección de clientes y días ─────────────────────────────────────────────

  function handleToggleClient(clientId: string) {
    if (checkedClientIds.includes(clientId)) {
      setCheckedClientIds(prev => prev.filter(id => id !== clientId))
      setClientDayMap(prev => { const n = { ...prev }; delete n[clientId]; return n })
    } else {
      if (checkedClientIds.length >= 4) return
      setCheckedClientIds(prev => [...prev, clientId])
    }
  }

  function handleSelectDay(clientId: string, dayId: string) {
    setClientDayMap(prev => ({ ...prev, [clientId]: dayId }))
  }

  function canStart(): boolean {
    if (checkedClientIds.length === 0) return false
    return checkedClientIds.every(id => !!clientDayMap[id])
  }

  function handleStart() {
    const panels: PanelConfig[] = checkedClientIds.map(clientId => {
      const client = clients.find(c => c.id === clientId)!
      const latestMeso = client.mesocycles[0]
      const dayId = clientDayMap[clientId]
      const day = latestMeso.days.find(d => d.id === dayId)!
      return {
        clientId,
        clientName: client.full_name,
        mesocycleId: latestMeso.id,
        mesocycleName: latestMeso.name,
        dayId,
        dayName: day.name,
      }
    })
    setSessionPanels(panels)
    setPhase('session')
  }

  // ── Fase sesión — pantalla completa ──────────────────────────────────────────

  if (phase === 'session') {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* Barra superior */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50 shrink-0">
          <div>
            <p className="text-xs text-gray-400">{selectedBlockName}</p>
            <h1 className="text-sm font-semibold text-gray-900">Sesión de entrenamiento</h1>
          </div>
          <button
            onClick={() => setPhase('setup')}
            className="px-3 py-1.5 text-xs text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Terminar sesión
          </button>
        </div>

        {/* Paneles de clientes en horizontal */}
        <div className="flex flex-1 overflow-hidden divide-x divide-gray-200">
          {sessionPanels.map(panel => (
            <div
              key={panel.clientId}
              className="flex-1 min-w-0 overflow-hidden"
              style={{ maxWidth: `${100 / sessionPanels.length}%` }}
            >
              <PanelCliente
                clientName={`${panel.clientName} — ${panel.dayName}`}
                dayId={panel.dayId}
                mesocycleId={panel.mesocycleId}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Fase bloque — selección de bloque ────────────────────────────────────────

  if (phase === 'block') {
    return (
      <div className="min-h-screen bg-gray-50 pb-16">
        <main className="max-w-xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">Iniciar entrenamiento</h1>
            <p className="text-sm text-gray-400 mt-1">Selecciona el bloque de trabajo</p>
          </div>

          {blocksLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : blocks.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No hay bloques disponibles</p>
          ) : (
            <div className="space-y-2">
              {blocks.map(block => (
                <button
                  key={block.id}
                  onClick={() => handleSelectBlock(block.id, block.name)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-accent hover:shadow-sm transition-all text-left"
                >
                  <div>
                    <p className="font-medium text-gray-900">{block.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {block.employee_name} · {block.client_count} clientes
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    )
  }

  // ── Fase setup — selección de clientes y días ────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <main className="max-w-xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => setPhase('block')}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-1 block"
          >
            ← Cambiar bloque
          </button>
          <h1 className="text-xl font-semibold text-gray-900">{selectedBlockName}</h1>
          <p className="text-sm text-gray-400 mt-1">
            Selecciona hasta 4 clientes para la sesión
          </p>
        </div>

        {clientsLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : clients.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No hay clientes en este bloque</p>
        ) : (
          <div className="space-y-3">
            {clients.map(client => {
              const latestMeso = client.mesocycles[0]
              const hasDays = latestMeso && latestMeso.days.length > 0
              const isChecked = checkedClientIds.includes(client.id)
              const isDisabled = !hasDays || (!isChecked && checkedClientIds.length >= 4)
              const selectedDayId = clientDayMap[client.id] ?? ''

              return (
                <div
                  key={client.id}
                  className={`bg-white rounded-xl border transition-all ${
                    isChecked ? 'border-accent shadow-sm' : 'border-gray-200'
                  } ${isDisabled && !isChecked ? 'opacity-40' : ''}`}
                >
                  {/* Fila de checkbox + nombre */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <input
                      type="checkbox"
                      id={`client-${client.id}`}
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={() => handleToggleClient(client.id)}
                      className="w-4 h-4 accent-accent shrink-0"
                    />
                    <label
                      htmlFor={`client-${client.id}`}
                      className={`font-medium flex-1 ${isDisabled ? 'text-gray-400' : 'text-gray-900 cursor-pointer'}`}
                    >
                      {client.full_name}
                    </label>
                    {!latestMeso && (
                      <span className="text-xs text-gray-300">Sin mesociclos</span>
                    )}
                    {latestMeso && !hasDays && (
                      <span className="text-xs text-gray-300">Sin días</span>
                    )}
                  </div>

                  {/* Selector de día (si el cliente está marcado) */}
                  {isChecked && hasDays && (
                    <div className="px-4 pb-3 border-t border-gray-100 pt-2.5">
                      <p className="text-xs text-gray-400 mb-1.5">
                        Mesociclo:{' '}
                        <span className="text-gray-700 font-medium">{latestMeso.name}</span>
                      </p>
                      <label className="text-xs text-gray-500 block mb-1">
                        Día de entrenamiento
                      </label>
                      <select
                        value={selectedDayId}
                        onChange={e => handleSelectDay(client.id, e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-accent"
                      >
                        <option value="">Seleccionar día…</option>
                        {latestMeso.days.map(day => (
                          <option key={day.id} value={day.id}>{day.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Botón iniciar */}
            <button
              onClick={handleStart}
              disabled={!canStart()}
              className="w-full py-3 mt-2 bg-accent text-white rounded-xl font-semibold text-sm transition-opacity disabled:opacity-40"
            >
              {checkedClientIds.length === 0
                ? 'Iniciar sesión'
                : `Iniciar sesión (${checkedClientIds.length} cliente${checkedClientIds.length !== 1 ? 's' : ''})`
              }
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
