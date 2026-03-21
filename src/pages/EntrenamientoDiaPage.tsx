// Plantilla completa de sesión de entrenamiento.
// 3 secciones fijas (warmup, main, metabolic) → sub-bloques → filas de ejercicio × 6 semanas.
// Sets es un valor compartido del sub-bloque (una celda con rowSpan para todas las filas).
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTrainingDayDetail } from '../hooks/useTrainingDayDetail'
import type { ExerciseRow, SectionBlock, WeekStatus } from '../utils/trainingUtils'
import { calcularKgMovidos, calcularTotalKgMovidos } from '../utils/trainingUtils'
import { exportTrainingDay } from '../utils/exportTraining'

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Section = 'warmup' | 'main' | 'metabolic'
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const SECTIONS: { key: Section; label: string; headerClass: string }[] = [
  { key: 'warmup',    label: 'Calentamiento', headerClass: 'bg-gray-200 text-gray-800' },
  { key: 'main',      label: 'Principal',     headerClass: 'bg-red-200 text-red-900' },
  { key: 'metabolic', label: 'Metabólico',    headerClass: 'bg-green-200 text-green-900' },
]

const WEEKS = [1, 2, 3, 4, 5, 6]

// Columnas del encabezado y filas especiales (Kg Movidos / Total): incluyen Sets
const HEADER_FIELDS_NORMAL:    string[] = ['ce', 'sets', 'reps', 'kg', 'r']
const HEADER_FIELDS_METABOLIC: string[] = ['ce', 'sets', 'watts', 'kg', 'r']

// Columnas de cada fila de ejercicio: CE antes de Sets, el resto después
const ROW_AFTER_SETS_NORMAL:    string[] = ['reps', 'kg', 'r']
const ROW_AFTER_SETS_METABOLIC: string[] = ['watts', 'kg', 'r']

const FIELD_LABELS: Record<string, string> = {
  ce: 'CE', sets: 'Sets', reps: 'Reps', watts: 'Watts', kg: 'KG', r: 'R',
}

// ─── Debounce hook ────────────────────────────────────────────────────────────

function useDebounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  return useCallback((...args: Parameters<T>) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => fn(...args), delay)
  }, [fn, delay]) as T
}

// ─── Helpers de visualización ─────────────────────────────────────────────────

function weekBorderClass(isCompleted: boolean): string {
  return isCompleted ? 'border-l-2 border-green-300' : 'border-l-2 border-gray-200'
}

function weekColClass(isFirst: boolean, isCompleted: boolean): string {
  let border = ''
  if (isFirst) {
    border = isCompleted ? 'border-l-2 border-green-300' : 'border-l-2 border-gray-200'
  }
  const color = isCompleted ? 'bg-green-50 text-green-700' : 'text-gray-400'
  return `px-1 py-1.5 text-center font-medium min-w-[40px] ${border} ${color}`
}

function kgMovidosCell(rows: ExerciseRow[], w: number, setsValue: string): string {
  const kg = calcularKgMovidos(rows, w, setsValue)
  return kg === null ? '—' : kg.toFixed(1)
}

function totalKgCell(blocks: SectionBlock[], w: number): string {
  const kg = calcularTotalKgMovidos(blocks, w)
  return kg === null ? '—' : kg.toFixed(1)
}

// ─── Fila de ejercicio (memoizada) ────────────────────────────────────────────

type ExerciseRowProps = Readonly<{
  row: ExerciseRow
  section: Section
  isFirst: boolean
  rowCount: number
  blockWeekSets: Record<string, string>
  onUpdateField: (id: string, field: 'exercise' | 'notes', value: string) => Promise<void>
  onUpdateWeek: (id: string, week: number, campo: string, valor: string) => Promise<void>
  onUpdateBlockSets: (week: number, value: string) => void
  onDelete: (id: string) => void
  onSaveStart: () => void
  onSaveEnd: (ok: boolean) => void
}>

const ExerciseRowComponent = React.memo(function ExerciseRowComponent({
  row, section, isFirst, rowCount, blockWeekSets,
  onUpdateField, onUpdateWeek, onUpdateBlockSets, onDelete, onSaveStart, onSaveEnd,
}: ExerciseRowProps) {
  const afterSetsFields = section === 'metabolic' ? ROW_AFTER_SETS_METABOLIC : ROW_AFTER_SETS_NORMAL

  const debouncedField = useDebounce(async (field: 'exercise' | 'notes', value: string) => {
    onSaveStart()
    try { await onUpdateField(row.id, field, value); onSaveEnd(true) }
    catch { onSaveEnd(false) }
  }, 800)

  const debouncedWeek = useDebounce(async (week: number, campo: string, valor: string) => {
    onSaveStart()
    try { await onUpdateWeek(row.id, week, campo, valor); onSaveEnd(true) }
    catch { onSaveEnd(false) }
  }, 800)

  const debouncedSets = useDebounce((week: number, value: string) => {
    onUpdateBlockSets(week, value)
  }, 800)

  return (
    <tr className="border-b border-gray-100 last:border-0">
      {/* Eliminar */}
      <td className="px-1 py-1 text-center">
        <button
          onClick={() => onDelete(row.id)}
          className="text-gray-300 hover:text-red-400 transition-colors text-xs px-1"
          title="Eliminar fila"
        >×</button>
      </td>

      {/* Ejercicio */}
      <td className="px-2 py-1 min-w-[120px]">
        <input
          type="text"
          defaultValue={row.exercise}
          onChange={e => debouncedField('exercise', e.target.value)}
          placeholder="Ejercicio"
          className="w-full text-xs bg-transparent border-0 outline-none focus:bg-gray-50 rounded px-1 py-0.5"
        />
      </td>

      {/* Observaciones */}
      <td className="px-2 py-1 min-w-[100px]">
        <input
          type="text"
          defaultValue={row.notes}
          onChange={e => debouncedField('notes', e.target.value)}
          placeholder="Obs."
          className="w-full text-xs bg-transparent border-0 outline-none focus:bg-gray-50 rounded px-1 py-0.5"
        />
      </td>

      {/* Semanas: CE | Sets(rowSpan, solo primera fila) | Reps/Watts | KG | R */}
      {WEEKS.map(w => {
        const weekData = row.weeks[String(w)] ?? {}
        const setsValue = blockWeekSets[String(w)] ?? ''
        const borderCls = weekBorderClass(false) // el color de completada se maneja en el header

        return [
          // CE
          <td key={`${w}-ce`} className={`px-1 py-1 text-center ${borderCls}`}>
            <input
              type="text"
              defaultValue={weekData['ce'] ?? ''}
              onChange={e => debouncedWeek(w, 'ce', e.target.value)}
              className="w-10 text-xs text-center bg-transparent border-0 outline-none focus:bg-gray-50 rounded py-0.5"
            />
          </td>,

          // Sets — solo en la primera fila, rowSpan cubre todas las filas del bloque
          ...(isFirst ? [
            <td key={`${w}-sets`} rowSpan={rowCount} className="px-1 py-1 text-center align-middle bg-gray-50 border-l border-r border-gray-100">
              <input
                type="text"
                defaultValue={setsValue}
                onChange={e => debouncedSets(w, e.target.value)}
                className="w-10 text-xs text-center bg-transparent border-0 outline-none focus:bg-white rounded py-0.5"
              />
            </td>,
          ] : []),

          // Reps/Watts, KG, R
          ...afterSetsFields.map(campo => (
            <td key={`${w}-${campo}`} className="px-1 py-1 text-center">
              <input
                type="text"
                defaultValue={(weekData as any)[campo] ?? ''}
                onChange={e => debouncedWeek(w, campo, e.target.value)}
                className="w-10 text-xs text-center bg-transparent border-0 outline-none focus:bg-gray-50 rounded py-0.5"
              />
            </td>
          )),
        ]
      })}
    </tr>
  )
})

// ─── Colgroup compartido — mismo ancho de columnas en block table y total table ──

function TrainingColGroup({ section }: Readonly<{ section: Section }>) {
  const fields = section === 'metabolic' ? HEADER_FIELDS_METABOLIC : HEADER_FIELDS_NORMAL
  return (
    <colgroup>
      <col style={{ width: '28px' }} />
      <col style={{ width: '130px' }} />
      <col style={{ width: '110px' }} />
      {WEEKS.flatMap(w =>
        fields.map(campo => (
          <col key={`${w}-${campo}`} style={{ width: '44px' }} />
        ))
      )}
    </colgroup>
  )
}

// ─── Sub-bloque ───────────────────────────────────────────────────────────────

type SectionBlockProps = Readonly<{
  block: SectionBlock
  section: Section
  weekStatuses: WeekStatus[]
  onUpdateBlockName: (id: string, name: string) => Promise<void>
  onUpdateBlockSets: (blockId: string, week: number, value: string) => Promise<void>
  onDeleteBlock: (id: string) => void
  onAddRow: (blockId: string) => void
  onDeleteRow: (id: string) => void
  onUpdateField: (id: string, field: 'exercise' | 'notes', value: string) => Promise<void>
  onUpdateWeek: (id: string, week: number, campo: string, valor: string) => Promise<void>
  onToggleWeek: (week: number, completed: boolean) => void
  onSaveStart: () => void
  onSaveEnd: (ok: boolean) => void
}>

function SectionBlockComponent({
  block, section, weekStatuses,
  onUpdateBlockName, onUpdateBlockSets, onDeleteBlock, onAddRow, onDeleteRow,
  onUpdateField, onUpdateWeek, onToggleWeek, onSaveStart, onSaveEnd,
}: SectionBlockProps) {
  const headerFields = section === 'metabolic' ? HEADER_FIELDS_METABOLIC : HEADER_FIELDS_NORMAL
  const [confirmDelete, setConfirmDelete] = useState(false)

  const debouncedName = useDebounce(async (name: string) => {
    onSaveStart()
    try { await onUpdateBlockName(block.id, name); onSaveEnd(true) }
    catch { onSaveEnd(false) }
  }, 800)

  const handleBlockSets = useCallback((week: number, value: string) => {
    onSaveStart()
    onUpdateBlockSets(block.id, week, value)
      .then(() => onSaveEnd(true))
      .catch(() => onSaveEnd(false))
  }, [block.id, onUpdateBlockSets, onSaveStart, onSaveEnd])

  return (
    <div className="mb-4 rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs table-fixed">
          <TrainingColGroup section={section} />
          <thead>
            {/* Fila 1: nombre del bloque | checkboxes de semana */}
            <tr className="bg-gray-50 border-b border-gray-100">
              <th colSpan={3} className="px-2 py-2 text-left">
                <div className="flex items-center justify-between w-full">
                  <input
                    type="text"
                    defaultValue={block.name}
                    onChange={e => debouncedName(e.target.value)}
                    placeholder="Nombre del bloque"
                    className="text-sm font-semibold text-gray-700 bg-transparent border-0 outline-none focus:bg-white rounded px-1 py-0.5 flex-1 min-w-0"
                  />
                  {confirmDelete ? (
                    <div className="flex items-center gap-1 text-xs shrink-0">
                      <span className="text-gray-400">¿Eliminar?</span>
                      <button onClick={() => onDeleteBlock(block.id)} className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors">Sí</button>
                      <button onClick={() => setConfirmDelete(false)} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors">No</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="text-gray-300 hover:text-red-400 transition-colors px-1 shrink-0"
                      title="Eliminar sub-bloque"
                    >🗑</button>
                  )}
                </div>
              </th>
              {WEEKS.map(w => {
                const isCompleted = weekStatuses.find(s => s.week_number === w)?.completed ?? false
                return (
                  <th
                    key={w}
                    colSpan={headerFields.length}
                    className={`py-2 text-center border-l-2 ${
                      isCompleted
                        ? 'border-green-300 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-400'
                    }`}
                  >
                    <label className="flex items-center justify-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={e => onToggleWeek(w, e.target.checked)}
                        className="w-3 h-3"
                      />
                      S{w}{isCompleted ? ' ✓' : ''}
                    </label>
                  </th>
                )
              })}
            </tr>

            {/* Fila 2: columnas CE | Sets | Reps | KG | R */}
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="w-6"></th>
              <th className="px-2 py-1.5 text-left font-medium text-gray-500 min-w-[120px]">Ejercicio</th>
              <th className="px-2 py-1.5 text-left font-medium text-gray-500 min-w-[100px]">Observaciones</th>
              {WEEKS.map(w => {
                const isCompleted = weekStatuses.find(s => s.week_number === w)?.completed ?? false
                return headerFields.map((campo, i) => (
                  <th key={`${w}-${campo}`} className={weekColClass(i === 0, isCompleted)}>
                    {FIELD_LABELS[campo]}
                  </th>
                ))
              })}
            </tr>
          </thead>

          <tbody>
            {block.rows.map((row, idx) => (
              <ExerciseRowComponent
                key={row.id}
                row={row}
                section={section}
                isFirst={idx === 0}
                rowCount={block.rows.length}
                blockWeekSets={block.week_sets}
                onUpdateField={onUpdateField}
                onUpdateWeek={onUpdateWeek}
                onUpdateBlockSets={handleBlockSets}
                onDelete={onDeleteRow}
                onSaveStart={onSaveStart}
                onSaveEnd={onSaveEnd}
              />
            ))}

            {/* Fila "Kg Movidos" — solo sección principal */}
            {section === 'main' && (
              <tr className="bg-red-900 text-white">
                <td></td>
                <td colSpan={2} className="px-2 py-1.5 font-semibold">Kg Movidos</td>
                {WEEKS.map(w =>
                  headerFields.map((campo, i) => (
                    <td
                      key={`kg-${w}-${campo}`}
                      className={`px-1 py-1.5 text-center ${i === 0 ? 'border-l-2 border-red-700' : ''}`}
                    >
                      {campo === 'reps' || campo === 'watts'
                        ? kgMovidosCell(block.rows, w, block.week_sets[String(w)] ?? '')
                        : ''}
                    </td>
                  ))
                )}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-3 py-2 border-t border-gray-100">
        <button
          onClick={() => onAddRow(block.id)}
          className="text-xs text-gray-400 hover:text-accent transition-colors"
        >
          + Añadir fila
        </button>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function EntrenamientoDiaPage() {
  const { blockId, clientId, mesocycleId, dayId } = useParams<{
    blockId: string
    clientId: string
    mesocycleId: string
    dayId: string
  }>()
  const navigate = useNavigate()

  const {
    sectionBlocks, weekStatuses, loading, fetchDayDetail,
    createSectionBlock, updateSectionBlockName, updateBlockWeekSets, deleteSectionBlock,
    createExerciseRow, updateExerciseRow, updateWeekData, deleteExerciseRow,
    toggleWeekCompleted,
  } = useTrainingDayDetail()

  const [dayName, setDayName] = useState('')
  const [clientName, setClientName] = useState('')
  const [mesoName, setMesoName] = useState('')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [exporting, setExporting] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!dayId) return
    fetchDayDetail(dayId)
    supabase.from('training_days').select('name').eq('id', dayId).single()
      .then(({ data }) => setDayName(data?.name ?? ''))
    supabase.from('training_clients').select('full_name').eq('id', clientId).single()
      .then(({ data }) => setClientName(data?.full_name ?? ''))
    supabase.from('training_mesocycles').select('name').eq('id', mesocycleId).single()
      .then(({ data }) => setMesoName(data?.name ?? ''))
  }, [dayId])

  function handleSaveStart() {
    setSaveStatus('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
  }

  function handleSaveEnd(ok: boolean) {
    setSaveStatus(ok ? 'saved' : 'error')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => setSaveStatus('idle'), 2000)
  }

  async function handleAddBlock(section: Section) {
    if (!dayId) return
    const count = sectionBlocks.filter(b => b.section === section).length
    handleSaveStart()
    try {
      await createSectionBlock(dayId, section, `Bloque ${count + 1}`, count + 1)
      handleSaveEnd(true)
    } catch { handleSaveEnd(false) }
  }

  async function handleDeleteBlock(id: string) {
    handleSaveStart()
    try { await deleteSectionBlock(id); handleSaveEnd(true) }
    catch { handleSaveEnd(false) }
  }

  async function handleAddRow(bId: string) {
    const block = sectionBlocks.find(b => b.id === bId)
    if (!block) return
    handleSaveStart()
    try {
      await createExerciseRow(bId, block.rows.length + 1)
      handleSaveEnd(true)
    } catch { handleSaveEnd(false) }
  }

  async function handleDeleteRow(id: string) {
    handleSaveStart()
    try { await deleteExerciseRow(id); handleSaveEnd(true) }
    catch { handleSaveEnd(false) }
  }

  async function handleToggleWeek(section: Section, weekNumber: number, completed: boolean) {
    if (!dayId || !mesocycleId) return
    handleSaveStart()
    try {
      await toggleWeekCompleted(dayId, mesocycleId, section, weekNumber, completed)
      handleSaveEnd(true)
    } catch { handleSaveEnd(false) }
  }

  async function handleExport() {
    setExporting(true)
    try { await exportTrainingDay(dayName, sectionBlocks) }
    catch { /* errores de exportación no interrumpen la UI */ }
    finally { setExporting(false) }
  }

  const baseRoute = `/entrenamientos/bloques/${blockId}/clientes/${clientId}/mesociclos/${mesocycleId}`

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <main className="max-w-full px-4 sm:px-6 py-6 sm:py-8">

        {/* Cabecera */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <button
              onClick={() => navigate(`${baseRoute}/dias`)}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-1 block"
            >
              ← {mesoName || '…'}
            </button>
            <h1 className="text-xl font-semibold text-gray-900">{dayName || '…'}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{clientName}</p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0 mt-1">
            <button
              onClick={handleExport}
              disabled={exporting || loading || sectionBlocks.length === 0}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:border-accent hover:bg-accent/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {exporting ? 'Exportando...' : '↓ Exportar Excel'}
            </button>
            <div className="text-xs">
              {saveStatus === 'saving' && <span className="text-gray-400">Guardando...</span>}
              {saveStatus === 'saved'  && <span className="text-green-600">Guardado ✓</span>}
              {saveStatus === 'error'  && <span className="text-red-500">Error al guardar</span>}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {SECTIONS.map(({ key, label, headerClass }) => {
              const blocksInSection = sectionBlocks.filter(b => b.section === key)
              const sectionWeekStatuses = weekStatuses.filter(s => s.section === key)
              const headerFields = key === 'metabolic' ? HEADER_FIELDS_METABOLIC : HEADER_FIELDS_NORMAL

              return (
                <div key={key}>
                  <div className={`rounded-t-xl px-4 py-2 ${headerClass}`}>
                    <span className="font-semibold text-sm uppercase tracking-wide">{label}</span>
                  </div>

                  <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 p-4 space-y-4">
                    {blocksInSection.length === 0 && (
                      <p className="text-sm text-gray-300 text-center py-4">Sin bloques</p>
                    )}

                    {blocksInSection.map(block => (
                      <SectionBlockComponent
                        key={block.id}
                        block={block}
                        section={key}
                        weekStatuses={sectionWeekStatuses}
                        onUpdateBlockName={updateSectionBlockName}
                        onUpdateBlockSets={updateBlockWeekSets}
                        onDeleteBlock={handleDeleteBlock}
                        onAddRow={handleAddRow}
                        onDeleteRow={handleDeleteRow}
                        onUpdateField={updateExerciseRow}
                        onUpdateWeek={updateWeekData}
                        onToggleWeek={(w, completed) => handleToggleWeek(key, w, completed)}
                        onSaveStart={handleSaveStart}
                        onSaveEnd={handleSaveEnd}
                      />
                    ))}

                    {/* Total kg movidos — solo sección principal */}
                    {key === 'main' && blocksInSection.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs table-fixed">
                          <TrainingColGroup section="main" />
                          <tbody>
                            <tr className="bg-red-900 text-white">
                              <td className="px-3 py-1.5 font-semibold" colSpan={3}>Total kg movidos</td>
                              {WEEKS.map(w =>
                                headerFields.map((campo, i) => (
                                  <td
                                    key={`total-${w}-${campo}`}
                                    className={`px-1 py-1.5 text-center min-w-[40px] ${i === 0 ? 'border-l-2 border-red-700' : ''}`}
                                  >
                                    {campo === 'reps' || campo === 'watts' ? totalKgCell(blocksInSection, w) : ''}
                                  </td>
                                ))
                              )}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}

                    <button
                      onClick={() => handleAddBlock(key)}
                      className="text-sm text-gray-400 hover:text-accent transition-colors border border-dashed border-gray-200 hover:border-accent rounded-lg w-full py-2"
                    >
                      + Añadir bloque
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
