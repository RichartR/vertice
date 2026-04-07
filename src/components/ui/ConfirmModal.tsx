import { useEffect } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message?: string
  children?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
}

/**
 * Modal de confirmación estilizado para acciones críticas (borrados, avisos).
 * Reemplaza los window.confirm nativos por una interfaz premium consistente con la app.
 */
export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  children,
  confirmLabel = 'Confirmar', 
  cancelLabel = 'Cancelar', 
  variant = 'primary' 
}: Readonly<Props>) {
  
  // Evitar scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  if (!isOpen) return null

  const variantClasses = {
    danger: 'bg-red-600 hover:bg-red-700 text-white font-semibold',
    primary: 'bg-accent hover:bg-accent-dark text-gray-900 font-semibold'
  }

  const iconVariants = {
    danger: (
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </div>
    ),
    primary: (
      <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-accent-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <div 
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-8 flex flex-col items-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        {iconVariants[variant]}
        
        <h3 id="confirm-modal-title" className="text-xl font-semibold text-gray-900 mb-2 text-center tracking-tight">{title}</h3>
        
        <div className="w-full mb-8">
          {children ? (
            <div className="text-left py-1">
              {children}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center leading-relaxed">
              {message}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={`flex-1 py-3 text-sm rounded-xl transition-all ${variantClasses[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
