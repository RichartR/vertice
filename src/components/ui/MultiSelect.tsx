// MultiSelect — dropdown con checkboxes internos. Reemplaza CheckboxGroup en modales de admin.
// Muestra las opciones seleccionadas como texto en el botón; al abrirse despliega la lista.
import { useEffect, useRef, useState } from 'react'

interface MultiSelectProps {
  label: string
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
  placeholder?: string
}

export default function MultiSelect({ label, options, selected, onToggle, placeholder = 'Sin asignar' }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
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

  return (
    <div>
      <p className="text-xs font-medium text-gray-600 mb-1.5">{label}</p>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <span className={selected.length > 0 ? 'text-gray-700 truncate' : 'text-gray-400'}>
            {resumen}
          </span>
          <span className={`text-gray-400 text-xs shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
        </button>

        {open && (
          <ul className="absolute z-30 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden max-h-48 overflow-y-auto">
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
          </ul>
        )}
      </div>
    </div>
  )
}
