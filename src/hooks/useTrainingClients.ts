import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type TrainingClient = {
  id: string
  full_name: string
  created_at: string
  mesocycle_count: number
}

export function useTrainingClients(blockId: string) {
  const [clients, setClients] = useState<TrainingClient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    setError(null)

    // JOIN training_block_clients → training_clients para obtener clientes del bloque
    const { data: blockClients, error: e1 } = await supabase
      .from('training_block_clients')
      .select('client_id, training_clients ( id, full_name, created_at )')
      .eq('block_id', blockId)

    if (e1) { setError(e1.message); setLoading(false); return }

    const clientIds = (blockClients ?? [])
      .map((bc: any) => bc.client_id)
      .filter(Boolean)

    // COUNT de mesociclos por cliente en este bloque
    let mesoCounts: Record<string, number> = {}
    if (clientIds.length > 0) {
      const { data: mesoData } = await supabase
        .from('training_mesocycles')
        .select('client_id')
        .eq('block_id', blockId)
        .in('client_id', clientIds)

      ;(mesoData ?? []).forEach((m: any) => {
        mesoCounts[m.client_id] = (mesoCounts[m.client_id] ?? 0) + 1
      })
    }

    const mapped: TrainingClient[] = (blockClients ?? [])
      .filter((bc: any) => bc.training_clients)
      .map((bc: any) => ({
        id: bc.training_clients.id,
        full_name: bc.training_clients.full_name,
        created_at: bc.training_clients.created_at,
        mesocycle_count: mesoCounts[bc.training_clients.id] ?? 0,
      }))
      .sort((a: TrainingClient, b: TrainingClient) =>
        a.full_name.localeCompare(b.full_name)
      )

    setClients(mapped)
    setLoading(false)
  }, [blockId])

  useEffect(() => { fetchClients() }, [fetchClients])

  async function createClient(fullName: string) {
    // INSERT en training_clients
    const { data, error: e1 } = await supabase
      .from('training_clients')
      .insert({ full_name: fullName })
      .select('id')
      .single()

    if (e1) throw new Error(e1.message)

    // Asociar al bloque
    const { error: e2 } = await supabase
      .from('training_block_clients')
      .insert({ client_id: data.id, block_id: blockId })

    if (e2) throw new Error(e2.message)

    await fetchClients()
  }

  return { clients, loading, error, fetchClients, createClient }
}
