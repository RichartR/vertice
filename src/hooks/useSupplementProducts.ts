import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type SupplementProduct = {
  id: string
  code: number
  product: string
  flavor: string | null
  pb: number | null
  srp: number | null
  ean: string | null
  category: string | null
  active: boolean
  stock: number
}

export function useSupplementProducts() {
  const [products, setProducts] = useState<SupplementProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async (force = false) => {
    // Prevent redundant fetches if we already have data and not forcing refresh
    if (!force && products.length > 0) return
    
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('supplement_products')
        .select(`
          *,
          supplement_stock(quantity)
        `)
        .order('category', { ascending: true })
        .order('product', { ascending: true })
        .order('flavor', { ascending: true })

      if (fetchError) throw fetchError

      const mapped: SupplementProduct[] = (data || []).map((row: any) => ({
        id: row.id,
        code: row.code,
        product: row.product,
        flavor: row.flavor,
        pb: row.pb,
        srp: row.srp,
        ean: row.ean,
        category: row.category,
        active: row.active,
        // The relation returns an object or array depending on the foreign key setup,
        // usually uniqueness makes it an object or array of one element.
        stock: Array.isArray(row.supplement_stock) 
                ? (row.supplement_stock[0]?.quantity ?? 0) 
                : (row.supplement_stock?.quantity ?? 0)
      }))

      setProducts(mapped)
    } catch (err: any) {
      console.error('Error fetching supplement products:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const createProduct = async (data: Omit<SupplementProduct, 'id' | 'stock'>) => {
    try {
      const { error: err } = await supabase.from('supplement_products').insert(data)
      if (err) throw err
    } catch (err: any) {
      console.error('Error creating product:', err)
      throw err
    }
  }

  const updateProduct = async (id: string, data: Partial<Omit<SupplementProduct, 'id' | 'stock'>>) => {
    try {
      const { error: err } = await supabase.from('supplement_products').update(data).eq('id', id)
      if (err) throw err
    } catch (err: any) {
      console.error('Error updating product:', err)
      throw err
    }
  }

  const toggleActive = async (id: string, active: boolean) => {
    try {
      const { error: err } = await supabase.from('supplement_products').update({ active }).eq('id', id)
      if (err) throw err
      setProducts(prev => prev.map(p => p.id === id ? { ...p, active } : p))
    } catch (err: any) {
      console.error('Error toggling product state:', err)
      throw err
    }
  }

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    toggleActive
  }
}
