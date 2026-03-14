// Badge de estado reutilizable. Variantes predefinidas para los casos del proyecto.
type BadgeVariant = 'activo' | 'inactivo' | 'admin' | 'empleado' | 'tarjeta' | 'efectivo'

const STYLES: Record<BadgeVariant, string> = {
  activo:   'bg-green-50 text-green-700',
  inactivo: 'bg-red-50 text-red-600',
  admin:    'bg-purple-50 text-purple-700',
  empleado: 'bg-gray-100 text-gray-600',
  tarjeta:  'bg-blue-50 text-blue-700',
  efectivo: 'bg-green-50 text-green-700',
}

const LABELS: Record<BadgeVariant, string> = {
  activo:   'Activo',
  inactivo: 'Inactivo',
  admin:    'Admin',
  empleado: 'Empleado',
  tarjeta:  'Tarjeta',
  efectivo: 'Efectivo',
}

interface BadgeProps {
  variant: BadgeVariant
}

export default function Badge({ variant }: Readonly<BadgeProps>) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STYLES[variant]}`}>
      {LABELS[variant]}
    </span>
  )
}
