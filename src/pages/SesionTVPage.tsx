// Página receptora para TV/Chromecast (Web Presentation API).
// Diseñada para pantallas de 65" a 1080p — tipografía grande, tema oscuro.
import { useEffect, useState } from 'react'
import type { SectionBlock, WeekStatus } from '../utils/trainingUtils'
import { calcularKgMovidos, calcularTotalKgMovidos } from '../utils/trainingUtils'

type Section = 'warmup' | 'main' | 'metabolic'

export type TVPanelData = {
  clientName: string
  dayName:    string
  sectionBlocks: SectionBlock[]
  weekStatuses:  WeekStatus[]
}

export type TVPayload = {
  panels:    TVPanelData[]
  section:   Section
  blockName: string
}

const SECTION_LABELS: Record<Section, string> = {
  warmup:    'Calentamiento',
  main:      'Principal',
  metabolic: 'Metabólico',
}

const SECTION_HEADER: Record<Section, string> = {
  warmup:    'bg-gray-600',
  main:      'bg-red-800',
  metabolic: 'bg-green-800',
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtKg(val: number | null): string {
  return val === null ? '—' : val.toFixed(1)
}

function gridCols(n: number): string {
  if (n <= 1) return 'grid-cols-1'
  if (n === 2) return 'grid-cols-2'
  if (n === 3) return 'grid-cols-3'
  return 'grid-cols-2' // 4 → 2×2
}

// Tamaños de texto según cantidad de paneles
type Sizes = { name: string; block: string; data: string; label: string }

function getSizes(panelCount: number): Sizes {
  if (panelCount === 1) return { name: 'text-4xl',  block: 'text-2xl', data: 'text-xl',   label: 'text-lg'   }
  if (panelCount === 2) return { name: 'text-3xl',  block: 'text-xl',  data: 'text-lg',   label: 'text-base' }
  return                       { name: 'text-2xl',  block: 'text-lg',  data: 'text-base', label: 'text-sm'   }
}

// ─── Tabla de un sub-bloque ──────────────────────────────────────────────────

function TVBlockTable({ block, section, lastCompleted, nextWeek, sizes }: Readonly<{
  block:         SectionBlock
  section:       Section
  lastCompleted: number
  nextWeek:      number
  sizes:         Sizes
}>) {
  const isMain       = section === 'main'
  const isMetabolic  = section === 'metabolic'
  const afterFields  = isMetabolic ? ['watts', 'kg', 'r'] : ['reps', 'kg', 'r']
  const showLast     = lastCompleted > 0
  const lastSets     = block.week_sets[String(lastCompleted)] ?? ''
  const nextSets     = block.week_sets[String(nextWeek)]      ?? ''

  return (
    <div className="bg-gray-700 rounded-xl overflow-hidden">
      {/* Nombre del bloque */}
      <div className="bg-gray-600 px-4 py-2">
        <span className={`${sizes.block} font-semibold text-white`}>{block.name}</span>
      </div>

      {/* Tabla de ejercicios */}
      <div className="px-2 pb-1">
        <table className={`w-full ${sizes.data} text-center`}>
          <thead>
            <tr className={`${sizes.label} text-gray-400 border-b border-gray-600`}>
              <th className="text-left px-2 py-1.5">Ejercicio</th>
              {showLast && (
                <>
                  <th className="px-2 py-1.5 text-green-400 border-l border-gray-500">CE</th>
                  <th className="px-2 py-1.5 text-green-400">Sets</th>
                  {afterFields.map(f => (
                    <th key={f} className="px-2 py-1.5 text-green-400 uppercase">{f === 'watts' ? 'W' : f}</th>
                  ))}
                </>
              )}
              <th className="px-2 py-1.5 text-white border-l border-gray-500">CE</th>
              <th className="px-2 py-1.5 text-white">Sets</th>
              {afterFields.map(f => (
                <th key={f} className="px-2 py-1.5 text-white uppercase">{f === 'watts' ? 'W' : f}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, idx) => {
              const lastWD  = (row.weeks[String(lastCompleted)] ?? {}) as Record<string, string>
              const nextWD  = (row.weeks[String(nextWeek)]      ?? {}) as Record<string, string>
              const isFirst = idx === 0
              const rowCount = block.rows.length

              return (
                <tr key={row.id} className="border-t border-gray-600">
                  <td className="text-left px-2 py-2 text-gray-300 truncate max-w-[180px]">
                    {row.exercise || '—'}
                  </td>
                  {showLast && (
                    <>
                      <td className="px-2 py-2 text-green-400 border-l border-gray-500">{lastWD['ce'] ?? '—'}</td>
                      {isFirst && (
                        <td className="px-2 py-2 text-green-400 font-semibold" rowSpan={rowCount}>{lastSets || '—'}</td>
                      )}
                      {afterFields.map(f => (
                        <td key={f} className="px-2 py-2 text-green-400">{lastWD[f] ?? '—'}</td>
                      ))}
                    </>
                  )}
                  <td className="px-2 py-2 text-white border-l border-gray-500">{nextWD['ce'] || '—'}</td>
                  {isFirst && (
                    <td className="px-2 py-2 text-white font-semibold" rowSpan={rowCount}>{nextSets || '—'}</td>
                  )}
                  {afterFields.map(f => (
                    <td key={f} className="px-2 py-2 text-white">{nextWD[f] || '—'}</td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Kg Movidos */}
      {isMain && block.rows.length > 0 && (
        <div className="bg-red-900 px-4 py-2 flex justify-between">
          <span className={`${sizes.label} text-white font-medium`}>Kg Movidos</span>
          <div className="flex gap-6">
            {showLast && (
              <span className={`${sizes.label} text-green-300`}>
                S{lastCompleted}: {fmtKg(calcularKgMovidos(block.rows, lastCompleted, lastSets))}
              </span>
            )}
            <span className={`${sizes.label} text-white`}>
              S{nextWeek}: {fmtKg(calcularKgMovidos(block.rows, nextWeek, nextSets))}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Total Kg Movidos ────────────────────────────────────────────────────────

function TVTotalKg({ blocks, lastCompleted, nextWeek, sizes }: Readonly<{
  blocks:        SectionBlock[]
  lastCompleted: number
  nextWeek:      number
  sizes:         Sizes
}>) {
  return (
    <div className="bg-red-900 rounded-xl px-4 py-3 flex justify-between mt-2">
      <span className={`${sizes.data} text-white font-bold`}>Total kg movidos</span>
      <div className="flex gap-6">
        {lastCompleted > 0 && (
          <span className={`${sizes.data} text-green-300`}>
            S{lastCompleted}: {fmtKg(calcularTotalKgMovidos(blocks, lastCompleted))}
          </span>
        )}
        <span className={`${sizes.data} text-white`}>
          S{nextWeek}: {fmtKg(calcularTotalKgMovidos(blocks, nextWeek))}
        </span>
      </div>
    </div>
  )
}

// ─── Panel de un cliente ─────────────────────────────────────────────────────

function TVPanel({ panel, section, panelCount }: Readonly<{
  panel:      TVPanelData
  section:    Section
  panelCount: number
}>) {
  const sizes = getSizes(panelCount)
  const blocks = panel.sectionBlocks.filter(b => b.section === section)
  const mainBlocks = panel.sectionBlocks.filter(b => b.section === 'main')

  const statuses        = panel.weekStatuses.filter(s => s.section === section)
  const completedWeeks  = statuses.filter(s => s.completed).map(s => s.week_number)
  const lastCompleted   = completedWeeks.length > 0 ? Math.max(...completedWeeks) : 0
  const nextWeek        = lastCompleted + 1

  return (
    <div className="bg-gray-800 flex flex-col h-full overflow-hidden">
      {/* Cabecera del panel */}
      <div className={`${SECTION_HEADER[section]} px-5 py-3 shrink-0`}>
        <h2 className={`${sizes.name} font-bold text-white leading-tight`}>{panel.clientName}</h2>
        <p className={`${sizes.label} text-white/70 mt-0.5`}>{panel.dayName}</p>
      </div>

      {/* Bloques */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {blocks.length === 0 ? (
          <p className={`${sizes.data} text-gray-500 text-center py-8`}>Sin bloques en esta sección</p>
        ) : (
          blocks.map(block => (
            <TVBlockTable
              key={block.id}
              block={block}
              section={section}
              lastCompleted={lastCompleted}
              nextWeek={nextWeek}
              sizes={sizes}
            />
          ))
        )}

        {section === 'main' && mainBlocks.length > 1 && (
          <TVTotalKg
            blocks={mainBlocks}
            lastCompleted={lastCompleted}
            nextWeek={nextWeek}
            sizes={sizes}
          />
        )}
      </div>
    </div>
  )
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function SesionTVPage() {
  const [payload, setPayload] = useState<TVPayload | null>(null)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const receiver = (navigator as any).presentation?.receiver
    if (!receiver) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function setupConn(conn: any) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      conn.addEventListener('message', (e: any) => {
        try { setPayload(JSON.parse(e.data)) } catch { /* ignorar mensajes malformados */ }
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    receiver.connectionList.then((list: any) => {
      list.connections.forEach(setupConn)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      list.addEventListener('connectionavailable', (e: any) => setupConn(e.connection))
    })
  }, [])

  if (!payload) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-white text-3xl font-semibold">Esperando conexión…</p>
          <p className="text-gray-500 text-xl mt-3">Inicia la sesión desde la tablet</p>
        </div>
      </div>
    )
  }

  const { panels, section, blockName } = payload
  const n    = panels.length
  const is2x2 = n === 4

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Barra superior */}
      <div className="bg-gray-950 px-6 py-2.5 flex items-center justify-between shrink-0 border-b border-gray-700">
        <span className="text-white text-2xl font-semibold">{blockName}</span>
        <span className={`px-5 py-1.5 rounded-full text-white text-xl font-medium ${SECTION_HEADER[section]}`}>
          {SECTION_LABELS[section]}
        </span>
      </div>

      {/* Grid de paneles */}
      <div
        className={`grid ${gridCols(n)} flex-1 bg-gray-700 gap-[2px] overflow-hidden`}
        style={{ gridTemplateRows: is2x2 ? '1fr 1fr' : '1fr' }}
      >
        {panels.map((panel, i) => (
          <TVPanel
            key={i}
            panel={panel}
            section={section}
            panelCount={n}
          />
        ))}
      </div>
    </div>
  )
}
