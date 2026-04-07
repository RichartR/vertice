import * as XLSX from 'xlsx'
import { type Sale } from '../hooks/useSupplementSales'
import { type Order } from '../hooks/useSupplementOrders'

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

export const exportOrdersToExcel = (orders: Order[], isReceivedTab: boolean) => {
  const masterData = orders.map(o => {
    const base: any = {
      'Fecha pedido': o.order_date.split('-').reverse().join('/'),
      Estado: o.received ? 'Recibido' : 'Pendiente',
    };
    if (isReceivedTab) {
      base['Fecha recepción'] = o.received_at ? new Date(o.received_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
    }
    return {
      ...base,
      'Nº líneas': o.lines?.length || 0,
      'Total unidades': o.total_units,
      'Coste total (€)': o.total_cost !== null ? o.total_cost : '—',
      Notas: o.notes || '—'
    };
  });

  const linesData = orders.flatMap(o => (o.lines || []).map(l => ({
    'ID pedido': o.id,
    'Fecha pedido': o.order_date.split('-').reverse().join('/'),
    'Código producto': l.code || '—',
    Producto: l.product_name,
    Cantidad: l.quantity,
    'Coste unitario': l.unit_cost !== null ? l.unit_cost : '—',
    Subtotal: l.subtotal !== null ? l.subtotal : '—'
  })));

  const worksheetOrders = XLSX.utils.json_to_sheet(masterData);
  const worksheetLines = XLSX.utils.json_to_sheet(linesData);
  const workbook = XLSX.utils.book_new();
  
  XLSX.utils.book_append_sheet(workbook, worksheetOrders, "Pedidos");
  XLSX.utils.book_append_sheet(workbook, worksheetLines, "Líneas");
  
  XLSX.writeFile(workbook, `Pedidos_Suplementacion_${isReceivedTab ? 'Recibidos' : 'Pendientes'}_${new Date().toISOString().split('T')[0]}.xlsx`);
}
