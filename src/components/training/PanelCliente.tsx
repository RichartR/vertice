import { useEffect, useState } from 'react'
import { useTrainingDayDetail } from '../../hooks/useTrainingDayDetail'
import type { SectionBlock } from '../../utils/trainingUtils'
import { calcularTotalKgMovidos } from '../../utils/trainingUtils'
import EditableBlockTable from './EditableBlockTable'

// Vista de solo lectura — no se puede editar ni completar semanas desde la sesión.

type Section = 'warmup' | 'main' | 'metabolic'

// Mismos colores que en EntrenamientoDiaPage para consistencia visual
const SECTIONS: { key: Section; label: string; activeClass: string; headerBg: string }[] = [
  { key: 'warmup',    label: 'Calentamiento', activeClass: 'bg-gray-200 text-gray-800',   headerBg: 'bg-gray-200' },
  { key: 'main',      label: 'Principal',     activeClass: 'bg-red-200 text-red-900',     headerBg: 'bg-red-200'  },
  { key: 'metabolic', label: 'Metabólico',    activeClass: 'bg-green-200 text-green-900', headerBg: 'bg-green-200'},
]

// ─── Total Kg Movidos (varios sub-bloques) ────────────────────────────────────

function TotalKgRow({ blocks, lastCompleted, nextWeek }: Readonly<{
  blocks: SectionBlock[]
  lastCompleted: number
  nextWeek: number
}>) {
  const formatKg = (week: number) => {
    const val = calcularTotalKgMovidos(blocks, week)
    if (val === null) return '—'
    return `${val.toFixed(1)} KG`
  }

  return (
    <div className="rounded-lg border border-red-900/50 overflow-hidden mt-2 text-xs font-medium">
      <table className="w-full" style={{ tableLayout: 'fixed' }}>
        <tbody className="bg-red-900 text-white">
          <tr>
            <td className="px-1.5 py-1 text-left">Total Kg Mov.</td>
            {lastCompleted > 0 && (
              <td className="py-1 text-center" colSpan={5}>
                {formatKg(lastCompleted)}
              </td>
            )}
            <td className="py-1 text-center" colSpan={5}>
              {formatKg(nextWeek)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// ─── Panel principal ──────────────────────────────────────────────────────────

type PanelClienteProps = {
  clientName: string
  dayId: string
}

export default function PanelCliente({ clientName, dayId }: Readonly<PanelClienteProps>) {
  const { 
    sectionBlocks, 
    weekStatuses, 
    loading, 
    fetchDayDetail, 
    updateWeekData, 
    updateBlockWeekSets 
  } = useTrainingDayDetail()

  const [activeSection, setActiveSection] = useState<Section>('warmup')

  useEffect(() => {
    fetchDayDetail(dayId)
  }, [dayId, fetchDayDetail])

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
                <EditableBlockTable
                  key={block.id}
                  block={block}
                  lastCompletedWeek={lastCompleted}
                  currentWeek={nextWeek}
                  section={activeSection}
                  onUpdateWeekData={updateWeekData}
                  onUpdateBlockWeekSets={updateBlockWeekSets}
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
