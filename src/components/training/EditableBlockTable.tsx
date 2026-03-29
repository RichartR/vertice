import React, { useCallback, useState } from 'react'
import type { SectionBlock } from '../../utils/trainingUtils'
import { useDebounce } from '../../hooks/useDebounce'
import { calcularKgMovidos } from '../../utils/trainingUtils'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
export type Section = 'warmup' | 'main' | 'metabolic'

const ROW_AFTER_SETS_NORMAL = ['reps', 'kg', 'r']
const ROW_AFTER_SETS_METABOLIC = ['watts', 'kg', 'r']

type WeekData = {
  ce?: string
  sets?: string
  reps?: string
  watts?: string
  kg?: string
  r?: string
}

type EditableBlockTableProps = {
  block: SectionBlock
  lastCompletedWeek: number
  currentWeek: number
  section: Section
  onUpdateWeekData: (rowId: string, week: number, field: string, value: string) => Promise<void>
  onUpdateBlockWeekSets: (blockId: string, week: number, value: string) => Promise<void>
}

const StatusIndicator = React.memo(function StatusIndicator({ status }: { status: SaveStatus }) {
  switch (status) {
    case 'saving':
      return <span className="text-gray-400">Guardando...</span>
    case 'saved':
      return <span className="text-green-500">Guardado ✓</span>
    case 'error':
      return <span className="text-red-500">Error</span>
    default:
      return null
  }
})

export default function EditableBlockTable({
  block, lastCompletedWeek, currentWeek, section, onUpdateWeekData, onUpdateBlockWeekSets
}: Readonly<EditableBlockTableProps>) {
  const afterSetsFields = section === 'metabolic' ? ROW_AFTER_SETS_METABOLIC : ROW_AFTER_SETS_NORMAL
  const isMain = section === 'main'
  
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [setsValue, setSetsValue] = useState(block.week_sets[String(currentWeek)] ?? '')
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const setsInputRef = React.useRef<HTMLInputElement>(null)

  const handleSaveStart = useCallback(() => {
    setSaveStatus('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
  }, [])

  const handleSaveEnd = useCallback((ok: boolean) => {
    setSaveStatus(ok ? 'saved' : 'error')
    saveTimer.current = setTimeout(() => setSaveStatus('idle'), 1500)
  }, [])

  // Sincroniza el estado interno si las props cambian
  React.useEffect(() => {
    setSetsValue(block.week_sets[String(currentWeek)] ?? '')
  }, [currentWeek, block.week_sets])

  const debouncedWeekUpdate = useDebounce(
    useCallback(async (rowId: string, field: string, value: string) => {
      handleSaveStart()
      try {
        await onUpdateWeekData(rowId, currentWeek, field, value)
        handleSaveEnd(true)
      } catch {
        handleSaveEnd(false)
      }
    }, [onUpdateWeekData, currentWeek, handleSaveStart, handleSaveEnd]),
    800
  )
  
  const debouncedSetsUpdate = useDebounce(
    useCallback(async (value: string) => {
      handleSaveStart()
      try {
        await onUpdateBlockWeekSets(block.id, currentWeek, value)
        handleSaveEnd(true)
      } catch {
        handleSaveEnd(false)
      }
    }, [onUpdateBlockWeekSets, block.id, currentWeek, handleSaveStart, handleSaveEnd]),
    800
  )

  const handleSetsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSetsValue(e.target.value)
    debouncedSetsUpdate(e.target.value)
  }

  const kgMovidos = (week: number): string => {
    if (!isMain) return ''
    const sets = week === currentWeek ? setsValue : (block.week_sets[String(week)] ?? '')
    const kg = calcularKgMovidos(block.rows, week, sets)
    return kg === null ? '—' : kg.toFixed(1)
  }

  const renderKgMovidos = () => {
    if (lastCompletedWeek > 0) {
      return { last: kgMovidos(lastCompletedWeek), current: kgMovidos(currentWeek) }
    }
    return { last: null, current: kgMovidos(currentWeek) }
  }
  
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden mb-3">
      <div className="bg-gray-50 px-2 py-1.5 flex justify-between items-center text-xs font-semibold text-gray-700 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span>{block.name}</span>
        </div>
        <div className="text-xs h-4"><StatusIndicator status={saveStatus} /></div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-center text-gray-600 font-semibold">
              <th className="px-1.5 py-1"></th>
              {lastCompletedWeek > 0 && (
                <th colSpan={afterSetsFields.length + 2} className="py-1">
                  Semana {lastCompletedWeek}
                </th>
              )}
              <th 
                colSpan={afterSetsFields.length + 2} 
                className={`py-1 ${lastCompletedWeek > 0 ? 'border-l-2 border-gray-300' : ''}`}
              >
                Semana {currentWeek}
              </th>
            </tr>
            <tr className="border-b border-gray-100 bg-gray-50 text-center text-gray-400">
              <th className="px-1.5 py-1 text-left w-[80px]">Ejercicio</th>
              {lastCompletedWeek > 0 && (
                <>
                  <th className="px-0.5 py-0.5 w-[10%]">CE</th>
                  <th className="px-0.5 py-0.5 w-[10%]">Sets</th>
                  {afterSetsFields.map(f => <th key={`prev-${f}`} className="px-0.5 py-0.5 uppercase text-[10px] w-[10%]">{f === 'watts' ? 'W' : f}</th>)}
                </>
              )}
              <th className="px-0.5 py-0.5 border-l-2 border-gray-300 w-[10%]">CE</th>
              <th className="px-0.5 py-0.5 w-[10%]">Sets</th>
              {afterSetsFields.map(f => {
                return (
                  <th key={f} className="px-0.5 py-0.5 uppercase text-[10px] w-[10%]">
                    {f === 'watts' ? 'W' : f}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, idx) => {
              const isFirst = idx === 0
              const currentWeekData: WeekData = row.weeks[String(currentWeek)] ?? {}
              const lastWeekData: WeekData = row.weeks[String(lastCompletedWeek)] ?? {}

              return (
                <tr key={row.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-1.5 py-1 text-gray-700 max-w-[80px] truncate" title={row.exercise ?? undefined}>
                    {row.exercise || '—'}
                  </td>

                  {/* Semana Anterior (solo lectura) */}
                  {lastCompletedWeek > 0 && (
                    <>
                      <td className="px-0.5 py-1 text-center"><input type="text" readOnly value={lastWeekData['ce'] ?? ''} className="w-full text-xs text-center bg-green-100/70 border-0 outline-none rounded py-0.5" /></td>
                      {isFirst && <td className="px-0.5 py-1 text-center align-middle bg-green-100/70" rowSpan={block.rows.length}><input type="text" readOnly value={block.week_sets[String(lastCompletedWeek)] ?? ''} className="w-full text-xs text-center font-medium bg-transparent border-0 outline-none rounded py-0.5" /></td>}
                      {afterSetsFields.map((field) => (
                        <td key={`prev-${field}`} className="px-0.5 py-1 text-center"><input type="text" readOnly value={lastWeekData[field as keyof WeekData] ?? ''} className="w-full text-xs text-center bg-green-100/70 border-0 outline-none rounded py-0.5" /></td>
                      ))}
                    </>
                  )}

                  {/* Semana Actual (editable) */}
                  <td className="px-0.5 py-1 text-center border-l-2 border-gray-300">
                    <input
                      type="text"
                      defaultValue={currentWeekData['ce'] ?? ''}
                      onChange={e => debouncedWeekUpdate(row.id, 'ce', e.target.value)}
                      className="w-full text-xs text-center bg-gray-50 border-0 outline-none focus:bg-white focus:ring-1 focus:ring-accent rounded py-0.5"
                    />
                  </td>

                  {isFirst && (
                    <td 
                      className="px-0.5 py-1 text-center align-middle bg-gray-50 cursor-text" 
                      rowSpan={block.rows.length}
                      onClick={() => setsInputRef.current?.focus()}
                    >
                      <input
                        ref={setsInputRef}
                        type="text"
                        value={setsValue}
                        onChange={handleSetsChange}
                        className="w-full text-xs text-center font-medium bg-transparent border-0 outline-none focus:bg-white focus:ring-1 focus:ring-accent rounded py-0.5"
                      />
                    </td>
                  )}

                  {afterSetsFields.map(field => (
                    <td key={field} className="px-0.5 py-1 text-center">
                      <input
                        type="text"
                        defaultValue={currentWeekData[field as keyof WeekData] ?? ''}
                        onChange={e => debouncedWeekUpdate(row.id, field, e.target.value)}
                        className="w-full text-xs text-center bg-gray-50 border-0 outline-none focus:bg-white focus:ring-1 focus:ring-accent rounded py-0.5"
                      />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
          {isMain && block.rows.length > 0 && (
            <tfoot className="bg-red-900 text-white font-medium">
              <tr>
                <td className="px-1.5 py-1 text-left" colSpan={1}>Kg Mov.</td>
                {lastCompletedWeek > 0 && (
                  <td colSpan={afterSetsFields.length + 2} className="py-1 text-center">
                    {renderKgMovidos().last === '—' ? '—' : `${renderKgMovidos().last} KG`}
                  </td>
                )}
                <td 
                  colSpan={afterSetsFields.length + 2} 
                  className={`py-1 text-center`}
                >
                  {renderKgMovidos().current === '—' ? '—' : `${renderKgMovidos().current} KG`}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

    </div>
  )
}
