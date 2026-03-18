import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type TrainingBlock = {
  id: string
  name: string
  employee_id: string
  employee_name: string
  client_count: number
  created_at: string
}

export function useTrainingBlocks() {
  const [blocks, setBlocks] = useState<TrainingBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBlocks = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('training_blocks')
      .select(`
        id,
        name,
        employee_id,
        created_at,
        profiles:employee_id ( full_name ),
        training_block_clients ( count )
      `)
      .order('created_at', { ascending: false })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    const mapped: TrainingBlock[] = (data ?? []).map((b: any) => ({
      id: b.id,
      name: b.name,
      employee_id: b.employee_id,
      employee_name: b.profiles?.full_name ?? '—',
      client_count: b.training_block_clients?.[0]?.count ?? 0,
      created_at: b.created_at,
    }))

    setBlocks(mapped)
    setLoading(false)
  }, [])

  useEffect(() => { fetchBlocks() }, [fetchBlocks])

  async function createBlock(name: string, employeeId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    const { error: err } = await supabase.from('training_blocks').insert({
      name,
      employee_id: employeeId,
      created_by: user?.id,
    })
    if (err) throw new Error(err.message)
    await fetchBlocks()
  }

  return { blocks, loading, error, fetchBlocks, createBlock }
}
