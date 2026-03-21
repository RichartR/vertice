// Página para iniciar una sesión de entrenamiento.
// Flujo: Bloque → Cantidad de clientes (1-4) → Configuración de paneles → Sesión en pantalla completa.
import { useEffect, useRef, useState } from 'react'
import { useTrainingBlocks } from '../hooks/useTrainingBlocks'
import { useTrainingSession } from '../hooks/useTrainingSession'
import PanelCliente from '../components/training/PanelCliente'
import type { TVPanelData } from './SesionTVPage'

type Phase = 'block' | 'count' | 'setup' | 'session'

type Section = 'warmup' | 'main' | 'metabolic'

type PanelConfig = {
  clientId: string
  clientName: string
  mesocycleId: string
  mesocycleName: string
  dayId: string
  dayName: string
}

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'warmup',    label: 'Calentamiento' },
  { key: 'main',      label: 'Principal'     },
  { key: 'metabolic', label: 'Metabólico'    },
]

const hasPresentationAPI = typeof globalThis !== 'undefined' && 'PresentationRequest' in globalThis

// Fullscreen API con soporte para webkit (Safari/iOS PWA) y fallback silencioso
function enterFullscreen() {
  const el = document.documentElement as any
  const fn = el.requestFullscreen ?? el.webkitRequestFullscreen
  fn?.call(el)?.catch(() => {})
}

function exitFullscreen() {
  const doc = document as any
  const fn = doc.exitFullscreen ?? doc.webkitExitFullscreen
  fn?.call(doc)?.catch(() => {})
}

// Columnas de grid para la sesión (fullscreen, siempre dividido)
function gridCols(n: number): string {
  if (n <= 1) return 'grid-cols-1'
  if (n === 2) return 'grid-cols-2'
  if (n === 3) return 'grid-cols-3'
  return 'grid-cols-2' // 4 → 2×2
}

// Columnas de grid para la fase de configuración (se apila en móvil)
function setupGridCls(n: number): string {
  if (n <= 1) return 'grid-cols-1'
  if (n === 2) return 'grid-cols-1 sm:grid-cols-2'
  if (n === 3) return 'grid-cols-1 sm:grid-cols-3'
  return 'grid-cols-1 sm:grid-cols-2' // 4 → 2×2 en sm+
}

export default function IniciarEntrenamientoPage() {
  const { blocks, loading: blocksLoading } = useTrainingBlocks()
  const { clients, loading: clientsLoading, fetchActiveData } = useTrainingSession()

  const [phase, setPhase] = useState<Phase>('block')
  const [selectedBlockName, setSelectedBlockName] = useState('')
  const [panelCount, setPanelCount] = useState(1)
  // Array de panelCount slots; null = sin configurar
  const [configs, setConfigs] = useState<(PanelConfig | null)[]>([null])
  // IDs estables por slot (generados al elegir cantidad, nunca cambian de orden)
  const [slotIds, setSlotIds] = useState<string[]>([crypto.randomUUID()])

  // Panel que se está editando actualmente
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [tempClientId, setTempClientId] = useState('')
  const [tempDayId, setTempDayId] = useState('')

  // ── Chromecast / Presentation API ─────────────────────────────────────────
  const [tvSection, setTvSection] = useState<Section>('warmup')
  const [panelDataMap, setPanelDataMap] = useState<Map<string, TVPanelData>>(new Map())
  const [isCasting, setIsCasting] = useState(false)
  const connectionRef = useRef<{ send: (s: string) => void } | null>(null)
  const selectedBlockNameRef = useRef(selectedBlockName)
  selectedBlockNameRef.current = selectedBlockName

  function sendToTV(data: Map<string, TVPanelData>, section: Section) {
    const conn = connectionRef.current
    if (!conn) return
    try {
      conn.send(JSON.stringify({
        panels:    [...data.values()],
        section,
        blockName: selectedBlockNameRef.current,
      }))
    } catch { /* ignorar si la conexión se cerró */ }
  }

  useEffect(() => {
    if (connectionRef.current) sendToTV(panelDataMap, tvSection)
  }, [panelDataMap, tvSection]) // eslint-disable-line

  async function handleCast() {
    const url = globalThis.location.origin + '/sesion-tv'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const request = new (globalThis as any).PresentationRequest([url])
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conn: any = await request.start()
      connectionRef.current = conn
      setIsCasting(true)
      conn.addEventListener('close', () => { connectionRef.current = null; setIsCasting(false) })
      // Dar tiempo a que la TV cargue la página antes de enviar datos
      setTimeout(() => sendToTV(panelDataMap, tvSection), 2000)
    } catch { /* usuario canceló el diálogo de cast */ }
  }

  // IDs de clientes ya asignados (para evitar duplicados entre paneles)
  const usedClientIds = new Set(
    configs
      .filter((c, i): c is PanelConfig => c !== null && i !== editingIdx)
      .map(c => c.clientId)
  )

  // ── Bloque ───────────────────────────────────────────────────────────────────

  function handleSelectBlock(id: string, name: string) {
    setSelectedBlockName(name)
    fetchActiveData(id)
    setPhase('count')
  }

  // ── Cantidad ─────────────────────────────────────────────────────────────────

  function handleSelectCount(n: number) {
    setPanelCount(n)
    setConfigs(new Array(n).fill(null))
    setSlotIds(Array.from({ length: n }, () => crypto.randomUUID()))
    setEditingIdx(null)
    setPhase('setup')
  }

  // ── Configuración de paneles ─────────────────────────────────────────────────

  function handleOpenPanel(idx: number) {
    const existing = configs[idx]
    setEditingIdx(idx)
    setTempClientId(existing?.clientId ?? '')
    setTempDayId(existing?.dayId ?? '')
  }

  function handleConfirmPanel() {
    if (editingIdx === null || !tempClientId || !tempDayId) return
    const client = clients.find(c => c.id === tempClientId)
    if (!client) return
    const latestMeso = client.mesocycles[0]
    const day = latestMeso.days.find(d => d.id === tempDayId)
    if (!day) return
    setConfigs(prev => prev.map((c, i) =>
      i === editingIdx
        ? {
            clientId: tempClientId,
            clientName: client.full_name,
            mesocycleId: latestMeso.id,
            mesocycleName: latestMeso.name,
            dayId: tempDayId,
            dayName: day.name,
          }
        : c
    ))
    setEditingIdx(null)
    setTempClientId('')
    setTempDayId('')
  }

  function handleCancelEdit() {
    setEditingIdx(null)
    setTempClientId('')
    setTempDayId('')
  }

  function handleClearPanel(idx: number) {
    setConfigs(prev => prev.map((c, i) => i === idx ? null : c))
    if (editingIdx === idx) handleCancelEdit()
  }

  const allConfigured = configs.every(Boolean)

  // Clientes disponibles: con mesociclo + días, excluye los ya asignados a otros paneles
  const tempClientData = clients.find(c => c.id === tempClientId)
  const tempLatestMeso = tempClientData?.mesocycles[0]
  const availableClients = clients.filter(c =>
    !usedClientIds.has(c.id) &&
    c.mesocycles.length > 0 &&
    c.mesocycles[0].days.length > 0
  )

  // ── Sesión (pantalla completa) ────────────────────────────────────────────────

  if (phase === 'session') {
    const n = configs.length
    const is2x2 = n === 4
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* Barra superior */}
        <div className="flex items-center justify-between px-4 pb-2.5 border-b border-gray-200 bg-gray-50 shrink-0" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.625rem)' }}>
          <div>
            <p className="text-xs text-gray-400">{selectedBlockName}</p>
            <h1 className="text-sm font-semibold text-gray-900">Sesión de entrenamiento</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Botones de sección para TV — solo si hay conexión activa */}
            {isCasting && (
              <div className="flex gap-1">
                {SECTIONS.map(s => (
                  <button
                    key={s.key}
                    onClick={() => setTvSection(s.key)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      tvSection === s.key
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {/* Botón cast — solo en Chromium */}
            {hasPresentationAPI && (
              <button
                onClick={handleCast}
                title="Proyectar en TV"
                className={`p-1.5 rounded-lg transition-colors ${
                  isCasting
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {/* Icono cast */}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M1 18v3h3c0-1.66-1.34-3-3-3zm0-4v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7zm18-7H5c-1.1 0-2 .9-2 2v3h2v-3h14v10h-5v2h5c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-18 3v2c4.97 0 9 4.03 9 9h2c0-6.08-4.93-11-11-11z"/>
                </svg>
              </button>
            )}

            <button
              onClick={() => { exitFullscreen(); setPhase('setup') }}
              className="px-3 py-1.5 text-xs text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Terminar sesión
            </button>
          </div>
        </div>

        {/* Paneles — gap de 1px sobre fondo gris actúa como separador */}
        <div
          className={`grid ${gridCols(n)} flex-1 bg-gray-200 gap-[1px] overflow-hidden`}
          style={{ gridTemplateRows: is2x2 ? '1fr 1fr' : '1fr' }}
        >
          {configs.map(config =>
            config && (
              <div key={config.clientId} className="bg-white overflow-hidden">
                <PanelCliente
                  clientName={`${config.clientName} — ${config.dayName}`}
                  dayId={config.dayId}
                  onDataLoaded={data => {
                    setPanelDataMap(prev => {
                      const next = new Map(prev)
                      next.set(config.clientId, {
                        clientName:    config.clientName,
                        dayName:       config.dayName,
                        sectionBlocks: data.sectionBlocks,
                        weekStatuses:  data.weekStatuses,
                      })
                      return next
                    })
                  }}
                />
              </div>
            )
          )}
        </div>
      </div>
    )
  }

  // ── Bloque ───────────────────────────────────────────────────────────────────

  if (phase === 'block') {
    return (
      <div className="min-h-screen bg-gray-50 pb-16">
        <main className="max-w-xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">Iniciar entrenamiento</h1>
            <p className="text-sm text-gray-400 mt-1">Selecciona el bloque de trabajo</p>
          </div>
          {blocksLoading && (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!blocksLoading && blocks.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No hay bloques disponibles</p>
          )}
          {!blocksLoading && blocks.length > 0 && (
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

  // ── Cantidad de clientes ──────────────────────────────────────────────────────

  if (phase === 'count') {
    return (
      <div className="min-h-screen bg-gray-50 pb-16">
        <main className="max-w-sm mx-auto px-4 py-8">
          <div className="mb-8">
            <button
              onClick={() => setPhase('block')}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-2 block"
            >
              ← {selectedBlockName}
            </button>
            <h1 className="text-xl font-semibold text-gray-900">¿Cuántos clientes?</h1>
            <p className="text-sm text-gray-400 mt-1">Selecciona entre 1 y 4 para esta sesión</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => handleSelectCount(n)}
                className="aspect-square flex flex-col items-center justify-center bg-white border-2 border-gray-200 rounded-2xl hover:border-accent hover:shadow-sm transition-all"
              >
                <span className="text-5xl font-bold text-gray-800">{n}</span>
                <span className="text-xs text-gray-400 mt-1">{n === 1 ? 'cliente' : 'clientes'}</span>
              </button>
            ))}
          </div>
        </main>
      </div>
    )
  }

  // ── Configuración de paneles ─────────────────────────────────────────────────

  return (
    <div className="flex flex-col bg-white" style={{ minHeight: 'calc(100vh - 56px)' }}>
      {/* Barra superior */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50 shrink-0">
        <div>
          <button
            onClick={() => setPhase('count')}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors block mb-0.5"
          >
            ← Cambiar cantidad
          </button>
          <p className="text-sm font-semibold text-gray-900">{selectedBlockName}</p>
        </div>
        <button
          onClick={() => { enterFullscreen(); setPhase('session') }}
          disabled={!allConfigured}
          className="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed bg-accent-dark hover:bg-accent text-gray-800 disabled:bg-gray-200 disabled:text-gray-400"
        >
          Iniciar sesión
        </button>
      </div>

      {/* Paneles de configuración */}
      <div
        className={`grid ${setupGridCls(panelCount)} flex-1 bg-gray-200 gap-[1px]`}
        style={{ minHeight: 'calc(100vh - 140px)' }}
      >
        {configs.map((config, idx) => {
          const isEditing = editingIdx === idx

          return (
            <div key={slotIds[idx]} className="bg-white flex flex-col">

              {/* ── Panel configurado ── */}
              {config && !isEditing && (
                <div className="flex flex-col h-full p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{config.clientName}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {config.mesocycleName} · {config.dayName}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenPanel(idx)}
                        className="text-xs text-gray-400 hover:text-gray-600 px-2 py-0.5 rounded border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        Cambiar
                      </button>
                      <button
                        onClick={() => handleClearPanel(idx)}
                        className="text-xs text-gray-400 hover:text-red-400 px-1.5 py-0.5 rounded border border-gray-200 hover:border-red-200 transition-colors"
                        title="Quitar cliente"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-2xl">
                      ✓
                    </div>
                  </div>
                </div>
              )}

              {/* ── Formulario de selección ── */}
              {isEditing && (
                <div className="flex flex-col h-full p-4 bg-gray-50">
                  <p className="text-sm font-semibold text-gray-700 mb-4">
                    Cliente {idx + 1}
                  </p>
                  {clientsLoading && (
                    <div className="flex justify-center py-4">
                      <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {!clientsLoading && availableClients.length === 0 && !tempClientId && (
                    <p className="text-xs text-gray-400 text-center py-4">
                      No hay más clientes disponibles
                    </p>
                  )}
                  {!clientsLoading && (availableClients.length > 0 || tempClientId) && (
                    <div className="space-y-3">
                      <div>
                        <label htmlFor={`select-client-${idx}`} className="text-xs text-gray-500 block mb-1">Cliente</label>
                        <select
                          id={`select-client-${idx}`}
                          value={tempClientId}
                          onChange={e => { setTempClientId(e.target.value); setTempDayId('') }}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-accent"
                        >
                          <option value="">Seleccionar cliente…</option>
                          {availableClients.map(c => (
                            <option key={c.id} value={c.id}>{c.full_name}</option>
                          ))}
                        </select>
                      </div>

                      {tempLatestMeso && (
                        <div>
                          <p className="text-xs text-gray-400 mb-2">
                            Mesociclo:{' '}
                            <span className="font-medium text-gray-700">{tempLatestMeso.name}</span>
                          </p>
                          <label htmlFor={`select-day-${idx}`} className="text-xs text-gray-500 block mb-1">Día</label>
                          <select
                            id={`select-day-${idx}`}
                            value={tempDayId}
                            onChange={e => setTempDayId(e.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-accent"
                          >
                            <option value="">Seleccionar día…</option>
                            {tempLatestMeso.days.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={handleConfirmPanel}
                          disabled={!tempClientId || !tempDayId}
                          className="flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed bg-accent-dark hover:bg-accent text-gray-800 disabled:bg-gray-200 disabled:text-gray-400"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 text-xs text-gray-500 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Panel vacío ── */}
              {!config && !isEditing && (
                <button
                  onClick={() => handleOpenPanel(idx)}
                  className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-300 hover:text-gray-400 hover:bg-gray-50 transition-colors"
                >
                  <span className="w-14 h-14 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center text-3xl leading-none">
                    +
                  </span>
                  <span className="text-sm font-medium">Añadir cliente</span>
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
