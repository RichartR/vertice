import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type OrderLine = {
  id: string
  product_id: string
  product_name: string
  code: number
  quantity: number
  unit_cost: number | null
  subtotal: number | null
}

export type Order = {
  id: string
  order_date: string
  received: boolean
  received_at: string | null
  notes: string | null
  total_units: number
  total_cost: number | null
  lines: OrderLine[]
}

export function useSupplementOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mapOrderRow = (row: any): Order => {
    let total_units = 0;
    let total_cost: number | null = 0;
    let hasNullCost = false;

    const lines: OrderLine[] = (row.supplement_order_lines || []).map((l: any) => {
      total_units += l.quantity || 0;
      
      let subtotal = null;
      if (l.unit_cost !== null && l.unit_cost !== undefined) {
        subtotal = (l.quantity || 0) * l.unit_cost;
        if (!hasNullCost) total_cost! += subtotal;
      } else {
        hasNullCost = true;
        total_cost = null;
      }

      return {
        id: l.id,
        product_id: l.product_id,
        product_name: `${l.supplement_products?.product ?? 'Desconocido'}${l.supplement_products?.flavor ? ` (${l.supplement_products.flavor})` : ''}`,
        code: l.supplement_products?.code ?? 0,
        quantity: l.quantity,
        unit_cost: l.unit_cost ?? null,
        subtotal
      }
    });

    return {
      id: row.id,
      order_date: row.order_date,
      received: row.received,
      received_at: row.received_at,
      notes: row.notes,
      total_units,
      total_cost,
      lines,
    };
  };

  const fetchOrders = useCallback(async (received?: boolean) => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('supplement_orders')
        .select(`
          *,
          supplement_order_lines(
            *,
            supplement_products(product, flavor, code)
          )
        `)
        .order('order_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (typeof received === 'boolean') {
        query = query.eq('received', received)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      const mapped: Order[] = (data || []).map(mapOrderRow)
      setOrders(mapped)
      return mapped
    } catch (err: any) {
      console.error('Error fetching supplement orders:', err)
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchOrderDetail = useCallback(async (orderId: string): Promise<Order> => {
    setLoading(true)
    try {
      const { data, error: err } = await supabase
        .from('supplement_orders')
        .select(`
          *,
          supplement_order_lines(
            *,
            supplement_products(product, flavor, code)
          )
        `)
        .eq('id', orderId)
        .single()

      if (err) throw err
      return mapOrderRow(data)
    } catch (err: any) {
      console.error('Error fetching order detail:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, []);

  const createOrder = useCallback(async (data: {
    orderDate: string,
    notes?: string,
    lines: Array<{ productId: string, quantity: number, unitCost?: number }>
  }) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const createdBy = userData?.user?.id

      const { data: orderData, error: orderErr } = await supabase
        .from('supplement_orders')
        .insert({
          order_date: data.orderDate,
          notes: data.notes || null,
          created_by: createdBy
        })
        .select()
        .single()

      if (orderErr) throw orderErr

      const linesToInsert = data.lines.map(l => ({
        order_id: orderData.id,
        product_id: l.productId,
        quantity: l.quantity,
        unit_cost: l.unitCost ?? null
      }))

      const { error: linesErr } = await supabase
        .from('supplement_order_lines')
        .insert(linesToInsert)

      if (linesErr) {
        // Rollback just in case
        await supabase.from('supplement_orders').delete().eq('id', orderData.id)
        throw linesErr
      }

      await fetchOrders()
      return orderData
    } catch (err: any) {
      console.error('Error creating order:', err)
      throw err
    }
  }, [fetchOrders]);

  const receiveOrder = useCallback(async (orderId: string) => {
    try {
      // 1. Mark order as received
      const { error: orderErr } = await supabase
        .from('supplement_orders')
        .update({
          received: true,
          received_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (orderErr) throw orderErr

      // 2. Fetch lines to update stock
      const { data: lines, error: fetchErr } = await supabase
        .from('supplement_order_lines')
        .select('product_id, quantity')
        .eq('order_id', orderId)

      if (fetchErr) throw fetchErr

      if (lines && lines.length > 0) {
        // We will loop through the lines and update their stock.
        for (const line of lines) {
          // get the current stock
          const { data: stockData, error: stockFetchErr } = await supabase
            .from('supplement_stock')
            .select('quantity')
            .eq('product_id', line.product_id)
            .single()

          if (!stockFetchErr && stockData) {
            const newQuantity = stockData.quantity + line.quantity
            const { error: stockUpdateErr } = await supabase
              .from('supplement_stock')
              .update({ quantity: newQuantity })
              .eq('product_id', line.product_id)
            if (stockUpdateErr) {
              console.error(`Failed to update stock for product_id ${line.product_id}:`, stockUpdateErr)
            }
          } else {
             console.error(`Could not fetch stock for product_id ${line.product_id}:`, stockFetchErr);
          }
        }
      }

      await fetchOrders()
    } catch (err: any) {
      console.error('Error receiving order:', err)
      throw err
    }
  }, [fetchOrders]);

  const revertOrder = useCallback(async (orderId: string) => {
    try {
      // 1. Fetch lines to reverse stock
      const { data: lines, error: fetchErr } = await supabase
        .from('supplement_order_lines')
        .select('product_id, quantity')
        .eq('order_id', orderId)

      if (fetchErr) throw fetchErr

      if (lines && lines.length > 0) {
        for (const line of lines) {
          const { data: stockData, error: stockFetchErr } = await supabase
            .from('supplement_stock')
            .select('quantity')
            .eq('product_id', line.product_id)
            .single()

          if (!stockFetchErr && stockData) {
            const newQuantity = Math.max(0, stockData.quantity - line.quantity)
            const { error: stockUpdateErr } = await supabase
              .from('supplement_stock')
              .update({ quantity: newQuantity })
              .eq('product_id', line.product_id)
            if (stockUpdateErr) {
              console.error(`Failed to reverse stock for product_id ${line.product_id}:`, stockUpdateErr)
            }
          }
        }
      }

      // 2. Mark order as NOT received
      const { error: orderErr } = await supabase
        .from('supplement_orders')
        .update({
          received: false,
          received_at: null
        })
        .eq('id', orderId)

      if (orderErr) throw orderErr

      await fetchOrders()
    } catch (err: any) {
      console.error('Error reverting order:', err)
      throw err
    }
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    fetchOrders,
    fetchOrderDetail,
    createOrder,
    receiveOrder,
    revertOrder
  }
}
