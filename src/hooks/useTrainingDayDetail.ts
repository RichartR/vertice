import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { SectionBlock, ExerciseRow, WeekStatus } from '../utils/trainingUtils'

export type { SectionBlock, ExerciseRow, WeekStatus }

export function useTrainingDayDetail() {
  const [sectionBlocks, setSectionBlocks] = useState<SectionBlock[]>([])
  const [weekStatuses, setWeekStatuses] = useState<WeekStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDayDetail = useCallback(async (dayId: string) => {
    setLoading(true)
    setError(null)

    // 1. Obtener sub-bloques del día (incluye week_sets compartidos)
    const { data: blocks, error: e1 } = await supabase
      .from('training_section_blocks')
      .select('id, day_id, section, name, order_index, week_sets')
      .eq('day_id', dayId)
      .order('section')
      .order('order_index')

    if (e1) { setError(e1.message); setLoading(false); return }

    // 2. Obtener filas de ejercicio de todos los sub-bloques
    const blockIds = (blocks ?? []).map((b: any) => b.id)
    let rowsData: any[] = []
    if (blockIds.length > 0) {
      const { data: rows, error: e2 } = await supabase
        .from('exercise_rows')
        .select('id, section_block_id, order_index, exercise, notes, weeks')
        .in('section_block_id', blockIds)
        .order('order_index')

      if (e2) { setError(e2.message); setLoading(false); return }
      rowsData = rows ?? []
    }

    // 3. Obtener estados de semanas
    const { data: statuses, error: e3 } = await supabase
      .from('training_week_status')
      .select('id, day_id, mesocycle_id, week_number, section, completed')
      .eq('day_id', dayId)

    if (e3) { setError(e3.message); setLoading(false); return }

    // Montar árbol: sub-bloque → filas
    const mapped: SectionBlock[] = (blocks ?? []).map((b: any) => ({
      id: b.id,
      day_id: b.day_id,
      section: b.section,
      name: b.name,
      order_index: b.order_index,
      week_sets: b.week_sets ?? {},
      rows: rowsData
        .filter((r: any) => r.section_block_id === b.id)
        .map((r: any) => ({
          id: r.id,
          section_block_id: r.section_block_id,
          order_index: r.order_index,
          exercise: r.exercise ?? '',
          notes: r.notes ?? '',
          weeks: r.weeks ?? {},
        })),
    }))

    setSectionBlocks(mapped)
    setWeekStatuses(statuses ?? [])
    setLoading(false)
  }, [])

  // --- Sub-bloques ---

  async function createSectionBlock(dayId: string, section: string, name: string, orderIndex: number) {
    const { data, error: err } = await supabase
      .from('training_section_blocks')
      .insert({ day_id: dayId, section, name, order_index: orderIndex, week_sets: {} })
      .select('id, day_id, section, name, order_index, week_sets')
      .single()

    if (err) throw new Error(err.message)

    const newBlock: SectionBlock = { ...data, week_sets: data.week_sets ?? {}, rows: [] }
    setSectionBlocks(prev => [...prev, newBlock])
  }

  async function updateSectionBlockName(id: string, name: string) {
    const { error: err } = await supabase
      .from('training_section_blocks')
      .update({ name })
      .eq('id', id)

    if (err) throw new Error(err.message)

    setSectionBlocks(prev => prev.map(b => b.id === id ? { ...b, name } : b))
  }

  async function updateBlockWeekSets(blockId: string, weekNumber: number, value: string) {
    // Actualizar optimistamente el estado local
    setSectionBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b
      const weekKey = String(weekNumber)
      const newWeekSets = { ...b.week_sets }
      if (value === '') {
        delete newWeekSets[weekKey]
      } else {
        newWeekSets[weekKey] = value
      }
      return { ...b, week_sets: newWeekSets }
    }))

    // Persistir: leer el valor actual y hacer merge
    const { data: current } = await supabase
      .from('training_section_blocks')
      .select('week_sets')
      .eq('id', blockId)
      .single()

    const currentSets = (current?.week_sets ?? {}) as Record<string, string>
    const weekKey = String(weekNumber)
    const newSets = { ...currentSets }
    if (value === '') {
      delete newSets[weekKey]
    } else {
      newSets[weekKey] = value
    }

    await supabase
      .from('training_section_blocks')
      .update({ week_sets: newSets })
      .eq('id', blockId)
  }

  async function deleteSectionBlock(id: string) {
    const { error: err } = await supabase
      .from('training_section_blocks')
      .delete()
      .eq('id', id)

    if (err) throw new Error(err.message)

    setSectionBlocks(prev => prev.filter(b => b.id !== id))
  }

  // --- Filas de ejercicio ---

  async function createExerciseRow(sectionBlockId: string, orderIndex: number) {
    const { data, error: err } = await supabase
      .from('exercise_rows')
      .insert({ section_block_id: sectionBlockId, order_index: orderIndex, weeks: {} })
      .select('id, section_block_id, order_index, exercise, notes, weeks')
      .single()

    if (err) throw new Error(err.message)

    const newRow: ExerciseRow = {
      id: data.id,
      section_block_id: data.section_block_id,
      order_index: data.order_index,
      exercise: data.exercise ?? '',
      notes: data.notes ?? '',
      weeks: data.weeks ?? {},
    }

    setSectionBlocks(prev =>
      prev.map(b => b.id === sectionBlockId ? { ...b, rows: [...b.rows, newRow] } : b)
    )
  }

  async function updateExerciseRow(id: string, field: 'exercise' | 'notes', value: string) {
    const { error: err } = await supabase
      .from('exercise_rows')
      .update({ [field]: value })
      .eq('id', id)

    if (err) throw new Error(err.message)

    setSectionBlocks(prev =>
      prev.map(b => ({
        ...b,
        rows: b.rows.map(r => r.id === id ? { ...r, [field]: value } : r),
      }))
    )
  }

  async function updateWeekData(id: string, weekNumber: number, campo: string, valor: string) {
    // Actualizar estado local optimistamente
    setSectionBlocks(prev => prev.map(b => ({
      ...b,
      rows: b.rows.map(r => {
        if (r.id !== id) return r
        const weekKey = String(weekNumber)
        const currentWeek = { ...(r.weeks[weekKey] ?? {}) } as Record<string, string>
        if (valor === '') {
          delete currentWeek[campo]
        } else {
          currentWeek[campo] = valor
        }
        const newWeeks = { ...r.weeks }
        if (Object.keys(currentWeek).length === 0) {
          delete newWeeks[weekKey]
        } else {
          newWeeks[weekKey] = currentWeek
        }
        return { ...r, weeks: newWeeks }
      }),
    })))

    // Persistir con merge
    const { data: current } = await supabase
      .from('exercise_rows')
      .select('weeks')
      .eq('id', id)
      .single()

    const currentWeeks = (current?.weeks ?? {}) as Record<string, Record<string, string>>
    const weekKey = String(weekNumber)
    const weekObj = { ...(currentWeeks[weekKey] ?? {}) }
    if (valor === '') {
      delete weekObj[campo]
    } else {
      weekObj[campo] = valor
    }
    const newWeeks = { ...currentWeeks }
    if (Object.keys(weekObj).length === 0) {
      delete newWeeks[weekKey]
    } else {
      newWeeks[weekKey] = weekObj
    }

    await supabase.from('exercise_rows').update({ weeks: newWeeks }).eq('id', id)
  }

  async function deleteExerciseRow(id: string) {
    const { error: err } = await supabase
      .from('exercise_rows')
      .delete()
      .eq('id', id)

    if (err) throw new Error(err.message)

    setSectionBlocks(prev =>
      prev.map(b => ({ ...b, rows: b.rows.filter(r => r.id !== id) }))
    )
  }

  async function toggleWeekCompleted(
    dayId: string,
    mesocycleId: string,
    section: string,
    weekNumber: number,
    completed: boolean
  ) {
    const { error: err } = await supabase
      .from('training_week_status')
      .upsert(
        { day_id: dayId, mesocycle_id: mesocycleId, section, week_number: weekNumber, completed },
        { onConflict: 'day_id,week_number,section' }
      )

    if (err) throw new Error(err.message)

    setWeekStatuses(prev => {
      const exists = prev.find(s => s.day_id === dayId && s.week_number === weekNumber && s.section === section)
      if (exists) {
        return prev.map(s =>
          s.day_id === dayId && s.week_number === weekNumber && s.section === section ? { ...s, completed } : s
        )
      }
      return [...prev, { id: '', day_id: dayId, mesocycle_id: mesocycleId, section, week_number: weekNumber, completed }]
    })
  }

  return {
    sectionBlocks,
    weekStatuses,
    loading,
    error,
    fetchDayDetail,
    createSectionBlock,
    updateSectionBlockName,
    updateBlockWeekSets,
    deleteSectionBlock,
    createExerciseRow,
    updateExerciseRow,
    updateWeekData,
    deleteExerciseRow,
    toggleWeekCompleted,
  }
}
