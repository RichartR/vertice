import { useState, useMemo, useEffect } from 'react'
import { useSupplementProducts } from '../../hooks/useSupplementProducts'
import { type SupplementClient } from '../../hooks/useSupplementClients'
import SupplementClientSelector from './SupplementClientSelector'
import { useSupplementSales } from '../../hooks/useSupplementSales'
import Select from '../ui/Select'
import ConfirmModal from '../ui/ConfirmModal'

type Props = {
  onClose: () => void
  onSuccess: () => void
}

interface SaleLine {
  id: string
  productId: string
  quantity: number
  unitPrice: number
}

export default function NewSaleModal({ onClose, onSuccess }: Readonly<Props>) {
  const [step, setStep] = useState(1)
  const { products, fetchProducts, loading: loadingProducts } = useSupplementProducts()
  const { createSale } = useSupplementSales()
  
  // Step 1 State
  const [selectedClient, setSelectedClient] = useState<SupplementClient | null>(null)
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'bizum' | ''>('')
  const [notes, setNotes] = useState('')

  // Step 2 State
  const [lines, setLines] = useState<SaleLine[]>([
    { id: crypto.randomUUID(), productId: '', quantity: 1, unitPrice: 0 }
  ])

  const [saving, setSaving] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Helpers
  const totalAmount = useMemo(() => {
    return lines.reduce((acc, line) => acc + (line.quantity * line.unitPrice), 0)
  }, [lines])

  const handleAddLine = () => {
    setLines([...lines, { id: crypto.randomUUID(), productId: '', quantity: 1, unitPrice: 0 }])
  }

  const handleRemoveLine = (id: string) => {
    setLines(lines.filter(line => line.id !== id))
  }

  const handleUpdateLine = (id: string, data: Partial<Omit<SaleLine, 'id'>>) => {
    setLines(prev => prev.map(line => {
      if (line.id !== id) return line
      
      const updatedLine = { ...line, ...data }
      
      if (data.productId) {
        const p = products.find(prod => prod.id === data.productId)
        if (p) {
          updatedLine.unitPrice = p.srp ?? 0
        }
      }
      
      return updatedLine
    }))
  }

  const handleConfirm = async () => {
    setSaving(true)
    try {
      if (!paymentMethod) throw new Error('Selecciona un método de pago')
      
      await createSale({
        clientId: selectedClient?.id ?? null,
        saleDate,
        paymentMethod: paymentMethod,
        notes,
        lines: lines.map(l => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.unitPrice
        }))
      })
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error creating sale:', err)
      setErrorMessage('Error al crear la venta. Por favor revisa los datos.')
      setShowErrorModal(true)
    } finally {
      setSaving(false)
    }
  }

  const nextStep = () => setStep(prev => prev + 1)
  const prevStep = () => setStep(prev => prev - 1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-6 py-4 sm:px-8 sm:py-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex flex-col">
             <h2 className="text-xl font-bold text-gray-900 tracking-tight">Nueva Venta</h2>
             <div className="flex items-center gap-2 mt-2">
                <span className={`w-12 h-1.5 rounded-full transition-colors ${step >= 1 ? 'bg-accent' : 'bg-gray-100'}`} />
                <span className={`w-12 h-1.5 rounded-full transition-colors ${step >= 2 ? 'bg-accent' : 'bg-gray-100'}`} />
                <span className={`w-12 h-1.5 rounded-full transition-colors ${step >= 3 ? 'bg-accent' : 'bg-gray-100'}`} />
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
            aria-label="Cerrar modal"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-hide">
          {step === 1 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <SupplementClientSelector value={selectedClient} onChange={setSelectedClient} />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="sale-date" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Fecha de venta</label>
                  <input 
                    id="sale-date"
                    type="date"
                    value={saleDate}
                    onChange={e => setSaleDate(e.target.value)}
                    className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl shadow-inner focus:ring-2 focus:ring-accent/50 outline-none font-medium transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Método de Pago *</span>
                  <div className="flex gap-2">
                    {['efectivo', 'tarjeta', 'bizum'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m as any)}
                        className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-all rounded-2xl border-2 ${
                          paymentMethod === m 
                            ? 'bg-accent text-gray-900 border-accent shadow-lg shadow-accent/20 scale-[1.02]' 
                            : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="sale-notes" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Notas (Opcional)</label>
                <textarea
                  id="sale-notes"
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Añade información relevante sobre la venta..."
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl shadow-inner focus:ring-2 focus:ring-accent/50 outline-none resize-none text-sm font-medium transition-all"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-4">
                {lines.map((line) => {
                  const product = products.find(p => p.id === line.productId);
                  const flavorSuffix = product?.flavor ? ` (${product.flavor})` : '';
                  const productLabel = product ? `${product.product}${flavorSuffix} - Stock: ${product.stock}` : 'Seleccionar producto...';
                  
                  return (
                    <div key={line.id} className="flex flex-col sm:flex-row gap-4 p-4 sm:p-6 bg-gray-50/50 rounded-3xl border border-gray-100 relative group hover:bg-white hover:shadow-xl transition-all duration-300 pb-12 sm:pb-6">
                      <div className="flex-1 min-w-0 space-y-2">
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">{productLabel}</label>
                        <Select
                          value={line.productId}
                          onChange={v => handleUpdateLine(line.id, { productId: v })}
                          disabled={loadingProducts}
                          placeholder={loadingProducts ? "Cargando productos..." : "Seleccionar producto..."}
                          options={products.filter(p => p.active).map(p => {
                            const fSuffix = p.flavor ? ` (${p.flavor})` : '';
                            return {
                              value: p.id,
                              label: `${p.product}${fSuffix} - Stock: ${p.stock}`
                            };
                          })}
                        />
                        {line.productId && (() => {
                          const stock = products.find(p => p.id === line.productId)?.stock ?? 0;
                          if (stock === 0) return <p className="mt-1 text-xs font-semibold text-red-500 uppercase ml-1">Stock Agotado</p>;
                          if (line.quantity > stock) return <p className="mt-1 text-xs font-semibold text-orange-500 uppercase ml-1">Stock insuficiente ({stock} disp.)</p>;
                          return null;
                        })()}
                      </div>
                      <div className="w-full sm:w-24 shrink-0 space-y-2">
                        <label htmlFor={`qty-${line.id}`} className="block text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Cant.</label>
                        <input 
                          id={`qty-${line.id}`}
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={e => handleUpdateLine(line.id, { quantity: Number.parseInt(e.target.value, 10) || 1 })}
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent/50 outline-none text-center font-bold"
                        />
                      </div>
                      <div className="w-full sm:w-32 shrink-0 space-y-2">
                        <label htmlFor={`price-${line.id}`} className="block text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Precio</label>
                        <div className="relative">
                          <input 
                            id={`price-${line.id}`}
                            type="number"
                            step="0.01"
                            value={line.unitPrice}
                            onChange={e => handleUpdateLine(line.id, { unitPrice: Number.parseFloat(e.target.value) || 0 })}
                            className="w-full px-4 py-2.5 pl-8 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent/50 outline-none font-bold"
                          />
                          <span className="absolute left-3 top-2.5 text-gray-400 font-bold">€</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveLine(line.id)}
                        className="absolute bottom-3 right-3 sm:static sm:mt-8 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Eliminar línea"
                        aria-label="Eliminar línea"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
              
              <button
                onClick={handleAddLine}
                className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-accent hover:text-accent font-semibold text-sm transition-all"
              >
                ＋ Añadir producto
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 p-6 sm:p-8 bg-gray-50 border border-gray-100 rounded-3xl text-gray-900 shadow-sm">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</span>
                  <p className="text-lg font-bold truncate">{selectedClient ? selectedClient.full_name : 'Venta General'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</span>
                  <p className="text-lg font-bold">{saleDate.split('-').reverse().join('/')}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Método</span>
                  <p className="text-lg font-bold text-gray-900 uppercase">{paymentMethod}</p>
                </div>
                <div className="space-y-1 text-right">
                   <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Ticket</span>
                   <p className="text-2xl font-bold">{totalAmount.toFixed(2)} €</p>
                </div>
              </div>

              <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-3xl border border-gray-100 shadow-sm">
                <table className="w-full text-left text-sm min-w-[500px] sm:min-w-0">
                  <thead className="bg-gray-50 border-b border-gray-100 font-semibold text-gray-500 uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Producto</th>
                      <th className="px-6 py-4 text-center">Cant.</th>
                      <th className="px-6 py-4 text-right">P. Unit.</th>
                      <th className="px-6 py-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {lines.map((l) => {
                      const p = products.find(prod => prod.id === l.productId);
                      let productName = 'No seleccionado';
                      if (p) {
                        const flavorPart = p.flavor ? ` (${p.flavor})` : '';
                        productName = `${p.product}${flavorPart}`;
                      }
                      return (
                        <tr key={l.id}>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-gray-800">{productName}</td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-center font-medium text-gray-600">{l.quantity}</td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-right text-gray-500 font-medium">{l.unitPrice.toFixed(2)} €</td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-semibold text-gray-900">{(l.quantity * l.unitPrice).toFixed(2)} €</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 sm:px-8 sm:py-6 border-t border-gray-100 bg-gray-50/50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total acumulado</span>
            <span className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{totalAmount.toFixed(2)} €</span>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
             {step > 1 && (
               <button
                 onClick={prevStep}
                 disabled={saving}
                 className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-all rounded-lg"
               >
                 Anterior
               </button>
             )}
             
             {step < 3 ? (
               <button
                 onClick={nextStep}
                 disabled={step === 1 ? !paymentMethod : (lines.length === 0 || lines.some(l => !l.productId || (products.find(p => p.id === l.productId)?.stock ?? 0) < l.quantity))}
                 className="px-6 py-2.5 bg-accent-dark hover:bg-accent text-gray-800 font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 text-sm"
               >
                 Siguiente Paso
               </button>
             ) : (
               <button
                 onClick={handleConfirm}
                 disabled={saving}
                 className="px-6 py-2.5 bg-accent-dark hover:bg-accent text-gray-800 font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 text-sm"
               >
                 {saving ? (
                   <span className="w-4 h-4 border-2 border-gray-800/20 border-t-gray-800 rounded-full animate-spin" />
                 ) : (
                   <>
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                     </svg>
                     Confirmar Venta
                   </>
                 )}
               </button>
             )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showErrorModal}
        title="Hubo un problema"
        message={errorMessage}
        variant="primary"
        confirmLabel="Entendido"
        onConfirm={() => setShowErrorModal(false)}
        onClose={() => setShowErrorModal(false)}
      />
    </div>
  )
}
