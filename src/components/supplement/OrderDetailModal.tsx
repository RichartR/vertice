import { useState, useEffect } from 'react'
import { useSupplementOrders, type Order } from '../../hooks/useSupplementOrders'
import ConfirmModal from '../ui/ConfirmModal'

interface OrderDetailModalProps {
  isOpen: boolean
  orderId: string
  onClose: () => void
  onOrderReceived: () => void
}

/**
 * Subcomponentes para reducir la complejidad cognitiva y mejorar el mantenimiento
 */
function LoadingState() {
  return (
    <div className="py-32 flex flex-col items-center justify-center animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-gray-100 rounded-full"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="mt-6 text-gray-500 font-medium tracking-wide">Cargando detalles del pedido...</p>
    </div>
  )
}

function ErrorState({ message, onClose }: Readonly<{ message: string, onClose: () => void }>) {
  return (
    <div className="p-12 text-center animate-in zoom-in-95 duration-300">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 mb-6">
        <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Error al cargar pedido</h3>
      <p className="text-gray-500 mb-8 max-w-sm mx-auto">{message}</p>
      <button 
        onClick={onClose} 
        className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all uppercase text-xs tracking-widest"
      >
        Volver atrás
      </button>
    </div>
  )
}

interface OrderContentProps {
  order: Order
  onClose: () => void
  onReceiveClick: () => void
  onRevertClick: () => void
}

function OrderContent({ order, onClose, onReceiveClick, onRevertClick }: Readonly<OrderContentProps>) {
  const formatDate = (date: string) => date.split('-').reverse().join('/')
  const formatDateTime = (date: string) => new Date(date).toLocaleString('es-ES', { 
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
  })

  return (
    <>
      {/* Header */}
      <div className="px-6 py-4 sm:px-8 sm:py-6 border-b border-gray-100 bg-white shrink-0 flex justify-between items-center text-gray-900 uppercase">
        <h3 className="text-lg sm:text-xl font-bold tracking-tight">Detalle del Pedido</h3>
        <button 
          onClick={onClose} 
          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 sm:p-8 overflow-y-auto bg-white space-y-8 flex-1 scrollbar-hide">
        {/* Resumen Cabecera */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 sm:p-6 bg-gray-50 rounded-2xl border border-gray-100">
          <DetailTab label="Fecha Pedido" value={formatDate(order.order_date)} />
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Estado</span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              order.received ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
            }`}>
              {order.received ? 'Recibido' : 'Pendiente'}
            </span>
          </div>
          <DetailTab label="Recepción" value={order.received_at ? formatDateTime(order.received_at) : '—'} />
          <DetailTab label="Notas" value={order.notes || '—'} />
        </div>

        {/* Table */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Productos del Pedido</h4>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm text-left min-w-[600px] sm:min-w-0">
              <thead className="text-[9px] text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-50 font-bold">
                <tr>
                  <th className="px-6 py-4 hidden md:table-cell">Cód</th>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4 text-center">Cant.</th>
                  <th className="px-6 py-4 text-right hidden sm:table-cell">Costo Unit.</th>
                  <th className="px-6 py-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {order.lines.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-gray-400 hidden md:table-cell">{l.code}</td>
                    <td className="px-6 py-4 font-bold text-gray-800">{l.product_name}</td>
                    <td className="px-6 py-4 text-center text-gray-600 font-bold">{l.quantity}</td>
                    <td className="px-6 py-4 text-right text-gray-500 font-medium hidden sm:table-cell">{l.unit_cost === null ? '—' : `${l.unit_cost.toFixed(2)} €`}</td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      {l.subtotal === null ? '—' : `${l.subtotal.toFixed(2)} €`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50/50 px-6 py-4 sm:px-8 sm:py-6 border-t border-gray-100 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-3">
        <div className="flex gap-6 sm:gap-10 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Unidades</span>
            <span className="text-lg sm:text-xl font-bold text-gray-900">{order.total_units}</span>
          </div>
          <div className="flex flex-col items-end sm:items-start">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Pedido</span>
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{order.total_cost === null ? '—' : `${order.total_cost.toFixed(2)} €`}</span>
          </div>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={onClose}
            className="flex-1 sm:flex-none px-4 sm:px-6 py-3 border border-gray-200 text-gray-500 hover:bg-white font-bold uppercase text-[10px] tracking-[0.2em] rounded-xl transition-all"
          >
            Cerrar
          </button>
          {order.received ? (
            <button
              onClick={onRevertClick}
              className="px-4 sm:px-6 py-3 border border-red-200 text-red-600 hover:bg-red-50 font-bold uppercase text-[10px] tracking-widest rounded-xl transition-all"
            >
              Devolver a Pendiente
            </button>
          ) : (
            <button
              onClick={onReceiveClick}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              Marcar Recibido
            </button>
          )}
        </div>
      </div>
    </>
  )
}

function DetailTab({ label, value }: Readonly<{ label: string, value: string }>) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{label}</span>
      <p className="text-sm font-bold text-gray-900">{value}</p>
    </div>
  )
}

export default function OrderDetailModal({ isOpen, orderId, onClose, onOrderReceived }: Readonly<OrderDetailModalProps>) {
  const { fetchOrderDetail, receiveOrder, revertOrder } = useSupplementOrders()
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [receiving, setReceiving] = useState(false)
  const [reverting, setReverting] = useState(false)
  const [showConfirmReceive, setShowConfirmReceive] = useState(false)
  const [showConfirmRevert, setShowConfirmRevert] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && orderId) {
      setLoading(true)
      fetchOrderDetail(orderId)
        .then(setOrder)
        .catch(err => setErrorMsg(err.message))
        .finally(() => setLoading(false))
    }
  }, [isOpen, orderId, fetchOrderDetail])

  if (!isOpen) return null

  const handleReceive = async () => {
    setReceiving(true)
    try {
      await receiveOrder(orderId)
      setShowConfirmReceive(false)
      onOrderReceived()
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Error al recibir el pedido.')
      setShowConfirmReceive(false)
    } finally {
      setReceiving(false)
    }
  }

  const handleRevert = async () => {
    setReverting(true)
    try {
      await revertOrder(orderId)
      setShowConfirmRevert(false)
      onOrderReceived() // Reuse the refresh callback
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Error al revertir el pedido.')
      setShowConfirmRevert(false)
    } finally {
      setReverting(false)
    }
  }

  // Lógica principal de renderizado simplificada para evitar ternarios anidados
  let mainContent;
  if (loading) {
    mainContent = <LoadingState />;
  } else if (errorMsg && !order) {
    mainContent = <ErrorState message={errorMsg} onClose={onClose} />;
  } else if (order) {
    mainContent = <OrderContent 
      order={order} 
      onClose={onClose} 
      onReceiveClick={() => setShowConfirmReceive(true)} 
      onRevertClick={() => setShowConfirmRevert(true)}
    />;
  } else {
    mainContent = <div className="p-20 text-center text-gray-400">No se encontró información.</div>;
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="fixed inset-0 transition-opacity bg-gray-900/60 backdrop-blur-sm" aria-hidden="true" onClick={onClose}></div>

        <div className="bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all w-full max-w-4xl flex flex-col max-h-[90vh] relative z-10 animate-in zoom-in-95 duration-300">
          {mainContent}
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmReceive}
        title="Confirmar recepción"
        message="¿Marcar este pedido como recibido? Se añadirán las unidades al stock de cada producto automáticamente."
        confirmLabel={receiving ? "Guardando..." : "Sí, marcar recibido"}
        cancelLabel="Cancelar"
        variant="primary"
        onConfirm={handleReceive}
        onClose={() => setShowConfirmReceive(false)}
      />

      <ConfirmModal
        isOpen={showConfirmRevert}
        title="Revertir Pedido"
        message="¿Estás seguro de que deseas devolver este pedido a estado PENDIENTE? Se RESTARÁN las unidades del stock automáticamente. Esta acción debe realizarse con precaución."
        confirmLabel={reverting ? "Procesando..." : "Sí, revertir a pendiente"}
        cancelLabel="No, mantener recibido"
        variant="danger"
        onConfirm={handleRevert}
        onClose={() => setShowConfirmRevert(false)}
      />

      {errorMsg && !loading && order && (
        <ConfirmModal 
          isOpen={true}
          title="Error"
          message={errorMsg}
          onConfirm={() => setErrorMsg(null)}
          onClose={() => setErrorMsg(null)}
          confirmLabel="Entendido"
          variant="primary"
        />
      )}
    </>
  )
}
