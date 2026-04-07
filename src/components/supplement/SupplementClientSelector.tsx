import { useState, useRef, useEffect } from 'react'
import { useSupplementClients, type SupplementClient } from '../../hooks/useSupplementClients'
import { useDebounce } from '../../hooks/useDebounce'

type Props = {
  value: SupplementClient | null
  onChange: (client: SupplementClient | null) => void
}

export default function SupplementClientSelector({ value, onChange }: Props) {
  const { clients, fetchClients, createClient, loading } = useSupplementClients()
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [showNewClientModal, setShowNewClientModal] = useState(false)
  
  // New Client Form State
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch as user types
  const debouncedFetch = useDebounce((val: string) => {
    fetchClients(val)
  }, 300)

  useEffect(() => {
    if (isOpen) {
      debouncedFetch(searchTerm)
    }
  }, [isOpen, searchTerm, debouncedFetch])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClientName.trim()) return
    
    setIsCreating(true)
    try {
      const newClient = await createClient(newClientName, newClientPhone)
      if (newClient) {
        // Assume mapping structure matches SupplementClient
        onChange(newClient as unknown as SupplementClient)
        setShowNewClientModal(false)
        setIsOpen(false)
        setNewClientName('')
        setNewClientPhone('')
      }
    } catch (err) {
      console.error('Error creating client from selector:', err)
    } finally {
      setIsCreating(false)
    }
  }

  if (value) {
    return (
      <div className="relative w-full">
        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Cliente Seleccionado</label>
        <div className="flex items-center justify-between p-3 border border-accent bg-accent/5 rounded-lg text-sm">
          <div className="flex flex-col">
            <span className="font-bold text-gray-900">{value.full_name}</span>
            {value.phone && <span className="text-xs text-gray-500">{value.phone}</span>}
          </div>
          <button 
            onClick={() => {
              onChange(null)
              setSearchTerm('')
            }}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            title="Quitar cliente"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Seleccionar Cliente</label>
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar cliente por nombre o teléfono..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            if (!isOpen) setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none pr-10"
        />
        <div className="absolute right-3 top-3 text-gray-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden max-h-64 flex flex-col">
          <div className="overflow-y-auto flex-1">
            {loading && clients.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm italic">Cargando clientes...</div>
            ) : clients.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">No se encontraron resultados</div>
            ) : (
              clients.map(client => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => {
                    onChange(client)
                    setIsOpen(false)
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex flex-col border-b border-gray-50 last:border-0"
                >
                  <span className="text-sm font-semibold text-gray-900">{client.full_name}</span>
                  {client.phone && <span className="text-xs text-gray-500">{client.phone}</span>}
                </button>
              ))
            )}
          </div>
          
          <button
            type="button"
            onClick={() => setShowNewClientModal(true)}
            className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 text-accent font-bold text-sm border-t border-gray-200 flex items-center justify-center gap-2 group transition-colors"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            CREAR NUEVO CLIENTE
          </button>
        </div>
      )}

      {/* Mini Modal Inline (Dialog-like) */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">Nuevo Cliente</h3>
              <button 
                type="button"
                onClick={() => setShowNewClientModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateClient} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-widest">Nombre Completo *</label>
                <input 
                  type="text" 
                  autoFocus 
                  required 
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-widest">Teléfono</label>
                <input 
                  type="text" 
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="flex-1 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newClientName.trim()}
                  className="flex-1 py-2 text-sm font-bold bg-accent text-gray-900 rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50"
                >
                  {isCreating ? 'GUARDANDO...' : 'GUARDAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
