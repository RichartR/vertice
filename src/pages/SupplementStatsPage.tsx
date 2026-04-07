import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useSupplementClients, type SupplementClient } from '../hooks/useSupplementClients'
import ClientModal from '../components/supplementation/ClientModal'

export default function SupplementStatsPage() {
  const { clients, loading, fetchClients, createClient, updateClient } = useSupplementClients()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<SupplementClient | null>(null)

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  // Local filtering by search term (search in full_name and phone)
  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients
    const lowerSearch = searchTerm.toLowerCase()
    return clients.filter(c => 
      c.full_name.toLowerCase().includes(lowerSearch) || 
      (c.phone?.toLowerCase().includes(lowerSearch) ?? false)
    )
  }, [clients, searchTerm])

  const handleOpenNew = () => {
    setEditingClient(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (client: SupplementClient) => {
    setEditingClient(client)
    setIsModalOpen(true)
  }

  const handleSaveModal = async (data: { full_name: string; phone?: string; notes?: string }) => {
    if (editingClient) {
      await updateClient(editingClient.id, data)
    } else {
      await createClient(data.full_name, data.phone, data.notes)
    }
    // List is refreshed automatically by the hook on success.
  }

  return (
    <div className="p-4 sm:p-8 max-w-screen-2xl mx-auto flex flex-col min-h-screen">
      {/* Header */}
      <div className="shrink-0 mb-8">
        <nav className="text-sm font-medium text-gray-500 mb-2">
          <Link to="/admin/suplementacion" className="hover:underline text-gray-600">Suplementación</Link>
          <span className="mx-2">→</span>
          <span className="text-gray-900">Estadísticas</span>
        </nav>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Estadísticas</h1>
      </div>

      {/* Secciones de Estadísticas (Placeholders) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            Ingresos y Márgenes
          </h2>
          <div className="h-24 flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
             <span className="text-sm text-gray-400 font-medium italic">Próximamente (Tarea 7)...</span>
          </div>
        </div>
        <div className="bg-white p-6 border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
             <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 118 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Productos más vendidos
          </h2>
          <div className="h-24 flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
             <span className="text-sm text-gray-400 font-medium italic">Próximamente (Tarea 7)...</span>
          </div>
        </div>
        <div className="bg-white p-6 border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
             <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Evolución Ventas
          </h2>
          <div className="h-24 flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
             <span className="text-sm text-gray-400 font-medium italic">Próximamente (Tarea 7)...</span>
          </div>
        </div>
      </div>

      {/* Sección Gestión de Clientes */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-accent/10 rounded-xl text-accent">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
             </div>
             <h2 className="text-2xl font-bold text-gray-800">Sección Clientes</h2>
          </div>
          <button
            onClick={handleOpenNew}
            className="px-5 py-2.5 bg-accent text-gray-900 font-bold rounded-xl shadow-lg hover:shadow-accent/20 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            NUEVO CLIENTE
          </button>
        </div>

        {/* Buscador local */}
        <div className="mb-6 relative shrink-0">
          <input
            type="text"
            placeholder="Filtrar por nombre o teléfono de cliente..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full sm:w-96 pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all"
          />
          <div className="absolute left-4 top-3.5 text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Tabla Clientes */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-xl overflow-hidden flex-1 flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Nombre del Cliente</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Teléfono</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Notas</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Nº Ventas</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center">
                      <div className="inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                    </td>
                  </tr>
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium italic">
                      {clients.length === 0 ? 'No hay clientes registrados aún' : 'No se han encontrado clientes con ese filtro'}
                    </td>
                  </tr>
                ) : (
                  filteredClients.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900 block">{c.full_name}</span>
                        {/* ID visible en pequeño para refs internas if needed */}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-600">
                        {c.phone || <em className="text-gray-300 font-normal">Sin teléfono</em>}
                      </td>
                      <td className="px-6 py-4">
                         <div className="max-w-[300px] text-xs text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap" title={c.notes ?? ''}>
                           {c.notes || '—'}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 bg-accent/5 text-accent rounded-full text-sm font-bold border border-accent/10">
                          {c.total_sales}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all"
                        >
                          EDITAR
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && (
        <ClientModal
          client={editingClient}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveModal}
        />
      )}
    </div>
  )
}
