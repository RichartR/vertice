import { useState, useEffect } from 'react'
import type { SupplementProduct } from '../../hooks/useSupplementProducts'

const CATEGORIES = [
  'PROTEINS', 'GAINERS', 'WEIGHT INCREASERS AND MUSCLE MASS', 'CARBOHYDRATES', 
  'ENERGIZERS', 'PREWORKOUT', 'AMINO ACIDS', 'CREATINS', 'FAT BURNER', 
  'VITAMINS AND MINERALS', 'ESSENTIALS', 'HEALTHY PRODUCTS', 'WOMAN HEALTH', 
  'MAN HEALTH', 'HORMONAL OPTIMIZERS', 'ENDURANCE', 'CROSS FIT', 
  'INTRAWORKOUT', 'PRICES EX WORKS', 'FITNESS HOME'
]

type ProductModalProps = {
  product?: SupplementProduct | null
  onClose: () => void
  onSave: (data: Omit<SupplementProduct, 'id' | 'stock'>) => Promise<void>
}

export default function ProductModal({ product, onClose, onSave }: Readonly<ProductModalProps>) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [code, setCode] = useState(product?.code?.toString() ?? '')
  const [name, setName] = useState(product?.product ?? '')
  const [flavor, setFlavor] = useState(product?.flavor ?? '')
  const [pb, setPb] = useState(product?.pb?.toString() ?? '')
  const [srp, setSrp] = useState(product?.srp?.toString() ?? '')
  const [ean, setEan] = useState(product?.ean ?? '')
  const [active, setActive] = useState(product?.active ?? true)
  
  // Logic for Category (Select vs Custom)
  const initialCat = product?.category ?? ''
  const isCustomInit = initialCat !== '' && !CATEGORIES.includes(initialCat)
  const [selectedCategory, setSelectedCategory] = useState(isCustomInit ? 'OTRA' : initialCat)
  const [customCategory, setCustomCategory] = useState(isCustomInit ? initialCat : '')

  // Prevent scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'auto' }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      if (!code || !name) throw new Error('Los campos código y nombre son obligatorios.')
      
      const finalCategory = selectedCategory === 'OTRA' ? customCategory : selectedCategory

      await onSave({
        code: parseInt(code, 10),
        product: name,
        flavor: flavor || null,
        pb: pb ? parseFloat(pb) : null,
        srp: srp ? parseFloat(srp) : null,
        ean: ean || null,
        category: finalCategory || null,
        active
      })
      
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-full">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {product ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Código *</label>
              <input 
                type="number" 
                required 
                value={code} 
                onChange={e => setCode(e.target.value)} 
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-accent focus:border-accent text-sm py-2 px-3 border"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nombre del producto *</label>
              <input 
                type="text" 
                required 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-accent focus:border-accent text-sm py-2 px-3 border"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sabor</label>
              <input 
                type="text" 
                value={flavor} 
                onChange={e => setFlavor(e.target.value)} 
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-accent focus:border-accent text-sm py-2 px-3 border"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
              <select 
                value={selectedCategory} 
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-accent focus:border-accent text-sm py-2 px-3 border"
              >
                <option value="">(Sin categoría)</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="OTRA">Otra (Especificar)</option>
              </select>
            </div>
          </div>

          {selectedCategory === 'OTRA' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nueva categoría</label>
              <input 
                type="text" 
                value={customCategory} 
                onChange={e => setCustomCategory(e.target.value)} 
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-accent focus:border-accent text-sm py-2 px-3 border"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">P.B (€)</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                value={pb} 
                onChange={e => setPb(e.target.value)} 
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-accent focus:border-accent text-sm py-2 px-3 border"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">SRP (€)</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                value={srp} 
                onChange={e => setSrp(e.target.value)} 
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-accent focus:border-accent text-sm py-2 px-3 border"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">EAN</label>
              <input 
                type="text" 
                value={ean} 
                onChange={e => setEan(e.target.value)} 
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-accent focus:border-accent text-sm py-2 px-3 border"
              />
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <input 
              type="checkbox" 
              id="activeProductCheckbox"
              checked={active}
              onChange={e => setActive(e.target.checked)}
              className="rounded border-gray-300 text-accent focus:ring-accent w-4 h-4"
            />
            <label htmlFor="activeProductCheckbox" className="text-sm font-medium text-gray-700">
              Producto activo y visible
            </label>
          </div>
          
          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-gray-900 bg-accent hover:bg-accent-dark rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar producto'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
