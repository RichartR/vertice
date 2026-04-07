import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type KPIData = {
  products: number | null
  sales: number | null
  orders: number | null
  stock: number | null
}

export default function SupplementacionPage() {
  const [kpis, setKpis] = useState<KPIData>({
    products: null,
    sales: null,
    orders: null,
    stock: null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadKPIs() {
      try {
        const todayStr = new Date().toISOString().split('T')[0]

        const [productsRes, salesRes, ordersRes, stockRes] = await Promise.all([
          supabase.from('supplement_products').select('*', { count: 'exact', head: true }).eq('active', true),
          supabase.from('supplement_sales').select('*', { count: 'exact', head: true }).eq('sale_date', todayStr),
          supabase.from('supplement_orders').select('*', { count: 'exact', head: true }).eq('received', false),
          supabase.from('supplement_stock').select('*', { count: 'exact', head: true }).eq('quantity', 0)
        ])

        setKpis({
          products: productsRes.count,
          sales: salesRes.count,
          orders: ordersRes.count,
          stock: stockRes.count
        })
      } catch (err) {
        console.error('Error loading KPIs:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadKPIs()
  }, [])

  const cards = [
    {
      title: 'Catálogo',
      href: '/admin/suplementacion/productos',
      kpi: kpis.products,
      kpiLabel: 'Productos activos',
      icon: (
        <svg className="w-6 h-6 text-accent-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    {
      title: 'Ventas',
      href: '/admin/suplementacion/ventas',
      kpi: kpis.sales,
      kpiLabel: 'Ventas de hoy',
      icon: (
        <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'Pedidos',
      href: '/admin/suplementacion/pedidos',
      kpi: kpis.orders,
      kpiLabel: 'Pedidos pendientes',
      icon: (
        <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      )
    },
    {
      title: 'Stock',
      href: '/admin/suplementacion/stock',
      kpi: kpis.stock,
      kpiLabel: 'Productos agotados',
      icon: (
        <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      title: 'Estadísticas',
      href: '/admin/suplementacion/estadisticas',
      kpi: undefined,
      kpiLabel: undefined,
      icon: (
        <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ]

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Suplementación</h1>
        <p className="text-sm text-gray-500 mt-1">Gestión de catálogo, ventas, stock y pedidos.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {cards.map((card) => (
          <Link
            key={card.title}
            to={card.href}
            className="group relative bg-white rounded-2xl p-6 border border-gray-200 hover:border-accent hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between min-h-[140px]"
          >
            {/* Decors */}
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-gray-50 rounded-full group-hover:bg-accent/10 transition-colors pointer-events-none" />
            
            <div className="relative flex items-center gap-4 mb-4">
              <div className="p-3 bg-gray-50 rounded-xl group-hover:scale-110 transition-transform">
                {card.icon}
              </div>
              <h2 className="text-lg font-semibold text-gray-900">{card.title}</h2>
            </div>
            
            <div className="relative">
              {card.kpiLabel ? (
                <div className="flex items-baseline gap-2">
                  {loading ? (
                    <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <span className="text-2xl font-bold text-gray-900">
                      {card.kpi ?? '—'}
                    </span>
                  )}
                  <span className="text-sm font-medium text-gray-500">{card.kpiLabel}</span>
                </div>
              ) : (
                <div className="text-sm text-gray-400 font-medium">
                  Ver analíticas detalladas
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
