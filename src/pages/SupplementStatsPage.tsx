import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useSupplementClients, type SupplementClient } from '../hooks/useSupplementClients'
import ClientModal from '../components/supplementation/ClientModal'
import ConfirmModal from '../components/ui/ConfirmModal'

export default function SupplementStatsPage() {
  const { clients, loading, fetchClients, createClient, updateClient, deleteClient, activateClient } = useSupplementClients()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<SupplementClient | null>(null)
  const [showArchived, setShowArchived] = useState(false)

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
    variant: 'primary'
  })

  useEffect(() => {
    fetchClients(undefined, showArchived)
  }, [fetchClients, showArchived])

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
    setIsModalOpen(false)
  }

  const renderTableContent = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={5} className="px-6 py-10 text-center">
            <div className="inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          </td>
        </tr>
      )
    }

    if (filteredClients.length === 0) {
      return (
        <tr>
          <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium italic">
            {clients.length === 0 ? 'No hay clientes registrados aún' : 'No se han encontrado clientes con ese filtro'}
          </td>
        </tr>
      )
    }

    return filteredClients.map(c => (
      <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
        <td className="px-6 py-4">
          <span className="font-bold text-gray-900 block">{c.full_name}</span>
        </td>
        <td className="px-6 py-4 font-medium text-gray-600">
          {c.phone || <span className="text-gray-300 italic text-xs font-normal">Sin teléfono</span>}
        </td>
        <td className="px-6 py-4 text-gray-500 text-sm max-w-[300px] truncate">
          {c.notes || '-'}
        </td>
        <td className="px-6 py-4 text-center">
          <span className={`inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2.5 rounded-full text-[10px] font-bold ${c.total_sales > 0 ? 'bg-accent/10 text-accent-dark border border-accent/20' : 'bg-gray-100 text-gray-400'}`}>
            {c.total_sales}
          </span>
        </td>
        <td className="px-6 py-4 text-right">
          <div className="flex justify-end gap-2">
            {c.active ? (
              <>
                <button
                  onClick={() => handleOpenEdit(c)}
                  className="px-3 py-1.5 text-[10px] font-bold text-gray-700 bg-accent/20 hover:bg-accent/40 rounded-lg transition-all uppercase tracking-wider"
                >
                  Editar
                </button>
                <button
                  onClick={() => {
                    setConfirmData({
                      isOpen: true,
                      title: c.total_sales > 0 ? 'Archivar Cliente' : 'Eliminar Cliente',
                      message: `¿Estás seguro de que deseas ${c.total_sales > 0 ? 'archivar' : 'eliminar'} a ${c.full_name}?`,
                      onConfirm: () => deleteClient(c),
                      variant: c.total_sales > 0 ? 'primary' : 'danger'
                    })
                  }}
                  className="px-3 py-1.5 text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all uppercase tracking-wider"
                >
                  {c.total_sales > 0 ? 'Archivar' : 'Borrar'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => activateClient(c.id)}
                  className="px-3 py-1.5 text-[10px] font-bold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-all uppercase tracking-wider"
                >
                  Activar
                </button>
                {c.total_sales === 0 && (
                  <button
                    onClick={() => {
                      setConfirmData({
                        isOpen: true,
                        title: 'Eliminar Definitivamente',
                        message: `¿Confirma el borrado DEFINITIVO de ${c.full_name}? Esta acción no se puede deshacer.`,
                        onConfirm: () => deleteClient(c),
                        variant: 'danger'
                      })
                    }}
                    className="px-3 py-1.5 text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all uppercase tracking-wider"
                  >
                    Borrar
                  </button>
                )}
              </>
            )}
          </div>
        </td>
      </tr>
    ))
  }

  return (
    <div className="p-4 sm:p-8 max-w-screen-2xl mx-auto flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="shrink-0 mb-6">
        <nav className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-1 block">
          <span className="mx-2">←</span>
          <Link to="/admin/suplementacion" className="hover:text-gray-600">Suplementación</Link>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>
      </div>

      {/* Secciones de Estadísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-all">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            Ingresos y Márgenes
          </h2>
          <div className="h-24 flex items-center justify-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100/50">
             <span className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Módulo en Desarrollo</span>
          </div>
        </div>
        <div className="bg-white p-6 border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-all">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="p-1.5 bg-accent/10 rounded-lg text-accent">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 118 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            Más Vendidos
          </h2>
          <div className="h-24 flex items-center justify-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100/50">
             <span className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Módulo en Desarrollo</span>
          </div>
        </div>
        <div className="bg-white p-6 border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-all">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="p-1.5 bg-orange-50 rounded-lg text-orange-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            Evolución
          </h2>
          <div className="h-24 flex items-center justify-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100/50">
             <span className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Módulo en Desarrollo</span>
          </div>
        </div>
      </div>

      {/* Sección Gestión de Clientes */}
      <div className="flex-1 flex flex-col min-h-0 bg-white border border-gray-100 rounded-[2.5rem] shadow-xl overflow-hidden p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 shrink-0">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-accent/10 rounded-2xl text-accent shadow-sm">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
             </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 leading-none mb-1">Gestión de Clientes</h2>
                <p className="text-sm font-medium text-gray-500">Base de datos de suplementación</p>
              </div>
          </div>
          <button
            onClick={handleOpenNew}
            className="px-4 py-2 bg-accent hover:bg-accent-dark text-gray-800 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            NUEVO CLIENTE
          </button>
        </div>

        {/* Buscador local y Filtros */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shrink-0">
          <div className="relative flex-1 max-w-xl">
            <input
              type="text"
              placeholder="Buscar cliente por nombre o teléfono..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl shadow-inner focus:ring-2 focus:ring-accent/50 outline-none transition-all text-sm font-medium"
            />
            <div className="absolute left-4 top-4 text-gray-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <label className="flex items-center gap-4 cursor-pointer group bg-gray-50 px-6 py-4 rounded-2xl border border-transparent hover:border-accent/20 transition-all">
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={showArchived}
                onChange={e => setShowArchived(e.target.checked)}
              />
              <div className={`w-12 h-6 rounded-full transition-colors ${showArchived ? 'bg-accent' : 'bg-gray-300'}`} />
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-md transition-transform ${showArchived ? 'translate-x-6' : ''}`} />
            </div>
            <span className={`text-xs font-semibold uppercase tracking-wider transition-colors ${showArchived ? 'text-accent' : 'text-gray-400 group-hover:text-gray-600'}`}>
              Ver Archivados
            </span>
          </label>
        </div>

        {/* Tabla Clientes */}
        <div className="rounded-3xl border border-gray-50 overflow-hidden flex-1 flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur-md border-b border-gray-100">
                <tr>
                  <th className="px-8 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre del Cliente</th>
                  <th className="px-8 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Teléfono</th>
                  <th className="px-8 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Apuntes/Notas</th>
                  <th className="px-8 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Nº Ventas</th>
                  <th className="px-8 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Controles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {renderTableContent()}
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
