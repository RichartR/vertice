import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useSupplementStock, type StockItem } from '../hooks/useSupplementStock'

export default function SupplementStockPage() {
  const { stockItems, loading, error, adjustStock } = useSupplementStock()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [outOfStockOnly, setOutOfStockOnly] = useState(false)
  const [showInactive, setShowInactive] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const [sortConfig, setSortConfig] = useState<{ key: keyof StockItem; direction: 'asc' | 'desc' } | null>(null)

  const [adjustingItem, setAdjustingItem] = useState<StockItem | null>(null)

  // Memoized filtering and sorting
  const filteredAndSortedItems = useMemo(() => {
    let items = [...stockItems]

    if (outOfStockOnly) {
      items = items.filter(item => item.quantity === 0)
    }

    if (showInactive) {
      items = items.filter(item => !item.active)
    } else {
      items = items.filter(item => item.active)
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase()
      items = items.filter(item => 
        item.product.toLowerCase().includes(lowerSearch) ||
        item.flavor?.toLowerCase().includes(lowerSearch) ||
        item.code.toString().includes(lowerSearch)
      )
    }

    if (sortConfig) {
      items.sort((a, b) => {
        let aVal = a[sortConfig.key]
        let bVal = b[sortConfig.key]
        
        aVal ??= ''
        bVal ??= ''

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return items
  }, [stockItems, searchTerm, outOfStockOnly, showInactive, sortConfig])

  const totalAgotados = stockItems.filter(item => item.quantity === 0).length
  const totalStockItems = stockItems.length

  const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage)
  const currentItems = filteredAndSortedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (key: keyof StockItem) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
    setCurrentPage(1)
  }

  const getSortIcon = (key: keyof StockItem) => {
    if (sortConfig?.key !== key) return null
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
          <p className="font-bold">Error cargando el stock</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  // Logic for table content extracted from nested ternary
  let tableContent
  if (loading && stockItems.length === 0) {
    tableContent = (
      <tr>
        <td colSpan={8} className="px-6 py-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400 font-medium">Cargando stock...</p>
        </td>
      </tr>
    )
  } else if (currentItems.length === 0) {
    tableContent = (
      <tr>
        <td colSpan={8} className="px-6 py-12 text-center">
          <p className="text-gray-400 font-medium text-lg">No se encontraron productos</p>
        </td>
      </tr>
    )
  } else {
    tableContent = currentItems.map((item) => {
      // Stock badge color logic
      let badgeClasses = 'bg-green-100 text-green-800'
      if (item.quantity === 0) {
        badgeClasses = 'bg-red-100 text-red-800'
      } else if (item.quantity < 10) {
        badgeClasses = 'bg-orange-100 text-orange-800'
      }

      return (
        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
          <td className="px-6 py-4 font-mono text-xs text-gray-500">{item.code}</td>
          <td className="px-6 py-4 font-bold text-gray-900">{item.product}</td>
          <td className="px-6 py-4 font-medium text-gray-600">{item.flavor || '—'}</td>
          <td className="px-6 py-4">
            {item.category ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                {item.category}
              </span>
            ) : '—'}
          </td>
          <td className="px-6 py-4 text-right font-medium text-gray-900">
            {item.srp ? `${item.srp.toFixed(2)} €` : '—'}
          </td>
          <td className="px-6 py-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${badgeClasses}`}>
                {item.quantity}
              </span>
              {item.quantity === 0 && (
                <span className="bg-red-500 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shadow-sm">
                  Agotado
                </span>
              )}
            </div>
          </td>
          <td className="px-6 py-4 text-center text-xs font-medium text-gray-500">
            {formatDate(item.updated_at)}
          </td>
          <td className="px-6 py-4 text-right">
            <button
              onClick={() => setAdjustingItem(item)}
              className="p-2 text-gray-400 hover:text-accent hover:bg-accent/10 rounded-xl transition-all"
              title="Ajustar Stock"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </td>
        </tr>
      )
    })
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 pb-32 animate-in fade-in duration-500">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-1 block">
          <span className="mx-2">←</span>
          <Link to="/admin/suplementacion" className="hover:text-gray-600">Suplementación</Link>
        </nav>

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock</h1>
        </div>
      </header>

      {/* Tools */}
      <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre, sabor o código..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-accent/20 focus:bg-white transition-all font-medium text-gray-900"
            />
          </div>
          <div className="flex items-center bg-gray-50 px-4 py-3 rounded-2xl gap-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="outOfStockFilter"
                checked={outOfStockOnly}
                onChange={(e) => { setOutOfStockOnly(e.target.checked); setCurrentPage(1); }}
                className="w-4 h-4 text-accent border-gray-300 rounded focus:ring-accent focus:ring-2"
              />
              <label htmlFor="outOfStockFilter" className="ml-2 text-sm font-bold text-gray-700 select-none cursor-pointer">
                Solo agotados
              </label>
            </div>
            
            <div className="flex items-center border-l-2 border-gray-200 pl-6">
              <input
                type="checkbox"
                id="inactiveFilter"
                checked={showInactive}
                onChange={(e) => { setShowInactive(e.target.checked); setCurrentPage(1); }}
                className="w-4 h-4 text-accent border-gray-300 rounded focus:ring-accent focus:ring-2"
              />
              <label htmlFor="inactiveFilter" className="ml-2 text-sm font-bold text-gray-700 select-none cursor-pointer">
                Ver Inactivos
              </label>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 px-5 py-3 rounded-2xl flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">{totalStockItems}<span className="text-gray-400 font-medium ml-1">productos</span></span>
          <span className="text-gray-300">·</span>
          <span className="text-sm font-bold text-red-600">{totalAgotados}<span className="text-gray-400 font-medium ml-1">agotados</span></span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 font-bold">
              <tr>
                <th className="px-6 py-5">Cód</th>
                <th className="px-6 py-5 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('product')}>
                  Producto {getSortIcon('product')}
                </th>
                <th className="px-6 py-5 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('flavor')}>
                  Sabor {getSortIcon('flavor')}
                </th>
                <th className="px-6 py-5 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('category')}>
                  Categoría {getSortIcon('category')}
                </th>
                <th className="px-6 py-5 text-right">SRP</th>
                <th className="px-6 py-5 cursor-pointer hover:bg-gray-100 transition-colors text-center" onClick={() => handleSort('quantity')}>
                  Stock Actual {getSortIcon('quantity')}
                </th>
                <th className="px-6 py-5 text-center">Última Acc.</th>
                <th className="px-6 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tableContent}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between mt-auto">
            <span className="text-sm font-medium text-gray-500">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredAndSortedItems.length)} de {filteredAndSortedItems.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-200 rounded-xl font-bold text-sm disabled:opacity-30 hover:bg-white transition-all"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-200 rounded-xl font-bold text-sm disabled:opacity-30 hover:bg-white transition-all"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {adjustingItem && (
        <StockAdjustmentModal
          item={adjustingItem}
          onClose={() => setAdjustingItem(null)}
          onAdjust={async (newQuantity, reason) => {
            await adjustStock({
              productId: adjustingItem.product_id,
              newQuantity,
              reason
            })
          }}
        />
      )}
    </div>
  )
}

function StockAdjustmentModal({ 
  item, 
  onClose, 
  onAdjust 
}: Readonly<{ 
  item: StockItem; 
  onClose: () => void; 
  onAdjust: (qty: number, reason: string) => Promise<void> 
}>) {
  const [quantity, setQuantity] = useState(item.quantity.toString())
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    const qty = Number.parseInt(quantity, 10)
    if (Number.isNaN(qty) || qty < 0) {
      setError('Por favor, introduce una cantidad válida (mayor o igual a cero).')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await onAdjust(qty, reason)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el stock.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="fixed inset-0 transition-opacity bg-gray-900/60 backdrop-blur-sm" aria-hidden="true" onClick={onClose}></div>

      <div className="bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all w-full max-w-lg relative z-10 animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-gray-100 bg-white">
          <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Ajuste de Stock</h3>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center space-y-2">
            <h4 className="text-lg font-bold text-gray-900">{item.product}</h4>
            {item.flavor && <p className="text-sm font-medium text-gray-500">Sabor: {item.flavor}</p>}
            <p className="text-xs font-mono text-gray-400">Cod: {item.code}</p>
            
            <div className="inline-flex items-center gap-2 mt-4 text-sm font-bold bg-white px-4 py-2 rounded-full border border-gray-200">
               <span className="text-gray-400 uppercase tracking-widest text-[10px]">Stock actual:</span>
               <span className="text-lg">{item.quantity}</span>
            </div>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label htmlFor="new-quantity" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                Nueva Cantidad
              </label>
              <input
                id="new-quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-accent/20 focus:border-accent outline-none transition-all font-bold text-gray-900 text-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="adjust-reason" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                Motivo del ajuste (Opcional)
              </label>
              <textarea
                id="adjust-reason"
                rows={2}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Ej: Corrección de inventario, rotura de stock..."
                className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-accent/20 focus:border-accent outline-none transition-all resize-y font-medium text-gray-900"
              />
            </div>
            
            <p className="text-[11px] font-medium text-gray-500 bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 flex">
               <svg className="w-4 h-4 text-blue-500 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               Este ajuste establecerá el stock al valor indicado en el campo "Nueva cantidad", no lo incrementará ni decrementará.
            </p>
          </div>
        </div>

        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 font-bold text-gray-500 hover:text-gray-900 transition-all rounded-xl hover:bg-white"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || quantity === ''}
            className="px-8 py-3.5 bg-accent-dark hover:bg-accent text-accent-darker font-bold uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-accent-dark/20 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? 'Guardando...' : 'Guardar ajuste'}
          </button>
        </div>
      </div>
    </div>
  )
}
