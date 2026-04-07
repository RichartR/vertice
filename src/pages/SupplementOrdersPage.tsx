import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSupplementOrders } from '../hooks/useSupplementOrders'
import { exportOrdersToExcel } from '../utils/excelExport'
import NewOrderModal from '../components/supplement/NewOrderModal'
import OrderDetailModal from '../components/supplement/OrderDetailModal'

export default function SupplementOrdersPage() {
  const [activeTab, setActiveTab] = useState<'pendientes' | 'recibidos'>('pendientes')
  const { orders, loading, fetchOrders } = useSupplementOrders()
  
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  // Pagination states
  const [currentPagePendientes, setCurrentPagePendientes] = useState(1)
  const [currentPageRecibidos, setCurrentPageRecibidos] = useState(1)
  const ITEMS_PER_PAGE = 15

  useEffect(() => {
    fetchOrders(activeTab === 'recibidos')
  }, [activeTab, fetchOrders])

  const pendingOrders = orders.filter(o => !o.received)
  const receivedOrders = orders.filter(o => o.received)

  const currentTabOrders = activeTab === 'pendientes' ? pendingOrders : receivedOrders
  const currentPage = activeTab === 'pendientes' ? currentPagePendientes : currentPageRecibidos

  const totalPages = Math.max(1, Math.ceil(currentTabOrders.length / ITEMS_PER_PAGE))
  const paginatedOrders = currentTabOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handlePageChange = (newPage: number) => {
    if (activeTab === 'pendientes') setCurrentPagePendientes(newPage)
    else setCurrentPageRecibidos(newPage)
  }

  const handleExport = () => {
    exportOrdersToExcel(currentTabOrders, activeTab === 'recibidos')
  }

  const renderTableContent = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
            <div className="flex flex-col items-center justify-center">
              <span className="w-8 h-8 border-2 border-accent-dark border-t-transparent rounded-full animate-spin mb-4" />
              <span className="text-gray-500 font-medium">Cargando pedidos...</span>
            </div>
          </td>
        </tr>
      )
    }

    if (paginatedOrders.length === 0) {
      return (
        <tr>
          <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
            No hay pedidos {activeTab}
          </td>
        </tr>
      )
    }

    return paginatedOrders.map((order) => {
      let displayNotes = '—'
      if (order.notes) {
        displayNotes = order.notes.length > 40 
          ? `${order.notes.substring(0, 40)}...` 
          : order.notes
      }

      return (
        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
          <td className="px-6 py-4 font-medium text-gray-900">
            {order.order_date.split('-').reverse().join('/')}
          </td>
          {activeTab === 'recibidos' && (
            <td className="px-6 py-4 text-gray-600">
              {order.received_at ? new Date(order.received_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
            </td>
          )}
          <td className="px-6 py-4 text-center text-gray-600">
            {order.lines?.length || 0}
          </td>
          <td className="px-6 py-4 text-center font-medium text-gray-900">
            {order.total_units}
          </td>
          <td className="px-6 py-4 text-right font-semibold text-gray-900">
            {order.total_cost === null ? '—' : `${order.total_cost.toFixed(2)} €`}
          </td>
          <td className="px-6 py-4 text-gray-500 truncate max-w-[200px]" title={order.notes || ''}>
            {displayNotes}
          </td>
          <td className="px-6 py-4 text-right">
            <button
              onClick={() => setSelectedOrderId(order.id)}
              className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-all"
            >
              Ver detalle
            </button>
          </td>
        </tr>
      )
    })
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500 mb-6">
        <Link to="/admin/suplementacion" className="hover:text-gray-900 transition-colors">Suplementación</Link>
        <svg className="w-4 h-4 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium">Pedidos</span>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos de Stock</h1>
          <p className="text-gray-500 mt-1">Gestiona la entrada de mercancía de suplementación.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all font-medium text-sm flex items-center gap-2"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar
          </button>
          
          {activeTab === 'pendientes' && (
            <button
              onClick={() => setIsNewOrderModalOpen(true)}
              className="px-4 py-2 bg-accent-dark hover:bg-accent text-accent-darker font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2 text-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo pedido
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('pendientes')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'pendientes'
              ? 'border-accent-dark text-accent-darker bg-accent/10'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Pendientes
          {pendingOrders.length > 0 && (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === 'pendientes' ? 'bg-accent/20 text-accent-darker' : 'bg-gray-100 text-gray-600'
            }`}>
              {pendingOrders.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('recibidos')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'recibidos'
              ? 'border-accent-dark text-accent-darker bg-accent/10'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Recibidos
          {receivedOrders.length > 0 && (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === 'recibidos' ? 'bg-accent/20 text-accent-darker' : 'bg-gray-100 text-gray-600'
            }`}>
              {receivedOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
             <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
               <tr>
                 <th className="px-6 py-4 font-semibold">Fecha pedido</th>
                 {activeTab === 'recibidos' && <th className="px-6 py-4 font-semibold">Fecha recepción</th>}
                 <th className="px-6 py-4 font-semibold text-center">Nº productos</th>
                 <th className="px-6 py-4 font-semibold text-center">Total unidades</th>
                 <th className="px-6 py-4 font-semibold text-right">Coste total</th>
                 <th className="px-6 py-4 font-semibold">Notas</th>
                 <th className="px-6 py-4 font-semibold text-right">Acciones</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {renderTableContent()}
             </tbody>
          </table>
        </div>
        
        {/* Pagination logic */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-sm text-gray-500">
               Mostrando <span className="font-medium text-gray-900 underline">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> a <span className="font-medium text-gray-900 underline">{Math.min(currentPage * ITEMS_PER_PAGE, currentTabOrders.length)}</span> de <span className="font-medium text-gray-900 underline">{currentTabOrders.length}</span> pedidos
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Anterior
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {isNewOrderModalOpen && (
        <NewOrderModal 
          isOpen={isNewOrderModalOpen}
          onClose={() => setIsNewOrderModalOpen(false)}
          onOrderCreated={() => {
            setIsNewOrderModalOpen(false)
            fetchOrders(activeTab === 'recibidos')
          }}
        />
      )}

      {selectedOrderId && (
        <OrderDetailModal
          isOpen={!!selectedOrderId}
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onOrderReceived={() => {
             setSelectedOrderId(null)
             fetchOrders(activeTab === 'recibidos')
          }}
        />
      )}

    </div>
  )
}
