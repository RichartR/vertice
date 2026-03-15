// Select custom con dropdown estilizado — reemplaza los <select> nativos del navegador.
// Acepta un placeholder opcional para el estado vacío (value = '').
import { useEffect, useRef, useState } from 'react'

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
  const ref = useRef<HTMLDivElement>(null)

  const selectedLabel = options.find(o => o.value === value)?.label

  // Cierra el dropdown al hacer clic fuera
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <span className={selectedLabel ? 'text-gray-700' : 'text-gray-400'}>
          {selectedLabel ?? placeholder ?? ''}
        </span>
        <span className={`text-gray-400 text-xs shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <ul className="absolute z-30 mt-1 w-full min-w-max bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
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
        </ul>
      )}
    </div>
  )
}
