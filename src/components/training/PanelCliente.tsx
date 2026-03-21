// Panel independiente de un cliente durante la sesión de entrenamiento.
// Muestra la sección activa (tabs: Calentamiento / Principal / Metabólico) con
// 2 columnas de semanas: la última completada (solo lectura) y la próxima (editable).
import { useEffect, useRef, useState } from 'react'
import { useTrainingDayDetail } from '../../hooks/useTrainingDayDetail'
import type { SectionBlock, WeekStatus } from '../../utils/trainingUtils'
import { calcularKgMovidos, calcularTotalKgMovidos } from '../../utils/trainingUtils'

// Vista de solo lectura — no se puede editar ni completar semanas desde la sesión.

type Section = 'warmup' | 'main' | 'metabolic'

// Mismos colores que en EntrenamientoDiaPage para consistencia visual
const SECTIONS: { key: Section; label: string; activeClass: string; headerBg: string }[] = [
  { key: 'warmup',    label: 'Calentamiento', activeClass: 'bg-gray-200 text-gray-800',   headerBg: 'bg-gray-200' },
  { key: 'main',      label: 'Principal',     activeClass: 'bg-red-200 text-red-900',     headerBg: 'bg-red-200'  },
  { key: 'metabolic', label: 'Metabólico',    activeClass: 'bg-green-200 text-green-900', headerBg: 'bg-green-200'},
]

// ─── Tabla de un sub-bloque (2 semanas, solo lectura) ────────────────────────

type BlockTableProps = {
  block: SectionBlock
  lastCompleted: number
  nextWeek: number
  isMain: boolean
}

function BlockTable({ block, lastCompleted, nextWeek, isMain }: Readonly<BlockTableProps>) {
  const afterSetsFields = isMain ? ['reps', 'kg', 'r'] : ['watts', 'kg', 'r']
  const showLast = lastCompleted > 0

  const lastSets = block.week_sets[String(lastCompleted)] ?? ''
  const nextSets = block.week_sets[String(nextWeek)] ?? ''

  const kgMovidos = (week: number, setsVal: string): string => {
    if (!isMain) return ''
    const kg = calcularKgMovidos(block.rows, week, setsVal)
    return kg === null ? '—' : kg.toFixed(1)
  }

  // Número de columnas por semana: CE + Sets + afterSetsFields
  const colsPerWeek = 1 + 1 + afterSetsFields.length

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden mb-3">
      {/* Nombre del bloque */}
      <div className="bg-gray-50 px-2 py-1.5 text-xs font-semibold text-gray-700 border-b border-gray-100">
        {block.name}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            {/* Fila: etiquetas de semana */}
            <tr className="border-b border-gray-100 bg-gray-50 text-center">
              <th className="px-1.5 py-1 text-left min-w-[70px] text-gray-400">Ejercicio</th>
              {showLast && (
                <th
                  colSpan={colsPerWeek}
                  className="py-1 text-green-700 bg-green-50 border-l border-green-200 font-semibold"
                >
                  S{lastCompleted} ✓
                </th>
              )}
              <th
                colSpan={colsPerWeek}
                className="py-1 text-gray-700 border-l border-gray-200 font-semibold"
              >
                S{nextWeek}
              </th>
            </tr>

            {/* Fila: nombres de campo */}
            <tr className="border-b border-gray-100 bg-gray-50 text-center text-gray-400">
              <th></th>
              {showLast && (
                <>
                  <th className="px-0.5 py-0.5 border-l border-green-200 bg-green-50">CE</th>
                  <th className="px-0.5 py-0.5 bg-green-50">Sets</th>
                  {afterSetsFields.map(f => (
                    <th key={f} className="px-0.5 py-0.5 bg-green-50 uppercase text-[10px]">
                      {f === 'watts' ? 'W' : f}
                    </th>
                  ))}
                </>
              )}
              <th className="px-0.5 py-0.5 border-l border-gray-200">CE</th>
              <th className="px-0.5 py-0.5">Sets</th>
              {afterSetsFields.map(f => (
                <th key={f} className="px-0.5 py-0.5 uppercase text-[10px]">
                  {f === 'watts' ? 'W' : f}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {block.rows.map((row, idx) => {
              const lastWD = (row.weeks[String(lastCompleted)] ?? {}) as Record<string, string>
              const nextWD = (row.weeks[String(nextWeek)] ?? {}) as Record<string, string>
              const isFirst = idx === 0
              const rowCount = block.rows.length

              return (
                <tr key={row.id} className="border-b border-gray-100 last:border-0">
                  {/* Nombre del ejercicio */}
                  <td className="px-1.5 py-1 text-gray-700 max-w-[80px] truncate" title={row.exercise}>
                    {row.exercise || '—'}
                  </td>

                  {/* Semana lastCompleted — solo lectura */}
                  {showLast && (
                    <>
                      <td className="px-0.5 py-0.5 text-center bg-green-50 text-green-700 border-l border-green-200">
                        {lastWD['ce'] ?? '—'}
                      </td>
                      {isFirst && (
                        <td
                          className="px-0.5 py-0.5 text-center bg-green-50 text-green-700 font-medium"
                          rowSpan={rowCount}
                        >
                          {lastSets || '—'}
                        </td>
                      )}
                      {afterSetsFields.map(f => (
                        <td key={f} className="px-0.5 py-0.5 text-center bg-green-50 text-green-700">
                          {lastWD[f] ?? '—'}
                        </td>
                      ))}
                    </>
                  )}

                  {/* Semana nextWeek — solo lectura */}
                  <td className="px-0.5 py-1 text-center text-gray-700 border-l border-gray-200">
                    {nextWD['ce'] || '—'}
                  </td>
                  {isFirst && (
                    <td className="px-0.5 py-1 text-center text-gray-700 font-medium bg-gray-50" rowSpan={rowCount}>
                      {nextSets || '—'}
                    </td>
                  )}
                  {afterSetsFields.map(f => (
                    <td key={f} className="px-0.5 py-1 text-center text-gray-700">
                      {nextWD[f] || '—'}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Kg Movidos — solo sección principal */}
      {isMain && block.rows.length > 0 && (
        <div className="bg-red-900 text-white px-2 py-1 flex justify-between text-xs font-medium">
          <span>Kg Mov.</span>
          <div className="flex gap-4">
            {showLast && (
              <span className="text-green-300">
                S{lastCompleted}: {kgMovidos(lastCompleted, lastSets)}
              </span>
            )}
            <span>S{nextWeek}: {kgMovidos(nextWeek, nextSets)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Total Kg Movidos (varios sub-bloques) ────────────────────────────────────

function TotalKgRow({ blocks, lastCompleted, nextWeek }: Readonly<{
  blocks: SectionBlock[]
  lastCompleted: number
  nextWeek: number
}>) {
  const fmt = (week: number) => {
    const val = calcularTotalKgMovidos(blocks, week)
    return val === null ? '—' : val.toFixed(1)
  }

  return (
    <div className="bg-red-900 text-white px-2 py-1.5 rounded-lg text-xs font-medium flex justify-between mt-1">
      <span>Total kg movidos</span>
      <div className="flex gap-4">
        {lastCompleted > 0 && (
          <span className="text-green-300">S{lastCompleted}: {fmt(lastCompleted)}</span>
        )}
        <span>S{nextWeek}: {fmt(nextWeek)}</span>
      </div>
    </div>
  )
}

// ─── Panel principal ──────────────────────────────────────────────────────────

type PanelClienteProps = {
  clientName: string
  dayId: string
  onDataLoaded?: (data: { sectionBlocks: SectionBlock[]; weekStatuses: WeekStatus[] }) => void
}

export default function PanelCliente({ clientName, dayId, onDataLoaded }: Readonly<PanelClienteProps>) {
  const { sectionBlocks, weekStatuses, loading, fetchDayDetail } = useTrainingDayDetail()

  const [activeSection, setActiveSection] = useState<Section>('warmup')

  useEffect(() => {
    fetchDayDetail(dayId)
  }, [dayId, fetchDayDetail])

  // Notifica al padre cuando termina una carga (loading true → false)
  const wasLoadingRef = useRef(false)
  useEffect(() => {
    if (wasLoadingRef.current && !loading) {
      onDataLoaded?.({ sectionBlocks, weekStatuses })
    }
    wasLoadingRef.current = loading
  })

  const sectionStatuses = weekStatuses.filter(s => s.section === activeSection)
  const completedWeeks = sectionStatuses.filter(s => s.completed).map(s => s.week_number)
  const lastCompleted = completedWeeks.length > 0 ? Math.max(...completedWeeks) : 0
  const nextWeek = lastCompleted + 1

  const blocksInSection = sectionBlocks.filter(b => b.section === activeSection)
  const mainBlocks = sectionBlocks.filter(b => b.section === 'main')

  const activeSectionDef = SECTIONS.find(s => s.key === activeSection) ?? SECTIONS[0]

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* Cabecera: nombre + tabs de sección */}
      <div className={`px-3 py-2.5 border-b border-gray-200 shrink-0 transition-colors ${activeSectionDef.headerBg}`}>
        <h2 className="font-semibold text-gray-900 text-sm truncate">{clientName}</h2>
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {SECTIONS.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                activeSection === s.key
                  ? `${s.activeClass} font-semibold ring-1 ring-inset ring-black/10`
                  : 'bg-white/60 text-gray-500 hover:bg-white/90'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cuerpo: scrollable */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Sub-bloques */}
            {blocksInSection.length === 0 ? (
              <p className="text-xs text-gray-300 text-center py-6">Sin bloques en esta sección</p>
            ) : (
              blocksInSection.map(block => (
                <BlockTable
                  key={block.id}
                  block={block}
                  lastCompleted={lastCompleted}
                  nextWeek={nextWeek}
                  isMain={activeSection === 'main'}
                />
              ))
            )}

            {/* Total kg movidos — solo sección principal con más de 1 bloque */}
            {activeSection === 'main' && mainBlocks.length > 1 && (
              <TotalKgRow
                blocks={mainBlocks}
                lastCompleted={lastCompleted}
                nextWeek={nextWeek}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
