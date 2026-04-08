import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type SaleLine = {
  id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export type Sale = {
  id: string
  client_id: string | null
  client_name: string | null
  sale_date: string
  payment_method: 'efectivo' | 'tarjeta' | 'biz_um' | 'bizum' 
  notes: string | null
  total: number
  lines?: SaleLine[]
}

export type SaleFilters = {
  dateFrom?: string
  dateTo?: string
  clientId?: string
  paymentMethod?: string
}

export function useSupplementSales() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSales = useCallback(async (filters?: SaleFilters) => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('supplement_sales')
        .select(`
          *,
          supplement_clients(full_name),
          supplement_sale_lines(
            *,
            supplement_products(product, flavor)
          )
        `)
        .order('sale_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (filters?.dateFrom) query = query.gte('sale_date', filters.dateFrom)
      if (filters?.dateTo) query = query.lte('sale_date', filters.dateTo)
      if (filters?.clientId) query = query.eq('client_id', filters.clientId)
      if (filters?.paymentMethod) query = query.eq('payment_method', filters.paymentMethod)

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      const mapped: Sale[] = (data || []).map((row: any) => {
        let total = 0
        const lines: SaleLine[] = (row.supplement_sale_lines || []).map((l: any) => {
          const subtotal = (l.quantity || 0) * (l.unit_price || 0)
          total += subtotal
          return {
            id: l.id,
            product_id: l.product_id,
            product_name: `${l.supplement_products?.product ?? 'Desconocido'}${l.supplement_products?.flavor ? ` (${l.supplement_products.flavor})` : ''}`,
            quantity: l.quantity,
            unit_price: l.unit_price,
            subtotal
          }
        })

        return {
          id: row.id,
          client_id: row.client_id,
          client_name: row.supplement_clients?.full_name ?? null,
          sale_date: row.sale_date,
          payment_method: row.payment_method,
          notes: row.notes,
          total,
          lines
        }
      })

      setSales(mapped)
      return mapped
    } catch (err: any) {
      console.error('Error fetching supplement sales:', err)
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSaleDetail = useCallback(async (saleId: string) => {
    setLoading(true)
    try {
      const { data, error: err } = await supabase
        .from('supplement_sales')
        .select(`
          *,
          supplement_clients(full_name),
          supplement_sale_lines(
            *,
            supplement_products(product, flavor)
          )
        `)
        .eq('id', saleId)
        .single()

      if (err) throw err

      let total = 0
      const lines: SaleLine[] = (data.supplement_sale_lines || []).map((l: any) => {
        const subtotal = (l.quantity || 0) * (l.unit_price || 0)
        total += subtotal
        return {
          id: l.id,
          product_id: l.product_id,
          product_name: `${l.supplement_products?.product ?? 'Desconocido'}${l.supplement_products?.flavor ? ` (${l.supplement_products.flavor})` : ''}`,
          quantity: l.quantity,
          unit_price: l.unit_price,
          subtotal
        }
      })

      return {
        id: data.id,
        client_id: data.client_id,
        client_name: data.supplement_clients?.full_name ?? null,
        sale_date: data.sale_date,
        payment_method: data.payment_method,
        notes: data.notes,
        total,
        lines
      }
    } catch (err: any) {
      console.error('Error fetching sale detail:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createSale = useCallback(async (data: {
    clientId: string | null,
    saleDate: string,
    paymentMethod: string,
    notes?: string,
    lines: Array<{ productId: string, quantity: number, unitPrice: number }>
  }) => {
    try {
      // Get current user for created_by
      const { data: userData } = await supabase.auth.getUser()
      const createdBy = userData?.user?.id

      // 1. Insert Sales Record
      const { data: saleData, error: saleErr } = await supabase
        .from('supplement_sales')
        .insert({
          client_id: data.clientId,
          sale_date: data.saleDate,
          payment_method: data.paymentMethod,
          notes: data.notes,
          created_by: createdBy
        })
        .select()
        .single()

      if (saleErr) throw saleErr

      // 2. Insert Lines
      const linesToInsert = data.lines.map(l => ({
        sale_id: saleData.id,
        product_id: l.productId,
        quantity: l.quantity,
        unit_price: l.unitPrice
      }))

      const { error: linesErr } = await supabase
        .from('supplement_sale_lines')
        .insert(linesToInsert)

      if (linesErr) {
        // Rollback sale if lines insertion fails (e.g. out of stock trigger)
        await supabase.from('supplement_sales').delete().eq('id', saleData.id)
        throw linesErr
      }

      await fetchSales()
      return saleData
    } catch (err: any) {
      console.error('Error creating sale:', err)
      throw err
    }
  }, [fetchSales])

  const deleteSaleLine = useCallback(async (lineId: string) => {
    try {
      const { error: err } = await supabase
        .from('supplement_sale_lines')
        .delete()
        .eq('id', lineId)
      if (err) throw err
      // Refresh list
      await fetchSales()
    } catch (err: any) {
      console.error('Error deleting sale line:', err)
      throw err
    }
  }, [fetchSales])

  const deleteSale = useCallback(async (id: string) => {
    try {
      const { error: err } = await supabase
        .from('supplement_sales')
        .delete()
        .eq('id', id)
      if (err) throw err
      await fetchSales()
    } catch (err: any) {
      console.error('Error deleting sale:', err)
      throw err
    }
  }, [fetchSales])

  return {
    sales,
    loading,
    error,
    fetchSales,
    fetchSaleDetail,
    createSale,
    deleteSaleLine,
    deleteSale
  }
}
