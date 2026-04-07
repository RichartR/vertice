import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type TrainingDay = {
  id: string
  name: string
  order_index: number
  mesocycle_id: string
  created_at: string
}

export function useTrainingDays(mesocycleId: string) {
  const [days, setDays] = useState<TrainingDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDays = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('training_days')
      .select('id, name, order_index, mesocycle_id, created_at')
      .eq('mesocycle_id', mesocycleId)
      .order('order_index', { ascending: true })

    if (err) { setError(err.message); setLoading(false); return }

    setDays(data ?? [])
    setLoading(false)
  }, [mesocycleId])

  useEffect(() => { fetchDays() }, [fetchDays])

  async function getDayCount(): Promise<number> {
    const { count } = await supabase
      .from('training_days')
      .select('id', { count: 'exact', head: true })
      .eq('mesocycle_id', mesocycleId)

    return count ?? 0
  }

  async function createDay(name: string, orderIndex: number) {
    const { error: err } = await supabase
      .from('training_days')
      .insert({ name, order_index: orderIndex, mesocycle_id: mesocycleId })

    if (err) throw new Error(err.message)
    await fetchDays()
  }

  async function deleteDay(id: string) {
    const { error: err } = await supabase.from('training_days').delete().eq('id', id)
    if (err) throw new Error(err.message)
    await fetchDays()
  }

  return { days, loading, error, fetchDays, createDay, getDayCount, deleteDay }
}
