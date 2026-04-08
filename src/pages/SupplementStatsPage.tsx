import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, Cell
} from 'recharts'

import { useSupplementClients, type SupplementClient } from '../hooks/useSupplementClients'
import { useSupplementStats, type MonthlyRevenue, type ProductMargin } from '../hooks/useSupplementStats'
import ClientModal from '../components/supplementation/ClientModal'
import ConfirmModal from '../components/ui/ConfirmModal'
import SupplementClientSelector from '../components/supplement/SupplementClientSelector'

const formatEur = (val: number | null) => {
  if (val === null) return '—'
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val)
}

// --- Custom Components for Recharts ---

const TopProductTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-xl">
        <p className="font-bold text-gray-900 mb-1">{data.product_name}</p>
        <p className="text-sm text-gray-600">Unidades: <span className="font-bold text-gray-900">{data.total_units}</span></p>
        <p className="text-sm text-gray-600">Ingresos: <span className="font-bold text-accent-dark">{formatEur(data.total_revenue)}</span></p>
      </div>
    )
  }
  return null;
}

const RevenueTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const data = payload[0].payload as MonthlyRevenue;
    return (
      <div className="bg-white p-4 shadow-xl border border-gray-100 rounded-2xl">
        <p className="font-bold mb-2 pb-2 text-gray-900 border-b border-gray-100">{data.label}</p>
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Ingresos: <span className="font-bold text-accent-dark text-lg">{formatEur(data.revenue)}</span></p>
          <p className="text-sm text-gray-500">Total ventas: <span className="font-bold text-gray-900">{data.sales_count}</span></p>
        </div>
      </div>
    )
  }
  return null;
}

const MarginTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const data = payload[0].payload as ProductMargin;
    return (
      <div className="bg-white p-4 border border-gray-100 shadow-xl rounded-xl">
        <p className="font-bold text-gray-900 mb-2">{data.product_name}</p>
        <p className="text-sm text-gray-500">P. Base: <span className="font-bold text-gray-900">{formatEur(data.pb)}</span></p>
        <p className="text-sm text-gray-500">SRP: <span className="font-bold text-gray-900">{formatEur(data.srp)}</span></p>
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-sm text-gray-500">Margen (€): <span className={`font-bold ${data.margin_eur && data.margin_eur < 0 ? 'text-red-500' : 'text-accent-dark'}`}>{formatEur(data.margin_eur)}</span></p>
          <p className="text-sm text-gray-500">Margen (%): <span className={`font-bold ${data.margin_pct && data.margin_pct < 0 ? 'text-red-500' : 'text-accent-dark'}`}>{data.margin_pct?.toFixed(2)}%</span></p>
        </div>
      </div>
    )
  }
  return null;
}

type TabType = 'top' | 'client' | 'revenue' | 'margin' | 'clients'

export default function SupplementStatsPage() {
  const { clients, loading: loadingClients, fetchClients, createClient, updateClient, deleteClient, activateClient } = useSupplementClients()
  const {
    topProducts, loadingTop, fetchTopProducts,
    clientPurchases, loadingClient, fetchClientPurchases,
    monthlyRevenue, loadingRevenue, fetchMonthlyRevenue,
    marginData, loadingMargin, fetchMarginByProduct
  } = useSupplementStats()

  const [activeTab, setActiveTab] = useState<TabType>('top')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [topLimit, setTopLimit] = useState(10)
  const [selectedClient, setSelectedClient] = useState<SupplementClient | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [marginMinUnits, setMarginMinUnits] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<SupplementClient | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const [confirmData, setConfirmData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'primary';
  }>({
    isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'primary'
  })

  useEffect(() => {
    if (activeTab === 'clients') {
      fetchClients(undefined, showArchived)
    } else if (activeTab === 'top') {
      fetchTopProducts(dateFrom, dateTo, topLimit)
    } else if (activeTab === 'client' && selectedClient?.id) {
      fetchClientPurchases(selectedClient.id)
    } else if (activeTab === 'revenue') {
      fetchMonthlyRevenue(selectedYear)
    } else if (activeTab === 'margin') {
      fetchMarginByProduct(marginMinUnits)
    }
  }, [
    activeTab, 
    fetchClients, showArchived, 
    fetchTopProducts, dateFrom, dateTo, topLimit, 
    fetchClientPurchases, selectedClient, 
    fetchMonthlyRevenue, selectedYear, 
    fetchMarginByProduct, marginMinUnits
  ])

  const handleClearTopFilters = () => {
    setDateFrom('')
    setDateTo('')
    setTopLimit(10)
  }

  const hasTopFilters = dateFrom || dateTo || topLimit !== 10

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients
    const lowerSearch = searchTerm.toLowerCase()
    return clients.filter(c => 
      c.full_name.toLowerCase().includes(lowerSearch) || 
      (c.phone?.toLowerCase().includes(lowerSearch) ?? false)
    )
  }, [clients, searchTerm])

  const handleOpenNew = () => {
    setEditingClient(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (client: SupplementClient) => {
    setEditingClient(client)
    setIsModalOpen(true)
  }

  const handleSaveModal = async (data: { full_name: string; phone?: string; notes?: string }) => {
    if (editingClient) {
      await updateClient(editingClient.id, data)
    } else {
      await createClient(data.full_name, data.phone, data.notes)
    }
    setIsModalOpen(false)
  }

  const renderTopProducts = () => {
    const chartData = topProducts.map(p => ({
      ...p,
      shortName: p.product_name.length > 30 ? p.product_name.substring(0, 30) + '...' : p.product_name
    }))

    const dynamicHeight = topProducts.length * 32 + 50

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 border border-gray-100 rounded-[2rem] shadow-sm flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="topDateFrom" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Desde (opcional)</label>
            <input 
              id="topDateFrom"
              type="date" 
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent outline-none font-medium"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="topDateTo" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Hasta (opcional)</label>
            <input 
              id="topDateTo"
              type="date" 
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent outline-none font-medium"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label htmlFor="topLimit" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mostrar</label>
            <select 
              id="topLimit"
              value={topLimit}
              onChange={e => setTopLimit(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent outline-none font-medium"
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={15}>Top 15</option>
              <option value={20}>Top 20</option>
              <option value={50}>Top 50</option>
            </select>
          </div>
          
          {hasTopFilters && (
            <button 
              onClick={handleClearTopFilters}
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition flex items-center gap-2 h-[42px]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Limpiar filtros
            </button>
          )}
        </div>

        {loadingTop ? (
          <div className="h-64 flex items-center justify-center bg-white rounded-[2rem] border border-gray-100 shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : topProducts.length === 0 ? (
          <div className="h-64 flex items-center justify-center bg-white rounded-[2rem] border border-gray-100 shadow-sm text-gray-500 font-medium">
            No hay ventas en este periodo.
          </div>
        ) : (
          <>
            <div className="bg-white p-6 border border-gray-100 rounded-[2rem] shadow-sm pr-8">
              <div style={{ height: dynamicHeight }} className="w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                    <XAxis type="number" tick={{fontSize: 11, fontWeight: 600, fill: '#9ca3af', fontFamily: 'inherit'}} tickLine={false} axisLine={false} />
                    <YAxis dataKey="shortName" type="category" width={220} tick={{fontSize: 12, fontWeight: 700, fill: '#4b5563', fontFamily: 'inherit'}} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                      cursor={{fill: '#f3f4f6'}}
                      content={<TopProductTooltip />}
                    />
                    <Bar dataKey="total_units" fill="#9dc5b8" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50/80 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Categoría</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Uds. Vendidas</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {topProducts.map(p => (
                      <tr key={p.product_id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{p.product_name}</td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{p.category || '-'}</td>
                        <td className="px-6 py-4 text-right font-medium">{p.total_units}</td>
                        <td className="px-6 py-4 text-right font-medium text-accent-dark">{formatEur(p.total_revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  const renderByClient = () => {
    const totalSpent = clientPurchases.reduce((acc, current) => acc + current.total_spent, 0)

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 border border-gray-100 rounded-[2rem] shadow-sm max-w-xl">
          <SupplementClientSelector 
            value={selectedClient}
            onChange={setSelectedClient}
          />
        </div>

        {!selectedClient ? (
          <div className="h-64 flex items-center justify-center bg-white rounded-[2rem] border border-gray-100 shadow-sm text-gray-500 font-medium">
            Selecciona un cliente para ver su historial de compras
          </div>
        ) : loadingClient ? (
           <div className="h-64 flex items-center justify-center bg-white rounded-[2rem] border border-gray-100 shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : clientPurchases.length === 0 ? (
          <div className="h-64 flex items-center justify-center bg-white rounded-[2rem] border border-gray-100 shadow-sm text-gray-500 font-medium">
            Este cliente no tiene compras registradas.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-6 border border-gray-100 rounded-[2rem] shadow-sm">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Distribución de compras por unidades</h3>
              <div style={{ height: Math.min(400, clientPurchases.length * 35 + 50) }} className="w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={clientPurchases.map(p => ({ ...p, shortName: p.product_name.length > 20 ? p.product_name.substring(0, 20) + '...' : p.product_name }))} 
                    layout="vertical" 
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                    <XAxis type="number" tick={{fontSize: 11, fontWeight: 600, fill: '#9ca3af', fontFamily: 'inherit'}} tickLine={false} axisLine={false} />
                    <YAxis dataKey="shortName" type="category" width={150} tick={{fontSize: 12, fontWeight: 700, fill: '#4b5563', fontFamily: 'inherit'}} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                      cursor={{fill: '#f3f4f6'}}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-xl">
                              <p className="font-bold text-gray-900 mb-1">{data.product_name}</p>
                              <p className="text-sm text-gray-600">Total unidades: <span className="font-bold text-gray-900">{data.total_units}</span></p>
                              <p className="text-sm text-gray-600">Inversión total: <span className="font-bold text-accent-dark">{formatEur(data.total_spent)}</span></p>
                            </div>
                          )
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="total_units" fill="#9dc5b8" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Categoría</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Cant.</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total Invertido</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Última compra</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {clientPurchases.map((purchase, idx) => (
                    <tr key={`${purchase.product_name}-${idx}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{purchase.product_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{purchase.category || '-'}</td>
                      <td className="px-6 py-4 text-sm text-center font-medium">{purchase.total_units}</td>
                      <td className="px-6 py-4 text-sm text-right font-bold text-accent-dark">{formatEur(purchase.total_spent)}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-500">{new Date(purchase.last_purchase).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-end">
              <div className="text-xl font-medium text-gray-700 items-baseline gap-3 flex">
                Total histórico gastado: <span className="font-bold text-gray-900 text-2xl">{formatEur(totalSpent)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderRevenue = () => {
    const totalYear = monthlyRevenue.reduce((acc, curr) => acc + curr.revenue, 0)
    
    let bestMonth = { label: '-', revenue: 0 }
    let monthsWithSales = 0

    monthlyRevenue.forEach(m => {
      if (m.revenue > bestMonth.revenue) {
        bestMonth = m
      }
      if (m.sales_count > 0) {
        monthsWithSales++
      }
    })

    const avgMonthly = monthsWithSales > 0 ? totalYear / monthsWithSales : 0
    const allZero = totalYear === 0

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-6 shrink-0">
          <div className="bg-white p-6 border border-gray-100 rounded-[2rem] shadow-sm max-w-xs w-full">
            <label htmlFor="revYear" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Año Fiscal</label>
            <select 
              id="revYear"
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent outline-none font-medium h-[42px]"
            >
              <option value={new Date().getFullYear() + 1}>{new Date().getFullYear() + 1}</option>
              <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
              <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
              <option value={new Date().getFullYear() - 2}>{new Date().getFullYear() - 2}</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 flex-1">
            <div className="bg-white p-6 border border-gray-100 rounded-[2rem] shadow-sm flex flex-col justify-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Ingresado</span>
              <span className="text-3xl font-black text-gray-900 leading-none">{formatEur(totalYear)}</span>
            </div>
            <div className="bg-white p-6 border border-gray-100 rounded-[2rem] shadow-sm flex flex-col justify-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Mejor Mes ({bestMonth.label})</span>
              <span className="text-3xl font-black text-accent-dark leading-none">{formatEur(bestMonth.revenue)}</span>
            </div>
            <div className="bg-white p-6 border border-gray-100 rounded-[2rem] shadow-sm flex flex-col justify-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Mediamensual</span>
              <span className="text-3xl font-black text-gray-900 leading-none">{formatEur(avgMonthly)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 border border-gray-100 rounded-[2rem] shadow-sm pt-8">
          {loadingRevenue ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : allZero ? (
            <div className="h-80 flex items-center justify-center text-gray-500 font-medium">
              No hay datos de ventas para este año
            </div>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRevenue} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="label" tick={{fontSize: 11, fontWeight: 600, fill: '#9ca3af', fontFamily: 'inherit'}} tickLine={false} axisLine={false} dy={10} />
                  <YAxis tick={{fontSize: 11, fontWeight: 600, fill: '#9ca3af', fontFamily: 'inherit'}} tickLine={false} axisLine={false} dx={-10} tickFormatter={(val) => `${val}€`} />
                  <RechartsTooltip content={<RevenueTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#9dc5b8" 
                    strokeWidth={4}
                    dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} 
                    activeDot={{ r: 8, fill: "#9dc5b8", stroke: "#fff", strokeWidth: 2 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderMargins = () => {
    const top15 = [...marginData].slice(0, 15).map(p => ({
      ...p,
      shortName: p.product_name.length > 20 ? p.product_name.substring(0, 20) + '...' : p.product_name
    }))

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 border border-gray-100 rounded-[2rem] shadow-sm flex items-center justify-between">
          <label className="flex items-center gap-4 cursor-pointer group">
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={marginMinUnits > 0}
                onChange={e => setMarginMinUnits(e.target.checked ? 1 : 0)}
              />
              <div className={`w-12 h-6 rounded-full transition-colors ${marginMinUnits > 0 ? 'bg-accent' : 'bg-gray-300'}`} />
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-md transition-transform ${marginMinUnits > 0 ? 'translate-x-6' : ''}`} />
            </div>
            <span className={`text-sm font-bold transition-colors ${marginMinUnits > 0 ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}`}>
              Mostrar solo productos con ventas activas
            </span>
          </label>
        </div>

        {loadingMargin ? (
          <div className="h-64 flex items-center justify-center bg-white rounded-[2rem] border border-gray-100 shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : marginData.length === 0 ? (
          <div className="h-64 flex items-center justify-center bg-white rounded-[2rem] border border-gray-100 shadow-sm text-gray-500 font-medium">
            No se encontraron productos con PB y SRP configurados
          </div>
        ) : (
          <>
            <div className="bg-white p-6 border border-gray-100 rounded-[2rem] shadow-sm pt-8">
              <h3 className="text-lg font-bold text-gray-900 mb-6 px-4">Top 15 por margen absoluto (€)</h3>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top15} margin={{ top: 5, right: 30, left: 10, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis 
                      dataKey="shortName" 
                      tick={{fontSize: 10, fontWeight: 700, fill: '#6b7280', fontFamily: 'inherit'}} 
                      tickLine={false} 
                      axisLine={false} 
                      angle={-45}
                      textAnchor="end"
                      dy={10}
                    />
                    <YAxis 
                      tick={{fontSize: 11, fontWeight: 600, fill: '#9ca3af', fontFamily: 'inherit'}} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={val => `${val}€`} 
                    />
                    <RechartsTooltip 
                      cursor={{fill: '#f3f4f6'}}
                      content={<MarginTooltip />}
                    />
                    <Bar dataKey="margin_eur" radius={[4, 4, 0, 0]} barSize={40}>
                      {top15.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={(entry.margin_eur ?? 0) >= 0 ? '#9dc5b8' : '#EF4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50/80 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Categoría</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">P.Base</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">SRP</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Margen (€)</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Margen (%)</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Ventas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {marginData.map(p => {
                      const isNegative = (p.margin_eur ?? 0) < 0
                      return (
                        <tr key={p.product_id} className={`hover:bg-gray-50/50 transition-colors ${isNegative ? 'bg-red-50/30' : ''}`}>
                          <td className="px-6 py-4 font-bold text-gray-900">{p.product_name}</td>
                          <td className="px-6 py-4 text-gray-500 text-sm">{p.category || '-'}</td>
                          <td className="px-6 py-4 text-right font-medium">{formatEur(p.pb)}</td>
                          <td className="px-6 py-4 text-right font-medium">{formatEur(p.srp)}</td>
                          <td className={`px-6 py-4 text-right font-bold ${isNegative ? 'text-red-600' : 'text-accent-dark'}`}>{formatEur(p.margin_eur)}</td>
                          <td className={`px-6 py-4 text-right font-bold py-1 ${isNegative ? 'text-red-600' : 'text-accent-dark'}`}>
                            {p.margin_pct !== null ? `${p.margin_pct.toFixed(2)}%` : '—'}
                          </td>
                          <td className="px-6 py-4 text-center text-sm font-medium bg-gray-50/50">{p.total_units_sold}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  const renderClientsCRM = () => {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 shrink-0">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-accent/10 rounded-2xl text-accent shadow-sm">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
             </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 leading-none mb-1">Directorio de Clientes</h2>
                <p className="text-sm font-medium text-gray-500">Base de datos de suplementación</p>
              </div>
          </div>
          <button
            onClick={handleOpenNew}
            className="px-6 py-2.5 bg-accent hover:bg-accent-dark text-gray-800 text-sm font-bold lg:rounded-2xl rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            NUEVO CLIENTE
          </button>
        </div>

        {/* Buscador local y Filtros */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shrink-0">
          <div className="relative flex-1 max-w-xl">
            <input
              type="text"
              placeholder="Buscar cliente por nombre o teléfono..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl shadow-inner focus:ring-2 focus:ring-accent/50 outline-none transition-all text-sm font-medium"
            />
            <div className="absolute left-4 top-4 text-gray-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <label className="flex items-center gap-4 cursor-pointer group bg-gray-50 px-6 py-4 rounded-2xl border border-transparent hover:border-accent/20 transition-all">
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={showArchived}
                onChange={e => setShowArchived(e.target.checked)}
              />
              <div className={`w-12 h-6 rounded-full transition-colors ${showArchived ? 'bg-accent' : 'bg-gray-300'}`} />
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-md transition-transform ${showArchived ? 'translate-x-6' : ''}`} />
            </div>
            <span className={`text-xs font-semibold uppercase tracking-wider transition-colors ${showArchived ? 'text-accent' : 'text-gray-400 group-hover:text-gray-600'}`}>
              Ver Archivados
            </span>
          </label>
        </div>

        {/* Tabla Clientes */}
        <div className="rounded-3xl border border-gray-50 overflow-hidden flex-1 flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur-md border-b border-gray-100">
                <tr>
                  <th className="px-8 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre del Cliente</th>
                  <th className="px-8 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Teléfono</th>
                  <th className="px-8 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Apuntes/Notas</th>
                  <th className="px-8 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Nº Ventas</th>
                  <th className="px-8 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Controles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {loadingClients ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center">
                      <div className="inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                    </td>
                  </tr>
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium italic">
                      {clients.length === 0 ? 'No hay clientes registrados aún' : 'No se han encontrado clientes con ese filtro'}
                    </td>
                  </tr>
                ) : (
                  filteredClients.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900 block">{c.full_name}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-600">
                        {c.phone || <span className="text-gray-300 italic text-xs font-normal">Sin teléfono</span>}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm max-w-[300px] truncate">
                        {c.notes || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2.5 rounded-full text-[10px] font-bold ${c.total_sales > 0 ? 'bg-accent/10 text-accent-dark border border-accent/20' : 'bg-gray-100 text-gray-400'}`}>
                          {c.total_sales}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {c.active ? (
                            <>
                              <button
                                onClick={() => handleOpenEdit(c)}
                                className="px-3 py-1.5 text-[10px] font-bold text-gray-700 bg-accent/20 hover:bg-accent/40 rounded-lg transition-all uppercase tracking-wider"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => {
                                  setConfirmData({
                                    isOpen: true,
                                    title: c.total_sales > 0 ? 'Archivar Cliente' : 'Eliminar Cliente',
                                    message: `¿Estás seguro de que deseas ${c.total_sales > 0 ? 'archivar' : 'eliminar'} a ${c.full_name}?`,
                                    onConfirm: () => deleteClient(c),
                                    variant: c.total_sales > 0 ? 'primary' : 'danger'
                                  })
                                }}
                                className="px-3 py-1.5 text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all uppercase tracking-wider"
                              >
                                {c.total_sales > 0 ? 'Archivar' : 'Borrar'}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => activateClient(c.id)}
                                className="px-3 py-1.5 text-[10px] font-bold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-all uppercase tracking-wider"
                              >
                                Activar
                              </button>
                              {c.total_sales === 0 && (
                                <button
                                  onClick={() => {
                                    setConfirmData({
                                      isOpen: true,
                                      title: 'Eliminar Definitivamente',
                                      message: `¿Confirma el borrado DEFINITIVO de ${c.full_name}? Esta acción no se puede deshacer.`,
                                      onConfirm: () => deleteClient(c),
                                      variant: 'danger'
                                    })
                                  }}
                                  className="px-3 py-1.5 text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all uppercase tracking-wider"
                                >
                                  Borrar
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // Define Tabs structure
  const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'top',
      label: 'Más vendidos',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 118 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      id: 'client',
      label: 'Por cliente',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: 'revenue',
      label: 'Ingresos',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'margin',
      label: 'Márgenes',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      )
    },
    {
      id: 'clients',
      label: 'Clientes',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    }
  ]

  return (
    <div className="p-4 sm:p-8 max-w-screen-2xl mx-auto flex flex-col min-h-[calc(100vh-64px)] overflow-y-auto">
      {/* Header */}
      <div className="shrink-0 mb-8">
         <nav className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-1 block">
          <span className="mx-2">←</span>
          <Link to="/admin/suplementacion" className="hover:text-gray-600">Suplementación</Link>
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Estadísticas e Informes</h1>
        </div>
      </div>

      {/* Tabs Nav */}
      <div className="flex overflow-x-auto gap-2 pb-4 mb-6 border-b border-gray-200 shrink-0 scrollbar-hide">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-accent text-gray-900 shadow-md' 
                  : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-gray-100'
              }`}
            >
              <div className={isActive ? 'text-gray-900' : 'text-gray-400'}>
                {tab.icon}
              </div>
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Dynamic Content */}
      <div className="flex-1 min-h-0 flex flex-col">
        {activeTab === 'clients' && renderClientsCRM()}
        {activeTab === 'top' && renderTopProducts()}
        {activeTab === 'client' && renderByClient()}
        {activeTab === 'revenue' && renderRevenue()}
        {activeTab === 'margin' && renderMargins()}
      </div>

      {/* Modals para CRM */}
      {isModalOpen && (
        <ClientModal
          client={editingClient}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveModal}
        />
      )}

      <ConfirmModal
        isOpen={confirmData.isOpen}
        title={confirmData.title}
        message={confirmData.message}
        variant={confirmData.variant}
        onConfirm={confirmData.onConfirm}
        onClose={() => setConfirmData(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
