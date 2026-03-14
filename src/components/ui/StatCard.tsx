// Tarjeta de KPI para el dashboard de estadísticas.
interface StatCardProps {
  label: string
  value: string
  sub: string
}

export default function StatCard({ label, value, sub }: Readonly<StatCardProps>) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-accent p-5">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 mt-2">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  )
}
