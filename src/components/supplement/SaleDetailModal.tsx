import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useSupplementSales, type Sale } from '../../hooks/useSupplementSales'
import ConfirmModal from '../ui/ConfirmModal'

type Props = {
  saleId: string
  onClose: () => void
  onRefresh: () => void
}

export default function SaleDetailModal({ saleId, onClose, onRefresh }: Readonly<Props>) {
  const { fetchSaleDetail } = useSupplementSales()
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmData, setConfirmData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'primary';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger'
  })

  const fetchSale = useCallback(async () => {
    try {
      const data = await fetchSaleDetail(saleId)
      setSale(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [saleId, fetchSaleDetail])

  useEffect(() => {
    fetchSale()
  }, [fetchSale])

  const handleDeleteLine = async (lineId: string) => {
    setConfirmData({
      isOpen: true,
      title: 'Eliminar Línea',
      message: '¿Estás seguro de que deseas eliminar esta línea? El stock del producto se restaurará automáticamente.',
      variant: 'danger',
      onConfirm: async () => {
        setIsDeleting(true)
        try {
          const { error } = await supabase
            .from('supplement_sale_lines')
            .delete()
            .eq('id', lineId)

          if (error) throw error
          
          await fetchSale()
          onRefresh()
        } catch (err) {
          console.error('Error deleting sale line:', err)
          setConfirmData({
            isOpen: true,
            title: 'Error',
            message: 'Error al eliminar la línea. Por favor, inténtalo de nuevo.',
            onConfirm: () => {},
            variant: 'primary'
          })
        } finally {
          setIsDeleting(false)
        }
      }
    })
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="py-20 text-center">
          <div className="inline-block w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )
    }

    if (!sale) {
      return <p className="text-center text-gray-500 text-sm italic py-10">No se pudo cargar la información.</p>
    }

    return (
      <div className="space-y-6">
        {/* Resumen Cabecera */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cliente</span>
            <p className="font-semibold text-gray-900">{sale.client_name || 'Venta General'}</p>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fecha</span>
            <p className="text-gray-700 font-medium">{sale.sale_date.split('-').reverse().join('/')}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Método</span>
            <p className="font-bold text-accent uppercase text-[10px] bg-accent/10 px-2 py-0.5 rounded-full inline-block">
              {sale.payment_method}
            </p>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Ticket</span>
            <p className="text-lg font-bold text-gray-900">{sale.total.toFixed(2)} €</p>
          </div>
          {sale.notes && (
            <div className="col-span-2 pt-2 border-t border-gray-100 mt-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Observaciones</span>
              <p className="text-xs text-gray-500 italic mt-1 leading-relaxed">{sale.notes}</p>
            </div>
          )}
        </div>

        {/* Listado de Líneas */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Productos Vendidos</h4>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-left text-sm min-w-[500px] sm:min-w-0">
              <thead className="bg-gray-50 border-b border-gray-50 font-bold text-gray-400 uppercase text-[9px] tracking-widest">
                <tr>
                  <th className="px-4 py-3">Detalle</th>
                  <th className="px-4 py-3 text-center">Cant.</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">Precio</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sale.lines?.map((line) => (
                  <tr key={line.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-800">{line.product_name}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-gray-600">{line.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-500 font-medium hidden sm:table-cell">{line.unit_price.toFixed(2)} €</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{line.subtotal.toFixed(2)} €</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteLine(line.id)}
                        disabled={isDeleting}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Eliminar línea"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
        {/* Cabecera modal */}
        <div className="px-6 py-4 sm:px-8 sm:py-6 border-b border-gray-100 bg-white shrink-0 flex justify-between items-center">
          <div className="flex flex-col">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 uppercase tracking-tight">Detalle de Venta</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 sm:p-8 overflow-y-auto bg-white">
          {renderContent()}
        </div>

        <div className="flex gap-3 px-6 py-4 sm:px-8 sm:py-6 border-t border-gray-100 bg-gray-50/50 shrink-0">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="w-full py-3 sm:py-3.5 rounded-2xl border border-gray-200 text-xs sm:text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all uppercase tracking-[0.2em]"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>

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
