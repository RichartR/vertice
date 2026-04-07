import { useState, useEffect } from 'react'
import { type SupplementClient } from '../../hooks/useSupplementClients'

type ClientData = {
  full_name: string
  phone: string
  notes: string
}

type Props = {
  client?: SupplementClient | null
  onClose: () => void
  onSave: (data: ClientData) => Promise<void>
}

export default function ClientModal({ client, onClose, onSave }: Readonly<Props>) {
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState(client?.full_name || '')
  const [phone, setPhone] = useState(client?.phone || '')
  const [notes, setNotes] = useState(client?.notes || '')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'auto' }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave({ full_name: fullName, phone, notes })
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">{client ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <label htmlFor="modal-fullname" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Nombre Completo *</label>
            <input 
              id="modal-fullname"
              type="text" 
              required 
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent outline-none text-sm bg-gray-50/30 transition-all focus:bg-white font-medium"
              placeholder="Ej: Juan Pérez"
            />
          </div>
          <div>
            <label htmlFor="modal-phone" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Teléfono</label>
            <input 
              id="modal-phone"
              type="text" 
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent outline-none text-sm bg-gray-50/30 transition-all focus:bg-white font-medium"
              placeholder="600 000 000"
            />
          </div>
          <div>
            <label htmlFor="modal-notes" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Notas</label>
            <textarea 
              id="modal-notes"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent outline-none resize-none text-sm bg-gray-50/30 transition-all focus:bg-white font-medium"
              placeholder="Información adicional del cliente..."
            />
          </div>
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-xs font-semibold text-gray-400 bg-gray-50/50 hover:bg-gray-100 rounded-2xl transition-all border border-gray-100 uppercase tracking-wide"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={loading || !fullName.trim()}
              className="flex-1 py-3 text-xs font-bold bg-accent text-gray-900 rounded-2xl hover:bg-accent-dark transition-all shadow-lg shadow-accent/20 hover:shadow-accent/40 disabled:opacity-50 uppercase tracking-wide"
            >
              {loading ? 'GUARDANDO...' : 'GUARDAR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
