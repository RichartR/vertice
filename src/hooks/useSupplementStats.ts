import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type TopProduct = {
  product_id: string
  product_name: string
  category: string | null
  total_units: number
  total_revenue: number
}

export type ClientPurchase = {
  product_name: string
  category: string | null
  total_units: number
  total_spent: number
  last_purchase: string
}

export type MonthlyRevenue = {
  month: string
  label: string
  revenue: number
  sales_count: number
}

export type ProductMargin = {
  product_id: string
  product_name: string
  category: string | null
  pb: number | null
  srp: number | null
  margin_eur: number | null
  margin_pct: number | null
  total_units_sold: number
}

export function useSupplementStats() {
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [loadingTop, setLoadingTop] = useState(false)

  const [clientPurchases, setClientPurchases] = useState<ClientPurchase[]>([])
  const [loadingClient, setLoadingClient] = useState(false)

  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([])
  const [loadingRevenue, setLoadingRevenue] = useState(false)

  const [marginData, setMarginData] = useState<ProductMargin[]>([])
  const [loadingMargin, setLoadingMargin] = useState(false)

  const fetchTopProducts = useCallback(async (dateFrom?: string, dateTo?: string, limit = 10, clientId?: string) => {
    try {
      setLoadingTop(true)
      const { data, error } = await supabase.rpc('get_supplement_top_products', {
        p_date_from: dateFrom || null,
        p_date_to: dateTo || null,
        p_limit: limit,
        p_client_id: clientId || null
      })
      if (error) throw error
      setTopProducts(data || [])
    } catch (err) {
      console.error('Error fetching top products:', err)
    } finally {
      setLoadingTop(false)
    }
  }, [])

  const fetchClientPurchases = useCallback(async (clientId: string) => {
    try {
      setLoadingClient(true)
      const { data, error } = await supabase.rpc('get_supplement_client_purchases', {
        p_client_id: clientId
      })
      if (error) throw error
      setClientPurchases(data || [])
    } catch (err) {
      console.error('Error fetching client purchases:', err)
    } finally {
      setLoadingClient(false)
    }
  }, [])

  const fetchMonthlyRevenue = useCallback(async (year: number) => {
    try {
      setLoadingRevenue(true)
      const { data, error } = await supabase.rpc('get_supplement_monthly_revenue', {
        p_year: year
      })
      if (error) throw error

      const monthsLabels = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
      ]
      
      const fullYearData: MonthlyRevenue[] = []
      
      for (let i = 0; i < 12; i++) {
        const monthNum = (i + 1).toString().padStart(2, '0')
        const monthKey = `${year}-${monthNum}`
        const label = `${monthsLabels[i]} ${year}`
        
        const existingData = data?.find((d: any) => d.month === monthKey)
        
        fullYearData.push({
          month: monthKey,
          label: label,
          revenue: existingData ? Number(existingData.revenue) : 0,
          sales_count: existingData ? Number(existingData.sales_count) : 0
        })
      }
      
      setMonthlyRevenue(fullYearData)
    } catch (err) {
      console.error('Error fetching monthly revenue:', err)
    } finally {
      setLoadingRevenue(false)
    }
  }, [])

  const fetchMarginByProduct = useCallback(async (minUnitsSold = 0) => {
    try {
      setLoadingMargin(true)
      const { data, error } = await supabase.rpc('get_supplement_margin_by_product', {
        p_min_units_sold: minUnitsSold
      })
      if (error) throw error
      setMarginData(data || [])
    } catch (err) {
      console.error('Error fetching margin data:', err)
    } finally {
      setLoadingMargin(false)
    }
  }, [])

  return {
    topProducts,
    loadingTop,
    fetchTopProducts,
    
    clientPurchases,
    loadingClient,
    fetchClientPurchases,
    
    monthlyRevenue,
    loadingRevenue,
    fetchMonthlyRevenue,
    
    marginData,
    loadingMargin,
    fetchMarginByProduct
  }
}
