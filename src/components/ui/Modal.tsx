// Contenedor de modal reutilizable: fondo, caja blanca, cabecera y footer con acciones.
interface ModalProps {
  title: string
  confirmLabel: string
  onClose: () => void
  onConfirm?: () => void
  confirmDisabled?: boolean
  children: React.ReactNode
}

export default function Modal({ title, confirmLabel, onClose, onConfirm, confirmDisabled, children }: Readonly<ModalProps>) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {/* Contenido */}
        <div className="px-6 py-5 space-y-4">
          {children}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-5 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmDisabled}
            className="flex-1 px-4 py-2 rounded-lg bg-accent hover:bg-accent-dark text-gray-900 text-sm font-medium transition-colors disabled:opacity-60"
          >
            {confirmLabel}
          </button>
        </div>

      </div>
    </div>
  )
}
