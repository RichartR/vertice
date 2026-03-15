// Contenedor de modal reutilizable: fondo, caja blanca, cabecera y footer con acciones.
// En móvil aparece como bottom sheet; en sm+ como modal centrado.
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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-40 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[90vh] flex flex-col">

        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {/* Contenido — scroll si supera el alto disponible */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-5 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmDisabled}
            className="flex-1 px-4 py-2.5 rounded-lg bg-accent hover:bg-accent-dark text-gray-900 text-sm font-medium transition-colors disabled:opacity-60"
          >
            {confirmLabel}
          </button>
        </div>

      </div>
    </div>
  )
}
