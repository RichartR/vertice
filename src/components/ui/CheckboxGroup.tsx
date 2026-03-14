// Lista de checkboxes con etiqueta de sección. Usada en modales de servicios y empleados.
interface CheckboxGroupProps {
  label: string
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
  scrollable?: boolean
}

export default function CheckboxGroup({ label, options, selected, onToggle, scrollable = false }: Readonly<CheckboxGroupProps>) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-600 mb-2">{label}</p>
      <div className={`space-y-2 ${scrollable ? 'max-h-40 overflow-y-auto' : ''}`}>
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => onToggle(opt)}
              className="accent-[#b9d9ce] w-4 h-4"
            />
            <span className="text-sm text-gray-700">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
