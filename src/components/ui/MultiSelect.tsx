// MultiSelect — dropdown con checkboxes internos. Reemplaza CheckboxGroup en modales de admin.
// El dropdown se renderiza en document.body via portal para escapar de overflow:hidden/auto
// en modales y contenedores con scroll.
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface MultiSelectProps {
  label: string
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
  placeholder?: string
}

export default function MultiSelect({ label, options, selected, onToggle, placeholder = 'Sin asignar' }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const triggerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node
      if (
        triggerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const resumen =
    selected.length === 0
      ? placeholder
      : selected.length <= 2
        ? selected.join(', ')
        : `${selected.slice(0, 2).join(', ')} +${selected.length - 2}`

  function handleToggle() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      })
    }
    setOpen(o => !o)
  }

  return (
    <div>
      <p className="text-xs font-medium text-gray-600 mb-1.5">{label}</p>
      <div ref={triggerRef} className="relative">
        <button
          type="button"
          onClick={handleToggle}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <span className={selected.length > 0 ? 'text-gray-700 truncate' : 'text-gray-400'}>
            {resumen}
          </span>
          <span className={`text-gray-400 text-xs shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
        </button>

        {open && createPortal(
          <ul ref={dropdownRef} style={dropdownStyle} className="bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden max-h-48 overflow-y-auto">
            {options.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-400">No hay opciones disponibles</li>
            )}
            {options.map(opt => (
              <li
                key={opt}
                onClick={() => onToggle(opt)}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors ${
                  selected.includes(opt) ? 'bg-accent/15 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center text-[10px] transition-colors ${
                  selected.includes(opt)
                    ? 'bg-accent-dark border-accent-dark text-gray-800'
                    : 'border-gray-300 bg-white'
                }`}>
                  {selected.includes(opt) && '✓'}
                </span>
                {opt}
              </li>
            ))}
          </ul>,
          document.body
        )}
      </div>
    </div>
  )
}
