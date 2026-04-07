import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useSupplementSales, type SaleFilters } from '../hooks/useSupplementSales'
import NewSaleModal from '../components/supplement/NewSaleModal'
import SaleDetailModal from '../components/supplement/SaleDetailModal'
import ConfirmModal from '../components/ui/ConfirmModal'
import Select from '../components/ui/Select'
import { exportSalesToExcel } from '../utils/excelExport'

const ITEMS_PER_PAGE = 15

const FILTROS_INICIALES: SaleFilters = {
  dateFrom: '',
  dateTo: '',
  paymentMethod: ''
}

interface SaleRowProps {
  sale: any;
  onView: (id: string) => void;
  onDelete: (sale: any) => void;
}

const SaleRow = ({ sale: s, onView, onDelete }: SaleRowProps) => {
  const renderPaymentBadge = (method: string) => {
    const mMatch = method.toLowerCase().trim()
    const colors = {
      efectivo: 'bg-green-100 text-green-800 border-green-200',
      tarjeta: 'bg-blue-100 text-blue-800 border-blue-200',
      bizum: 'bg-purple-100 text-purple-800 border-purple-200'
    }
    const color = colors[mMatch as keyof typeof colors] || 'bg-gray-100 text-gray-600 border-gray-200'
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase border ${color}`}>
        {method}
      </span>
    )
  }

  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-2 font-medium text-gray-900 border-l-4 border-transparent hover:border-accent/10">
        {s.sale_date.split('-').reverse().join('/')}
      </td>
      <td className="px-4 py-2">
        <span className={`text-sm ${s.client_name ? 'text-gray-900 font-bold' : 'text-gray-400 italic font-medium'}`}>
          {s.client_name || 'Venta General'}
        </span>
      </td>
      <td className="px-4 py-2 text-center">
        <button
          onClick={() => onView(s.id)}
          className="px-2.5 py-1 bg-gray-100/50 text-gray-500 rounded-lg text-xs font-medium hover:bg-accent/10 hover:text-accent transition-colors"
        >
          {s.lines?.reduce((sum: number, l: any) => sum + l.quantity, 0) || 0} UNI.
        </button>
      </td>
      <td className="px-4 py-2 text-right font-semibold text-gray-900 text-base">
        {s.total.toFixed(2)} €
      </td>
      <td className="px-4 py-2 text-center">
        {renderPaymentBadge(s.payment_method)}
      </td>
      <td className="px-4 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onView(s.id)}
            className="p-2 text-gray-300 hover:text-accent hover:bg-accent/5 rounded-xl transition-all"
            title="Ver detalles"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(s)}
            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="Eliminar venta"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function SupplementSalesPage() {
  const { sales, loading, fetchSales, deleteSale } = useSupplementSales()
  
  // Filters
  const [filters, setFilters] = useState<SaleFilters>(FILTROS_INICIALES)
  const [clientSearch, setClientSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Modals
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false)
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)
  
  const [confirmData, setConfirmData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })

  useEffect(() => {
    fetchSales(filters)
  }, [fetchSales, filters])

  // Local filtering by client name
  const filteredSales = useMemo(() => {
    if (!clientSearch) return sales
    const lower = clientSearch.toLowerCase()
    return sales.filter(s => s.client_name?.toLowerCase().includes(lower))
  }, [sales, clientSearch])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredSales.length / ITEMS_PER_PAGE))
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredSales.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredSales, currentPage])

  // Totals
  const totalRevenue = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + s.total, 0)
  }, [filteredSales])

  const handleExport = () => {
    exportSalesToExcel(filteredSales)
  }

  const hayFiltrosActivos = () => {
    return filters.dateFrom !== '' || 
           filters.dateTo !== '' || 
           filters.paymentMethod !== '' || 
           clientSearch !== ''
  }


  const handleDeleteSale = async (id: string) => {
    await deleteSale(id)
    fetchSales(filters)
  }

  const openDeleteConfirm = (sale: any) => {
    setConfirmData({
      isOpen: true,
      title: 'Eliminar Venta',
      message: '¿Estás seguro de que deseas eliminar esta venta? El stock de los productos se restaurará automáticamente.',
      onConfirm: () => handleDeleteSale(sale.id)
    })
  }

  const renderTableBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={6} className="px-4 py-16 text-center">
            <div className="inline-block w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </td>
        </tr>
      )
    }

    if (paginatedSales.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="px-4 py-12 text-center text-gray-500 italic">
            No se encontraron ventas para estos filtros
          </td>
        </tr>
      )
    }

    return paginatedSales.map((s) => (
      <SaleRow 
        key={s.id} 
        sale={s} 
        onView={setSelectedSaleId}
        onDelete={openDeleteConfirm}
      />
    ))
  }

  return (
    <div className="p-4 sm:p-8 max-w-screen-2xl mx-auto flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="shrink-0 mb-6">
         <nav className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-1 block">
          <span className="mx-2">←</span>
          <Link to="/admin/suplementacion" className="hover:text-gray-600">Suplementación</Link>
        </nav>
        
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Registro de Ventas</h1>
          <button
            onClick={() => setIsNewSaleOpen(true)}
            className="px-4 py-2 bg-accent hover:bg-accent-dark text-gray-800 text-sm font-medium rounded-lg transition-colors"
          >
            + Nueva venta
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="shrink-0 flex flex-col lg:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Buscar por cliente o teléfono..."
              value={clientSearch}
              onChange={e => { setClientSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <input 
               type="date"
               value={filters.dateFrom}
               onChange={e => { setFilters(prev => ({ ...prev, dateFrom: e.target.value })); setCurrentPage(1); }}
               className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
             />
             <span className="text-gray-400">—</span>
             <input 
               type="date"
               value={filters.dateTo}
               onChange={e => { setFilters(prev => ({ ...prev, dateTo: e.target.value })); setCurrentPage(1); }}
               className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
             />
          </div>

          <Select
            value={filters.paymentMethod || ''}
            onChange={v => { setFilters(prev => ({ ...prev, paymentMethod: v })); setCurrentPage(1); }}
            options={[
              { value: 'efectivo', label: 'Efectivo' },
              { value: 'tarjeta', label: 'Tarjeta' },
              { value: 'bizum', label: 'Bizum' }
            ]}
            placeholder="Todos los métodos"
            className="w-full sm:w-64"
          />

          <div className="flex gap-2 shrink-0 ml-auto sm:ml-0">
            {hayFiltrosActivos() && (
              <button
                onClick={() => {
                  setFilters(FILTROS_INICIALES)
                  setClientSearch('')
                  setCurrentPage(1)
                }}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                title="Restablecer filtros"
              >
                Limpiar filtros
              </button>
            )}
            <button
               onClick={handleExport}
               className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
            >
               <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
               </svg>
               Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Contenido / Tabla */}
      <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="min-w-full divide-y divide-gray-200 w-full text-sm text-left">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-900">Fecha</th>
                <th className="px-4 py-3 font-semibold text-gray-900">Cliente</th>
                <th className="px-4 py-3 font-semibold text-gray-900 text-center">Productos</th>
                <th className="px-4 py-3 font-semibold text-gray-900 text-right">Total</th>
                <th className="px-4 py-3 font-semibold text-gray-900 text-center">Método</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {renderTableBody()}
            </tbody>
          </table>
        </div>

        {/* Footer: Paginación & Totales */}
        <div className="shrink-0 bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <p className="text-sm text-gray-600">
                Ventas: <span className="font-semibold text-gray-900">{filteredSales.length}</span>
              </p>
              <p className="text-sm text-gray-600 border-l border-gray-300 pl-4">
                Total: <span className="font-semibold text-gray-900">{totalRevenue.toFixed(2)} €</span>
              </p>
           </div>

           <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                 Anterior
              </button>
              <span className="text-sm text-gray-600 min-w-16 text-center">
                 Pág. {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                 Siguiente
              </button>
           </div>
        </div>
      </div>

      {/* Modals */}
      {isNewSaleOpen && (
        <NewSaleModal 
          onClose={() => setIsNewSaleOpen(false)}
          onSuccess={() => fetchSales(filters)}
        />
      )}

      {selectedSaleId && (
        <SaleDetailModal 
          saleId={selectedSaleId}
          onClose={() => setSelectedSaleId(null)}
          onRefresh={() => fetchSales(filters)}
        />
      )}

      <ConfirmModal
        isOpen={confirmData.isOpen}
        title={confirmData.title}
        message={confirmData.message}
        variant="danger"
        onConfirm={confirmData.onConfirm}
        onClose={() => setConfirmData(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
