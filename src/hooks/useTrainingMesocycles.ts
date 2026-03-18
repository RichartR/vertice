import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type TrainingMesocycle = {
  id: string
  name: string
  number: number
  start_date: string
  end_date: string
  created_at: string
  day_count: number
}

export function useTrainingMesocycles(clientId: string, blockId: string) {
  const [mesocycles, setMesocycles] = useState<TrainingMesocycle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMesocycles = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('training_mesocycles')
      .select('id, name, number, start_date, end_date, created_at, training_days ( count )')
      .eq('client_id', clientId)
      .eq('block_id', blockId)
      .order('number', { ascending: false })

    if (err) { setError(err.message); setLoading(false); return }

    const mapped: TrainingMesocycle[] = (data ?? []).map((m: any) => ({
      id: m.id,
      name: m.name,
      number: m.number,
      start_date: m.start_date,
      end_date: m.end_date,
      created_at: m.created_at,
      day_count: m.training_days?.[0]?.count ?? 0,
    }))

    setMesocycles(mapped)
    setLoading(false)
  }, [clientId, blockId])

  useEffect(() => { fetchMesocycles() }, [fetchMesocycles])

  async function getNextNumber(): Promise<number> {
    const { data } = await supabase
      .from('training_mesocycles')
      .select('number')
      .eq('client_id', clientId)
      .eq('block_id', blockId)
      .order('number', { ascending: false })
      .limit(1)
      .maybeSingle()

    return (data?.number ?? 0) + 1
  }

  async function createMesocycle(name: string, startDate: string, endDate: string) {
    const number = await getNextNumber()
    const { error: err } = await supabase
      .from('training_mesocycles')
      .insert({ name, number, start_date: startDate, end_date: endDate, client_id: clientId, block_id: blockId })

    if (err) throw new Error(err.message)
    await fetchMesocycles()
  }

  return { mesocycles, loading, error, fetchMesocycles, createMesocycle, getNextNumber }
}
