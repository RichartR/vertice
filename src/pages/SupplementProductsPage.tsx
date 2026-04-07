import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useSupplementProducts, type SupplementProduct } from '../hooks/useSupplementProducts'
import ProductModal from '../components/supplementation/ProductModal'
import Select from '../components/ui/Select'

const ITEMS_PER_PAGE = 15

export default function SupplementProductsPage() {
  const { products, loading, fetchProducts, createProduct, updateProduct, toggleActive } = useSupplementProducts()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active')
  const [currentPage, setCurrentPage] = useState(1)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<SupplementProduct | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Local filtering
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // 1. Filter by status
      if (statusFilter === 'active' && !p.active) return false
      if (statusFilter === 'inactive' && p.active) return false
      
      // 2. Filter by search term
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase()
        const matchProduct = p.product.toLowerCase().includes(lowerSearch)
        const matchFlavor = p.flavor?.toLowerCase().includes(lowerSearch) ?? false
        const matchCode = p.code.toString().includes(lowerSearch)
        
        if (!matchProduct && !matchFlavor && !matchCode) {
          return false
        }
      }
      return true
    })
  }, [products, searchTerm, statusFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE))
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredProducts, currentPage])

  // Correct page if filters change and current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  const handleOpenNew = () => {
    setEditingProduct(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (p: SupplementProduct) => {
    setEditingProduct(p)
    setIsModalOpen(true)
  }

  const handleSaveModal = async (data: Omit<SupplementProduct, 'id' | 'stock'>) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, data)
    } else {
      await createProduct(data)
    }
    // Refresh list from db
    fetchProducts()
  }

  const renderStock = (stock: number) => {
    if (stock === 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
          Agotado (0)
        </span>
      )
    }
    if (stock < 10) {
      return <span className="text-orange-600 font-semibold">{stock}</span>
    }
    return <span className="text-green-600 font-semibold">{stock}</span>
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
          <h1 className="text-2xl font-bold text-gray-900">Catálogo de Productos</h1>
          <button
            onClick={handleOpenNew}
            className="px-4 py-2 bg-accent hover:bg-accent-dark text-gray-800 text-sm font-medium rounded-lg transition-colors"
          >
            + Nuevo producto
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Buscar por nombre, sabor o código..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <span className="text-sm font-bold text-gray-700 whitespace-nowrap">Estado:</span>
            <Select
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value as 'all' | 'active' | 'inactive')
                setCurrentPage(1)
              }}
              options={[
                { value: 'active', label: 'Solo activos' },
                { value: 'inactive', label: 'Solo inactivos' },
                { value: 'all', label: 'Todos' }
              ]}
              className="w-40"
            />
          </div>
        </div>
      </div>

      {/* Contenido / Tabla */}
      <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="min-w-full divide-y divide-gray-200 w-full text-sm text-left">
            <thead className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur-md border-b border-gray-100">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-4">Código</th>
                <th className="px-4 py-4">Producto</th>
                <th className="px-4 py-4">Sabor</th>
                <th className="px-4 py-4">Categoría</th>
                <th className="px-4 py-4 whitespace-nowrap">P.B</th>
                <th className="px-4 py-4 whitespace-nowrap">SRP</th>
                <th className="px-4 py-4">EAN</th>
                <th className="px-4 py-4">Stock</th>
                <th className="px-4 py-4">Estado</th>
                <th className="px-4 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white relative">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <div className="inline-block w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                    No se encontraron productos
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-2 font-medium text-gray-900">{p.code}</td>
                    <td className="px-4 py-2 text-gray-700 min-w-[200px]">{p.product}</td>
                    <td className="px-4 py-2 text-gray-500">{p.flavor || '—'}</td>
                    <td className="px-4 py-2 text-gray-500 text-xs">{p.category || '—'}</td>
                    <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{p.pb !== null ? `${p.pb} €` : '—'}</td>
                    <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{p.srp !== null ? `${p.srp} €` : '—'}</td>
                    <td className="px-4 py-2 text-gray-500 text-xs font-mono">{p.ean || '—'}</td>
                    <td className="px-4 py-2">{renderStock(p.stock)}</td>
                    <td className="px-4 py-2">
                       {p.active ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Editar producto"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => toggleActive(p.id, !p.active)}
                          className={`p-1.5 rounded transition-colors ${
                            p.active 
                              ? 'text-green-600 hover:bg-green-50' 
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                          }`}
                          title={p.active ? "Desactivar producto" : "Activar producto"}
                        >
                          {p.active ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: Paginación */}
        {filteredProducts.length > 0 && (
          <div className="shrink-0 bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-gray-600 font-medium">
              Mostrando <span className="font-semibold text-gray-900">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> a <span className="font-semibold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}</span> de <span className="font-semibold text-gray-900">{filteredProducts.length}</span> resultados
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600 min-w-16 text-center">
                Pág. {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <ProductModal 
          product={editingProduct} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveModal} 
        />
      )}
    </div>
  )
}
