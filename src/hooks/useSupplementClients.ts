import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type SupplementClient = {
  id: string
  full_name: string
  phone: string | null
  notes: string | null
  total_sales: number
  active: boolean
}

export function useSupplementClients() {
  const [clients, setClients] = useState<SupplementClient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchClients = useCallback(async (search?: string, includeArchived = false) => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('supplement_clients')
        .select(`
          *,
          supplement_sales(count)
        `)
      
      if (!includeArchived) {
        query = query.eq('active', true)
      }

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`)
      }

      query = query.order('full_name', { ascending: true })

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      const mapped: SupplementClient[] = (data || []).map((row: any) => ({
        id: row.id,
        full_name: row.full_name,
        phone: row.phone,
        notes: row.notes,
        total_sales: row.supplement_sales?.[0]?.count ?? 0,
        active: row.active ?? true
      }))

      setClients(mapped)
      return mapped
    } catch (err: any) {
      console.error('Error fetching supplement clients:', err)
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createClient = useCallback(async (fullName: string, phone?: string, notes?: string) => {
    try {
      const { data, error: err } = await supabase
        .from('supplement_clients')
        .insert({ full_name: fullName, phone, notes, active: true })
        .select()
        .single()
      if (err) throw err
      await fetchClients() 
      return data
    } catch (err: any) {
      console.error('Error creating client:', err)
      throw err
    }
  }, [fetchClients])

  const updateClient = useCallback(async (id: string, data: { full_name?: string; phone?: string; notes?: string; active?: boolean }) => {
    try {
      const { error: err } = await supabase
        .from('supplement_clients')
        .update(data)
        .eq('id', id)
      if (err) throw err
      await fetchClients()
    } catch (err: any) {
      console.error('Error updating client:', err)
      throw err
    }
  }, [fetchClients])

  const deleteClient = useCallback(async (client: SupplementClient) => {
    try {
      if (client.total_sales > 0) {
        // Soft delete (archive)
        const { error: err } = await supabase
          .from('supplement_clients')
          .update({ active: false })
          .eq('id', client.id)
        if (err) throw err
      } else {
        // Physical delete
        const { error: err } = await supabase
          .from('supplement_clients')
          .delete()
          .eq('id', client.id)
        if (err) throw err
      }
      await fetchClients()
    } catch (err: any) {
      console.error('Error deleting client:', err)
      throw err
    }
  }, [fetchClients])

  const activateClient = useCallback(async (id: string) => {
    try {
      const { error: err } = await supabase
        .from('supplement_clients')
        .update({ active: true })
        .eq('id', id)
      if (err) throw err
      await fetchClients(undefined, true) // Refresh showing all to maintain view
    } catch (err: any) {
      console.error('Error activating client:', err)
      throw err
    }
  }, [fetchClients])

  return {
    clients,
    loading,
    error,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    activateClient
  }
}
