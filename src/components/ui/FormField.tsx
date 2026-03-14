// Wrapper de campo de formulario: label asociado + control (input/select/textarea).
interface FormFieldProps {
  id: string
  label: string
  optional?: boolean
  children: React.ReactNode
}

export default function FormField({ id, label, optional, children }: Readonly<FormFieldProps>) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}{optional && <span className="text-gray-400"> (opcional)</span>}
      </label>
      {children}
    </div>
  )
}
