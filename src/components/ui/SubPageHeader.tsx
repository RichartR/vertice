// Cabecera de sub-página: botón de retorno + título (+ subtítulo opcional) + slot derecho.
interface SubPageHeaderProps {
  backLabel: string
  onBack: () => void
  title: string
  subtitle?: string
  rightSlot?: React.ReactNode
}

export default function SubPageHeader({ backLabel, onBack, title, subtitle, rightSlot }: Readonly<SubPageHeaderProps>) {
  return (
    <header className="bg-accent border-b border-accent-dark px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
        >
          {backLabel}
        </button>
        <div>
          <h1 className="font-semibold text-gray-900">{title}</h1>
          {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
        </div>
      </div>
      {rightSlot}
    </header>
  )
}
