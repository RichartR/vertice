// Select custom con dropdown estilizado — reemplaza los <select> nativos del navegador.
// El dropdown se renderiza en document.body via portal para escapar de overflow:hidden/auto
// en modales y contenedores con scroll.
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface Option {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

export default function Select({ value, onChange, options, placeholder, className = '', disabled }: Readonly<SelectProps>) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const triggerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedLabel = options.find(o => o.value === value)?.label

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

  function handleToggle() {
    if (disabled) return
    if (!open && triggerRef.current) {
      setSearchTerm('')
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
    <div ref={triggerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all ${
          disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100' : 'bg-white text-gray-700'
        }`}
      >
        <span className={selectedLabel ? 'text-gray-700' : 'text-gray-400'}>
          {selectedLabel ?? placeholder ?? ''}
        </span>
        <span className={`text-gray-400 text-xs shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && createPortal(
        <div ref={dropdownRef} style={dropdownStyle} className="bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-100 shrink-0">
            <input
              autoFocus
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50 placeholder:text-gray-400"
              onClick={e => e.stopPropagation()}
            />
          </div>
          <ul className="max-h-60 overflow-y-auto w-full">
            {placeholder && !searchTerm && (
              <li
                onClick={() => { onChange(''); setOpen(false) }}
                className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                  value === '' ? 'bg-accent/20 text-gray-900 font-medium' : 'text-gray-400 hover:bg-gray-50'
                }`}
              >
                {placeholder}
              </li>
            )}
            {options.filter(o => o.label.toLowerCase().includes(searchTerm.toLowerCase())).map(o => (
              <li
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false) }}
                className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                  o.value === value ? 'bg-accent/20 text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {o.label}
              </li>
            ))}
            {options.filter(o => o.label.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
              <li className="px-3 py-4 text-sm text-center text-gray-400">
                Sin resultados
              </li>
            )}
          </ul>
        </div>,
        document.body
      )}
    </div>
  )
}
