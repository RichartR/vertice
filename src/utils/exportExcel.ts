// Exportación a Excel usando la plantilla corporativa.
// ExcelJS preserva correctamente estilos, colores, bordes y fórmulas en el round-trip
// (leer plantilla → insertar datos → descargar), a diferencia de SheetJS community.
import ExcelJS from 'exceljs'
import templateUrl from '../assets/templates/plantilla-registros.xlsx?url'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// Nombres de hoja tal como están en la plantilla (sin emojis)
const HOJA_REGISTRO = 'Registro'
const HOJA_RESUMEN  = 'Resumen Mensual'

type Registro = {
  fecha: string        // YYYY-MM-DD
  hora: string         // HH:MM:SS
  cliente: string
  tratamiento: string
  notas: string | null
  metodo_pago: 'efectivo' | 'tarjeta'
  precio: number
}

// Sustituye {NOMBRE_SERVICIO} en la celda A1 de una hoja
function reemplazarNombre(ws: ExcelJS.Worksheet, servicio: string) {
  const a1 = ws.getCell('A1')
  if (typeof a1.value === 'string') {
    a1.value = a1.value.replace('{NOMBRE_SERVICIO}', servicio.toUpperCase())
  }
}

export async function exportToExcel(registros: Registro[], nombreServicio: string) {
  // 1. Cargar la plantilla — ExcelJS mantiene intactos estilos y fórmulas al leer
  const response = await fetch(templateUrl)
  const arrayBuffer = await response.arrayBuffer()

  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(arrayBuffer)

  // Fuerza a Excel a recalcular todas las fórmulas al abrir el archivo.
  // Sin esto, las fórmulas que referencian otras hojas (ej: SUMIF en "Metodo de Pago"
  // apuntando a "Registro") pueden mostrar el valor cacheado de la plantilla en lugar
  // del resultado real con los datos insertados.
  wb.calcProperties.fullCalcOnLoad = true

  // 2. Hoja "Registro" — insertar datos desde la fila 5
  const ws1 = wb.getWorksheet(HOJA_REGISTRO)
  if (ws1) {
    reemplazarNombre(ws1, nombreServicio)

    registros.forEach((r, i) => {
      const rowNum = 5 + i
      const row = ws1.getRow(rowNum)
      // Date.UTC garantiza medianoche UTC: ExcelJS serializa fechas en UTC,
      // así que crear la fecha en UTC evita que cambie de día por el offset de zona horaria.
      const [y, m, d] = r.fecha.split('-').map(Number)
      const fecha = new Date(Date.UTC(y, m - 1, d))

      const fechaCell = row.getCell(1)
      fechaCell.value = fecha
      // numFmt via style para que ExcelJS lo aplique correctamente en celdas nuevas
      fechaCell.style = { ...fechaCell.style, numFmt: 'dd/mm/yyyy' }
      row.getCell(2).value = DIAS[fecha.getUTCDay()]
      row.getCell(3).value = r.hora.substring(0, 5)
      row.getCell(4).value = r.cliente
      row.getCell(5).value = r.tratamiento
      row.getCell(6).value = r.notas ?? ''
      // Sin emojis para que las fórmulas SUMIF/COUNTIF de las otras hojas funcionen
      row.getCell(7).value = r.metodo_pago === 'efectivo' ? 'Efectivo' : 'Tarjeta'
      row.getCell(8).value = r.precio
      row.commit()
    })
  }

  // 3. Reemplazar {NOMBRE_SERVICIO} en las otras dos hojas y reparar el año
  const ws2 = wb.getWorksheet(HOJA_RESUMEN)
  if (ws2) {
    reemplazarNombre(ws2, nombreServicio)
    // ExcelJS malinterpreta columnas numéricas como fechas al hacer el round-trip con la plantilla.
    // Causas:
    //   Col B (Año): el valor 2026 se trata como serial de fecha → 18/07/1905
    //   Col F (Nº Sesiones): el numFmt de la celda es de fecha; el resultado del SUMPRODUCT
    //     (un entero) se muestra como fecha (0 → 30/12/1899, 2 → 01/01/1900)
    // Solución: forzar numFmt = '0' (número entero) en ambas columnas para todas las filas.
    for (let rowNum = 5; rowNum <= 17; rowNum++) {
      const cellB = ws2.getCell(rowNum, 2)
      if (cellB.value instanceof Date) cellB.value = 2026
      cellB.numFmt = '0'
      ws2.getCell(rowNum, 6).numFmt = '0'
    }
  }

  // 4. Generar el buffer y forzar la descarga en el navegador
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const fechaHoy = new Date().toLocaleDateString('es-ES').replaceAll('/', '-')
  a.href = url
  a.download = `${nombreServicio}_${fechaHoy}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
