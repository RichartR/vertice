import * as XLSX from 'xlsx'
import { type Sale } from '../hooks/useSupplementSales'

export const exportSalesToExcel = (sales: Sale[]) => {
  const data = sales.map(s => ({
    Fecha: s.sale_date.split('-').reverse().join('/'),
    Cliente: s.client_name || 'Venta General',
    Productos: s.lines?.map(l => `${l.product_name} x ${l.quantity}`).join(', ') || '—',
    'Total (€)': s.total,
    'Método de pago': s.payment_method.toUpperCase(),
    Notas: s.notes || '—'
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas")
  
  XLSX.writeFile(workbook, `Ventas_Suplementacion_${new Date().toISOString().split('T')[0]}.xlsx`)
}
