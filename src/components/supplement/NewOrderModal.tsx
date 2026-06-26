import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSupplementProducts } from '../../hooks/useSupplementProducts'
import { useSupplementOrders } from '../../hooks/useSupplementOrders'
import ConfirmModal from '../ui/ConfirmModal'
import Tooltip from '../ui/Tooltip'
import { parsePdfInvoice } from '../../utils/parsePdfInvoice'

interface NewOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onOrderCreated: () => void
}

type OrderLineState = {
  id: string
  productId: string
  quantity: number
  unitCost: number | ''
  discount: number
}

/**
 * Componente para una línea individual de pedido
 */
interface OrderLineItemProps {
  line: OrderLineState
  products: any[]
  onUpdate: (id: string, updates: Partial<OrderLineState>) => void
  onRemove: (id: string) => void
}

function OrderLineItem({ line, products, onUpdate, onRemove }: Readonly<OrderLineItemProps>) {
  const subtotal = typeof line.unitCost === 'number' ? (line.quantity * line.unitCost * (1 - line.discount / 100)) : 0
  const qtyId = `qty-${line.id}`
  const costId = `cost-${line.id}`
  const discountId = `disc-${line.id}`

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-start p-4 sm:p-6 bg-gray-50/50 rounded-3xl border border-gray-100 hover:border-gray-200 transition-all group shadow-sm relative pb-12 sm:pb-6">
      <div className="flex-1 min-w-0 space-y-3">
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">Producto</label>
        <ProductSelector 
          value={line.productId}
          onChange={(productId) => onUpdate(line.id, { productId })}
          products={products}
        />
      </div>
      
      <div className="w-20 sm:w-20 shrink-0 space-y-2">
        <label htmlFor={qtyId} className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">Cant.</label>
        <input
          id={qtyId}
          type="number"
          min="1"
          value={line.quantity}
          onChange={e => onUpdate(line.id, { quantity: Number.parseInt(e.target.value, 10) || 1 })}
          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-accent/20 focus:border-accent outline-none text-center font-bold text-sm text-gray-900 transition-all"
        />
      </div>
      
      <div className="w-28 sm:w-28 shrink-0 space-y-2">
        <label htmlFor={costId} className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">Costo Unit.</label>
        <div className="relative">
          <input
            id={costId}
            type="number"
            step="0.01"
            min="0"
            value={line.unitCost}
            onChange={e => onUpdate(line.id, { unitCost: e.target.value === '' ? '' : Number.parseFloat(e.target.value) })}
            placeholder="0.00"
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-accent/20 focus:border-accent outline-none font-bold text-sm text-gray-900 text-right pr-8 transition-all"
          />
          <span className="absolute right-3 top-2 text-gray-400 font-bold text-xs">€</span>
        </div>
      </div>
      
      <div className="w-20 sm:w-20 shrink-0 space-y-2">
        <label htmlFor={discountId} className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">Dto. %</label>
        <div className="relative">
          <input
            id={discountId}
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={line.discount}
            onChange={e => onUpdate(line.id, { discount: Math.min(100, Math.max(0, Number.parseFloat(e.target.value) || 0)) })}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-accent/20 focus:border-accent outline-none font-bold text-sm text-gray-900 text-right pr-6 transition-all"
          />
          <span className="absolute right-2 top-2 text-gray-400 font-bold text-xs">%</span>
        </div>
      </div>

      <div className="w-full sm:w-28 shrink-0 space-y-1 sm:space-y-2 text-left sm:text-right flex justify-between sm:block">
         <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Subtotal</label>
         <div className="py-0 sm:py-1.5 font-black text-gray-900 text-base sm:text-lg tracking-tight">
            {subtotal > 0 ? `${subtotal.toFixed(2)} €` : '—'}
         </div>
      </div>

      <button 
        onClick={() => onRemove(line.id)}
        className="absolute bottom-3 right-3 sm:static sm:mt-9 p-2 sm:p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
        title="Eliminar línea"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}

export default function NewOrderModal({ isOpen, onClose, onOrderCreated }: Readonly<NewOrderModalProps>) {
  const { products, fetchProducts } = useSupplementProducts()
  const { createOrder } = useSupplementOrders()
  
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<OrderLineState[]>([])
  const [saving, setSaving] = useState(false)
  const [errorModal, setErrorModal] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ matched: number; unmatched: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      fetchProducts()
      setLines([
        { id: Math.random().toString(36).slice(2), productId: '', quantity: 1, unitCost: '', discount: 0 }
      ])
      setOrderDate(new Date().toISOString().split('T')[0])
      setNotes('')
    }
  }, [isOpen, fetchProducts])

  if (!isOpen) return null

  const handleAddLine = () => {
    setLines(prev => [...prev, { id: Math.random().toString(36).slice(2), productId: '', quantity: 1, unitCost: '', discount: 0 }])
  }

  const handleRemoveLine = (id: string) => {
    setLines(prev => prev.filter(l => l.id !== id))
  }

  const handleUpdateLine = (id: string, updates: Partial<OrderLineState>) => {
    setLines(prev => prev.map(l => {
      if (l.id !== id) return l
      const updated = { ...l, ...updates }
      if ('productId' in updates) {
        const product = products.find(p => p.id === updates.productId)
        updated.unitCost = product?.pb ?? ''
      }
      return updated
    }))
  }

  const handlePdfImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setImporting(true)
    setImportResult(null)
    try {
      const result = await parsePdfInvoice(file)

      if (result.lines.length === 0) {
        setErrorModal('No se encontraron líneas de producto en el PDF. Comprueba que el formato de la factura es compatible.')
        return
      }

      const newLines: OrderLineState[] = []
      let matched = 0
      let unmatched = 0

      for (const invoiceLine of result.lines) {
        const digits = String(invoiceLine.code)
        const isEan = digits.length > 4
        if (isEan) {
          const eanMatch = products.find(p => p.ean === digits)
          if (eanMatch) {
            newLines.push({
              id: Math.random().toString(36).slice(2),
              productId: eanMatch.id,
              quantity: invoiceLine.quantity,
              unitCost: invoiceLine.unitCost,
              discount: invoiceLine.discount,
            })
            matched++
            continue
          }
        }
        const product = products.find(p => {
          const isEanLookup = digits.length > 4
          if (isEanLookup) return p.ean === digits
          if (p.code !== invoiceLine.code) return false
          if (invoiceLine.description && p.product) {
            const pdfDescUpper = invoiceLine.description.toUpperCase()
            const dbProductWords = p.product.toUpperCase().split(/\s+/).filter((w: string) => w.length > 2)
            if (!dbProductWords.every((w: string) => pdfDescUpper.includes(w))) return false
          }
          if (!invoiceLine.flavor || !p.flavor) return true
          const dbFlavor = p.flavor.toUpperCase()
          return invoiceLine.flavor.split(/\s+/).every((w: string) => dbFlavor.includes(w))
        })
        if (product) {
          newLines.push({
            id: Math.random().toString(36).slice(2),
            productId: product.id,
            quantity: invoiceLine.quantity,
            unitCost: invoiceLine.unitCost,
            discount: invoiceLine.discount,
          })
          matched++
        } else {
          unmatched++
        }
      }

      if (newLines.length > 0) {
        setLines(newLines)
      }
      setImportResult({ matched, unmatched })
    } catch (err: any) {
      console.error(err)
      setErrorModal('Error al leer el PDF: ' + (err.message || 'Error desconocido'))
    } finally {
      setImporting(false)
    }
  }

  const subtotal = lines.reduce((acc, line) => {
    const cost = typeof line.unitCost === 'number' ? line.unitCost : 0
    return acc + (line.quantity * cost * (1 - line.discount / 100))
  }, 0)

  const vatAmount = subtotal * 0.10
  const totalWithVat = subtotal + vatAmount

  const isFormValid = lines.length > 0 && lines.every(l => l.productId && l.quantity > 0)
  
  const handleSubmit = async () => {
    if (!isFormValid) {
      setErrorModal('Debes completar todos los campos obligatorios.')
      return
    }

    setSaving(true)
    try {
      await createOrder({
        orderDate,
        notes,
        lines: lines.map(l => ({
          productId: l.productId,
          quantity: l.quantity,
          unitCost: typeof l.unitCost === 'number' ? l.unitCost : undefined,
          discount: l.discount
        }))
      })
      onOrderCreated()
    } catch (err: any) {
      console.error(err)
      setErrorModal(err.message || 'Error al crear el pedido.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="fixed inset-0 transition-opacity bg-gray-900/60 backdrop-blur-sm" aria-hidden="true" onClick={onClose}></div>

      <div className="bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all w-full max-w-4xl flex flex-col max-h-[90vh] relative z-10 border border-white/20">
        <div className="px-6 py-4 sm:px-8 sm:py-6 border-b border-gray-100 shrink-0 bg-white flex justify-between items-center text-gray-900 uppercase">
          <h3 className="text-lg sm:text-xl font-bold tracking-tight">Nuevo Pedido</h3>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handlePdfImport}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-accent-darker bg-accent-dark/10 hover:bg-accent-dark/20 rounded-xl transition-all disabled:opacity-50"
              title="Importar desde factura PDF"
            >
              {importing ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              )}
              {importing ? 'Leyendo...' : 'Importar PDF'}
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-8 overflow-y-auto space-y-8 sm:space-y-10 flex-1 scrollbar-hide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-1.5">
              <label htmlFor="order-date" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Fecha del pedido</label>
              <input
                id="order-date"
                type="date"
                value={orderDate}
                onChange={e => setOrderDate(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-accent/20 focus:border-accent outline-none transition-all font-bold text-gray-900"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="order-notes" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Notas (Opcional)</label>
              <textarea
                id="order-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={1}
                className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-accent/20 focus:border-accent outline-none transition-all resize-y font-medium text-gray-900"
                placeholder="Ej: Pedido a central de Vitobest..."
              />
            </div>
          </div>

          {importResult && (
            <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-medium ${importResult.unmatched > 0 ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-green-50 border border-green-200 text-green-800'}`}>
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={importResult.unmatched > 0 ? "M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" : "M5 13l4 4L19 7"} />
              </svg>
              <span>
                <strong>{importResult.matched}</strong> producto{importResult.matched === 1 ? '' : 's'} importado{importResult.matched === 1 ? '' : 's'}
                {importResult.unmatched > 0 && <> · <strong>{importResult.unmatched}</strong> código{importResult.unmatched === 1 ? '' : 's'} no encontrado{importResult.unmatched === 1 ? '' : 's'} en catálogo</>}
              </span>
              <button onClick={() => setImportResult(null)} className="ml-auto text-current opacity-50 hover:opacity-100">✕</button>
            </div>
          )}

          <div className="space-y-6">
            <div className="flex justify-between items-center px-1">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Líneas de Pedido</h4>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">{lines.length} productos</span>
            </div>
            
            <div className="space-y-4">
              {lines.map((line) => (
                <OrderLineItem 
                  key={line.id} 
                  line={line} 
                  products={products} 
                  onUpdate={handleUpdateLine} 
                  onRemove={handleRemoveLine} 
                />
              ))}
            </div>
            
            <button
              onClick={handleAddLine}
              className="w-full py-4 border-2 border-dashed border-gray-100 text-gray-400 font-bold uppercase text-[10px] tracking-widest rounded-2xl hover:border-accent hover:bg-accent/5 hover:text-accent-dark transition-all flex justify-center items-center gap-3 active:scale-[0.99] transform"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
              Añadir otro producto
            </button>
          </div>
        </div>

        <div className="px-6 py-4 sm:px-8 sm:py-6 bg-gray-50 border-t border-gray-100 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap justify-center sm:justify-start gap-x-8 gap-y-2">
            <div className="flex flex-col items-center sm:items-start">
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Base Imponible</span>
               <p className="text-lg font-bold text-gray-700">{subtotal.toFixed(2)} <span className="text-xs font-bold text-gray-400">€</span></p>
            </div>
            <div className="flex flex-col items-center sm:items-start">
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">I.V.A. (10%)</span>
               <p className="text-lg font-bold text-gray-700">{vatAmount.toFixed(2)} <span className="text-xs font-bold text-gray-400">€</span></p>
            </div>
            <div className="flex flex-col items-center sm:items-start scale-110 sm:scale-125 origin-left px-4 sm:px-0">
               <span className="text-[10px] font-bold text-accent-darker uppercase tracking-widest mb-0.5">Total Factura</span>
               <p className="text-xl sm:text-2xl font-black text-gray-900">{totalWithVat.toFixed(2)} <span className="text-sm font-bold text-gray-400">€</span></p>
            </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
             <button
               onClick={onClose}
               className="flex-1 sm:flex-none px-4 sm:px-6 py-3 font-bold text-gray-500 hover:text-gray-900 transition-all rounded-xl hover:bg-white text-xs sm:text-sm"
             >
               Cancelar
             </button>
             <button
               onClick={handleSubmit}
               disabled={!isFormValid || saving}
               className="flex-1 sm:flex-none px-4 sm:px-8 py-3.5 bg-accent-dark hover:bg-accent text-accent-darker font-bold uppercase text-[9px] sm:text-[10px] tracking-widest rounded-xl shadow-lg shadow-accent-dark/20 transition-all disabled:opacity-30 disabled:scale-100 transform active:scale-95 flex items-center justify-center gap-2"
             >
               {saving ? 'Guardando...' : 'Crear pedido'}
               {!saving && (
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                 </svg>
               )}
             </button>
          </div>
        </div>
      </div>
      
      {errorModal && (
        <ConfirmModal 
          isOpen={true}
          title="Error"
          message={errorModal}
          onConfirm={() => setErrorModal(null)}
          onClose={() => setErrorModal(null)}
          confirmLabel="Entendido"
          variant="primary"
        />
      )}
    </div>
  )
}


interface ProductSelectorProps {
  value: string
  onChange: (val: string) => void
  products: any[]
}

function ProductSelector({ value, onChange, products }: Readonly<ProductSelectorProps>) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})

  const selectedProduct = products.find(p => p.id === value)

  const handleToggle = () => {
    if (!open && triggerRef.current) {
      setSearchTerm('')
      const rect = triggerRef.current.getBoundingClientRect()
      const minWidth = 420
      const width = Math.max(rect.width, minWidth)
      const left = Math.min(rect.left, window.innerWidth - width - 8)
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: Math.max(8, left),
        width,
        zIndex: 9999,
      })
    }
    setOpen(!open)
  }

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node
      if (triggerRef.current?.contains(target) || dropdownRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const filtered = products.filter(p => {
    const s = searchTerm.toLowerCase()
    return (p.product || '').toLowerCase().includes(s) ||
           (p.flavor || '').toLowerCase().includes(s) ||
           (p.code?.toString() || '').includes(s) ||
           (p.ean || '').includes(s)
  })

  const tooltipText = selectedProduct
    ? `${selectedProduct.product}${selectedProduct.flavor ? ' - ' + selectedProduct.flavor : ''}${selectedProduct.ean ? ' · EAN: ' + selectedProduct.ean : ''}`
    : ''

  const trigger = (
    <button
      ref={triggerRef}
      type="button"
      onClick={handleToggle}
      className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all text-left"
    >
      <div className="truncate flex-1">
        {selectedProduct ? (
          <span className="font-medium text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis block">
            [{selectedProduct.code}] {selectedProduct.product} {selectedProduct.flavor ? `(${selectedProduct.flavor})` : ''}
          </span>
        ) : (
          <span className="text-gray-400">Seleccionar producto...</span>
        )}
      </div>
      <span className={`text-gray-400 text-xs shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
    </button>
  )

  return (
    <div>
      {selectedProduct ? (
        <Tooltip text={tooltipText}>
          {trigger}
        </Tooltip>
      ) : trigger}

      {open && createPortal(
        <div ref={dropdownRef} style={dropdownStyle} className="bg-white rounded-lg border border-gray-200 shadow-xl overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-100 shrink-0">
            <input
              autoFocus
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, sabor o código..."
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50"
              onClick={e => e.stopPropagation()}
            />
          </div>
          <ul className="max-h-80 overflow-y-auto w-full py-1">
            {filtered.map(p => {
               let badgeColor = 'bg-red-100 text-red-700';
               if (p.stock >= 10) badgeColor = 'bg-green-100 text-green-700';
               else if (p.stock > 0) badgeColor = 'bg-orange-100 text-orange-700';

               const handleSelect = () => {
                 onChange(p.id)
                 setOpen(false)
               }

               return (
                 <li
                   key={p.id}
                   role="button"
                   tabIndex={0}
                   onClick={handleSelect}
                   onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleSelect() }}
                   className={`px-4 py-2.5 cursor-pointer transition-colors flex justify-between items-center gap-3 ${
                     p.id === value ? 'bg-accent/10 border-l-2 border-accent-dark' : 'hover:bg-gray-50 border-l-2 border-transparent'
                   }`}
                 >
                   <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-gray-900 text-sm leading-tight">{p.product}</span>
                      {p.flavor && <span className="text-xs text-gray-500 leading-tight mt-0.5">{p.flavor}</span>}
                      <span className="text-[11px] text-gray-400 mt-0.5">Cód: {p.code}{p.ean ? ` · EAN: ${p.ean}` : ''}</span>
                   </div>
                   <div className={`px-2 py-0.5 rounded text-xs font-semibold shrink-0 ${badgeColor}`}>
                      {p.stock} disp.
                   </div>
                 </li>
               )
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-sm text-center text-gray-400">
                Sin resultados
              </li>
            )}
          </ul>
        </div>,
        document.body
      )}
    </div>
  )
}
