import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export type StockItem = {
  id: string
  product_id: string
  code: number
  product: string
  flavor: string | null
  category: string | null
  srp: number | null
  quantity: number
  updated_at: string
  active: boolean
}

export type StockAdjustment = {
  productId: string
  newQuantity: number
  reason?: string
}

export function useSupplementStock() {
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStock = useCallback(async (filters?: { search?: string; outOfStock?: boolean }) => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('supplement_stock')
        .select(`
          id,
          product_id,
          quantity,
          updated_at,
          supplement_products!inner(
            code,
            product,
            flavor,
            category,
            srp,
            active
          )
        `)

      if (filters?.outOfStock) {
        query = query.eq('quantity', 0)
      }

      if (filters?.search) {
        const searchTerm = `%${filters.search}%`
        query = query.or(`product.ilike.${searchTerm},flavor.ilike.${searchTerm},code.ilike.${searchTerm}`, { foreignTable: 'supplement_products' })
      }

      // Supabase's order on foreign tables is somewhat tricky (it will order within relations, not top-level unless handled carefully via RPC/Views).
      // If native sorting is insufficient, we will sort the mapped data array in JS.
      
      const { data, error: fetchErr } = await query

      if (fetchErr) throw fetchErr

      const items: StockItem[] = (data || []).map((row: any) => ({
        id: row.id,
        product_id: row.product_id,
        quantity: row.quantity,
        updated_at: row.updated_at,
        code: row.supplement_products.code,
        product: row.supplement_products.product,
        flavor: row.supplement_products.flavor,
        category: row.supplement_products.category,
        srp: row.supplement_products.srp,
        active: row.supplement_products.active,
      }))

      // Sort by category ASC, product ASC, flavor ASC
      items.sort((a, b) => {
        const catA = a.category || ''
        const catB = b.category || ''
        if (catA !== catB) return catA.localeCompare(catB)
        
        if (a.product !== b.product) return a.product.localeCompare(b.product)
        
        const flavA = a.flavor || ''
        const flavB = b.flavor || ''
        return flavA.localeCompare(flavB)
      })

      setStockItems(items)
    } catch (err: any) {
      console.error('Error fetching stock:', err)
      setError(err.message || 'Error loading stock')
    } finally {
      setLoading(false)
    }
  }, [])

  const adjustStock = useCallback(async (adjustment: StockAdjustment) => {
    try {
      setError(null)
      const { error: updateErr } = await supabase
        .from('supplement_stock')
        .update({
          quantity: adjustment.newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('product_id', adjustment.productId)

      if (updateErr) throw updateErr

      await fetchStock()
    } catch (err: any) {
      console.error('Error adjusting stock:', err)
      throw err
    }
  }, [fetchStock])

  useEffect(() => {
    fetchStock()
  }, [fetchStock])

  return {
    stockItems,
    loading,
    error,
    fetchStock,
    adjustStock
  }
}
