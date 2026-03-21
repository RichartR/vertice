// Panel independiente de un cliente durante la sesión de entrenamiento.
// Muestra la sección activa (tabs: Calentamiento / Principal / Metabólico) con
// 2 columnas de semanas: la última completada (solo lectura) y la próxima (editable).
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTrainingDayDetail } from '../../hooks/useTrainingDayDetail'
import type { SectionBlock } from '../../utils/trainingUtils'
import { calcularKgMovidos, calcularTotalKgMovidos } from '../../utils/trainingUtils'

type Section = 'warmup' | 'main' | 'metabolic'

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'warmup',    label: 'Calentamiento' },
  { key: 'main',      label: 'Principal' },
  { key: 'metabolic', label: 'Metabólico' },
]

function useDebounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  return useCallback((...args: Parameters<T>) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => fn(...args), delay)
  }, [fn, delay]) as T
}

// ─── Tabla de un sub-bloque (2 semanas) ──────────────────────────────────────

type BlockTableProps = {
  block: SectionBlock
  lastCompleted: number
  nextWeek: number
  isMain: boolean
  onUpdateWeek: (rowId: string, week: number, campo: string, valor: string) => Promise<void>
  onUpdateBlockSets: (blockId: string, week: number, value: string) => Promise<void>
}

function BlockTable({
  block, lastCompleted, nextWeek, isMain, onUpdateWeek, onUpdateBlockSets,
}: BlockTableProps) {
  const afterSetsFields = isMain ? ['reps', 'kg', 'r'] : ['watts', 'kg', 'r']
  const showLast = lastCompleted > 0

  const lastSets = block.week_sets[String(lastCompleted)] ?? ''
  const nextSets = block.week_sets[String(nextWeek)] ?? ''

  const debouncedWeek = useDebounce(async (rowId: string, week: number, campo: string, valor: string) => {
    await onUpdateWeek(rowId, week, campo, valor)
  }, 800)

  const debouncedSets = useDebounce(async (week: number, value: string) => {
    await onUpdateBlockSets(block.id, week, value)
  }, 800)

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

                  {/* Semana nextWeek — editable */}
                  <td className="px-0.5 py-0.5 border-l border-gray-200">
                    <input
                      type="text"
                      defaultValue={nextWD['ce'] ?? ''}
                      onChange={e => debouncedWeek(row.id, nextWeek, 'ce', e.target.value)}
                      className="w-7 text-center bg-transparent border-0 outline-none focus:bg-gray-50 rounded py-0.5"
                    />
                  </td>
                  {isFirst && (
                    <td className="px-0.5 py-0.5 bg-gray-50" rowSpan={rowCount}>
                      <input
                        type="text"
                        defaultValue={nextSets}
                        onChange={e => debouncedSets(nextWeek, e.target.value)}
                        className="w-7 text-center bg-transparent border-0 outline-none focus:bg-white rounded py-0.5"
                      />
                    </td>
                  )}
                  {afterSetsFields.map(f => (
                    <td key={f} className="px-0.5 py-0.5">
                      <input
                        type="text"
                        defaultValue={nextWD[f] ?? ''}
                        onChange={e => debouncedWeek(row.id, nextWeek, f, e.target.value)}
                        className="w-7 text-center bg-transparent border-0 outline-none focus:bg-gray-50 rounded py-0.5"
                      />
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

function TotalKgRow({ blocks, lastCompleted, nextWeek }: {
  blocks: SectionBlock[]
  lastCompleted: number
  nextWeek: number
}) {
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
  mesocycleId: string
}

export default function PanelCliente({ clientName, dayId, mesocycleId }: PanelClienteProps) {
  const {
    sectionBlocks, weekStatuses, loading, fetchDayDetail,
    updateWeekData, updateBlockWeekSets, toggleWeekCompleted,
  } = useTrainingDayDetail()

  const [activeSection, setActiveSection] = useState<Section>('main')

  useEffect(() => {
    fetchDayDetail(dayId)
  }, [dayId, fetchDayDetail])

  const sectionStatuses = weekStatuses.filter(s => s.section === activeSection)
  const completedWeeks = sectionStatuses.filter(s => s.completed).map(s => s.week_number)
  const lastCompleted = completedWeeks.length > 0 ? Math.max(...completedWeeks) : 0
  const nextWeek = lastCompleted + 1

  const blocksInSection = sectionBlocks.filter(b => b.section === activeSection)
  const mainBlocks = sectionBlocks.filter(b => b.section === 'main')

  const isNextCompleted = sectionStatuses.find(s => s.week_number === nextWeek)?.completed ?? false

  async function handleToggleNext(completed: boolean) {
    try {
      await toggleWeekCompleted(dayId, mesocycleId, activeSection, nextWeek, completed)
    } catch (e) {
      console.error('Error al marcar semana:', e)
    }
  }

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* Cabecera: nombre + tabs de sección */}
      <div className="px-3 py-2.5 border-b border-gray-200 bg-gray-50 shrink-0">
        <h2 className="font-semibold text-gray-900 text-sm truncate">{clientName}</h2>
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {SECTIONS.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                activeSection === s.key
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
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
            {/* Barra de estado: última semana + checkbox de completar */}
            <div className="flex items-center justify-between mb-3 text-xs">
              <span>
                {lastCompleted > 0
                  ? <span className="text-green-600 font-medium">S{lastCompleted} completada</span>
                  : <span className="text-gray-300">Sin semanas completadas</span>
                }
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isNextCompleted}
                  onChange={e => handleToggleNext(e.target.checked)}
                  className="w-3.5 h-3.5"
                />
                <span className={isNextCompleted ? 'text-green-600 font-medium' : 'text-gray-500'}>
                  S{nextWeek} completada
                </span>
              </label>
            </div>

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
                  onUpdateWeek={updateWeekData}
                  onUpdateBlockSets={updateBlockWeekSets}
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
