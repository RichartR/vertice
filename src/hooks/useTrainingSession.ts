// Hook para gestionar la sesión de entrenamiento.
// Obtiene clientes del bloque seleccionado con sus mesociclos y días.
import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'

export type SessionDay = {
  id: string
  name: string
  order_index: number
}

export type SessionMesocycle = {
  id: string
  name: string
  number: number
  days: SessionDay[]
}

export type SessionClientData = {
  id: string
  full_name: string
  mesocycles: SessionMesocycle[]
}

export function useTrainingSession() {
  const [clients, setClients] = useState<SessionClientData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchActiveData = useCallback(async (blockId: string) => {
    setLoading(true)
    setError(null)

    // 1. Clientes del bloque
    const { data: blockClients, error: e1 } = await supabase
      .from('training_block_clients')
      .select('client_id, training_clients(id, full_name)')
      .eq('block_id', blockId)

    if (e1) { setError(e1.message); setLoading(false); return }

    const clientIds = (blockClients ?? [])
      .map((bc: any) => bc.training_clients?.id)
      .filter(Boolean)

    if (clientIds.length === 0) {
      setClients([])
      setLoading(false)
      return
    }

    // 2. Mesociclos de cada cliente (con sus días), ordenados por número desc (el más reciente primero)
    const { data: mesoData, error: e2 } = await supabase
      .from('training_mesocycles')
      .select('id, name, number, client_id, training_days(id, name, order_index)')
      .eq('block_id', blockId)
      .in('client_id', clientIds)
      .order('number', { ascending: false })

    if (e2) { setError(e2.message); setLoading(false); return }

    const mapped: SessionClientData[] = (blockClients ?? [])
      .filter((bc: any) => bc.training_clients)
      .map((bc: any) => {
        const c = bc.training_clients
        const mesos: SessionMesocycle[] = (mesoData ?? [])
          .filter((m: any) => m.client_id === c.id)
          .map((m: any) => ({
            id: m.id,
            name: m.name,
            number: m.number,
            days: ((m.training_days ?? []) as any[])
              .map((d: any) => ({ id: d.id, name: d.name, order_index: d.order_index }))
              .sort((a, b) => a.order_index - b.order_index),
          }))
        return { id: c.id, full_name: c.full_name, mesocycles: mesos }
      })
      .sort((a, b) => a.full_name.localeCompare(b.full_name))

    setClients(mapped)
    setLoading(false)
  }, [])

  return { clients, loading, error, fetchActiveData }
}
