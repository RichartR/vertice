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
}

export default function Select({ value, onChange, options, placeholder, className = '' }: SelectProps) {
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const triggerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLUListElement>(null)

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
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        minWidth: rect.width,
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
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <span className={selectedLabel ? 'text-gray-700' : 'text-gray-400'}>
          {selectedLabel ?? placeholder ?? ''}
        </span>
        <span className={`text-gray-400 text-xs shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && createPortal(
        <ul ref={dropdownRef} style={dropdownStyle} className="bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
          {placeholder && (
            <li
              onClick={() => { onChange(''); setOpen(false) }}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                value === '' ? 'bg-accent/20 text-gray-900 font-medium' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              {placeholder}
            </li>
          )}
          {options.map(o => (
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
        </ul>,
        document.body
      )}
    </div>
  )
}
