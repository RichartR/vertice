import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href

export type InvoiceLine = {
  code: number
  description?: string
  flavor?: string
  quantity: number
  unitCost: number
  discount: number
}

export type ParseResult = {
  lines: InvoiceLine[]
  rawText: string
  unmatched: string[]
}

export async function parsePdfInvoice(file: File): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const allTextLines: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageLines = extractLinesFromPage(content.items)
    allTextLines.push(...pageLines)
  }

  const rawText = allTextLines.join('\n')

  const result = parseLinesFromText(allTextLines)

  return { lines: result.matched, rawText, unmatched: result.unmatched }
}

interface PDFTextItem {
  str: string
  transform: number[]
}

function extractLinesFromPage(items: any[]): string[] {
  const Y_TOLERANCE = 5
  const rowMap = new Map<number, { x: number; text: string }[]>()

  for (const item of items) {
    if (!('str' in item) || !item.str.trim()) continue
    const y = Math.round(item.transform[5] / Y_TOLERANCE) * Y_TOLERANCE
    const row = rowMap.get(y) ?? []
    row.push({ x: item.transform[4], text: item.str })
    rowMap.set(y, row)
  }

  return [...rowMap.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, rowItems]) =>
      [...rowItems].sort((a, b) => a.x - b.x).map(i => i.text).join(' ')
    )
}

function normalizeNumber(str: string): number {
  return Number.parseFloat(str.replaceAll('.', '').replaceAll(',', '.'))
}

function extractFlavor(line: string): string | undefined {
  const m = /SABOR:\s*([A-Z]\D*?)(?=\s+[\d,]+)/i.exec(line)
  return m ? m[1].trim().toUpperCase() : undefined
}

function extractDescription(line: string): string | undefined {
  const afterCode = line.replace(/^\d+\s+/, '')
  const saborIdx = afterCode.search(/\s+-?\s*SABOR:/i)
  if (saborIdx > 0) return afterCode.slice(0, saborIdx).trim()
  const m = /^(.+?)\s+[\d.,]+\s+[\d.,]/.exec(afterCode)
  return m ? m[1].trim() : undefined
}

// Patrones para identificar las columnas numéricas al final de la línea:
// Estructura: CANT. P/UNIT. [% DTO.] [I.V.A.] IMPORTE

// 5 columnas numéricas: QTY, PRICE, DISCOUNT, VAT%, TOTAL
const PATTERN_5_COLS = /^(\d{2,13})\s+(.+?)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)%\s+([\d.,]+)\s*$/
// 4 columnas numéricas: QTY, PRICE, VAT%, TOTAL
const PATTERN_4_COLS = /^(\d{2,13})\s+(.+?)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)%\s+([\d.,]+)\s*$/
// Patrón de respaldo sin símbolos de %: ID | DESC | QTY | PRICE | TOTAL
const PRIMARY_PATTERN = /^(\d{2,13})\s+(.+?)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s*$/
// Patrón simple: ID | DESC | QTY | PRICE
const SIMPLE_PATTERN = /^(\d{2,13})\s+(.+?)\s+([\d.,]+)\s+([\d.,]+)\s*$/

const ID_PREFIX = /^\d{2,13}\s/

function buildLine(rawId: string, rawQty: string, rawCost: string, description?: string, flavor?: string, rawDiscount?: string, rawTotal?: string): InvoiceLine | null {
  const code = Number.parseInt(rawId, 10)
  const quantity = Math.round(normalizeNumber(rawQty))
  const unitCost = normalizeNumber(rawCost)
  const discount = rawDiscount ? normalizeNumber(rawDiscount) : 0
  if (quantity <= 0) return null

  if (rawTotal !== undefined) {
    const total = normalizeNumber(rawTotal)
    // Validación matemática: el total debe ser aproximadamente Qty * Price * (1 - Discount/100)
    // El IVA (10% o 21%) se ignora para la comparación si el Total en la factura es el Base Imponible,
    // o se tiene en cuenta si el Total es el Importe Final.
    // En las facturas de Life Pro, el 'IMPORTE' de la línea es el Base Imponible (sin IVA).
    const calculatedBase = quantity * unitCost * (1 - discount / 100)
    const tolerance = Math.max(0.5, calculatedBase * 0.05) // 5% de tolerancia para redondeos

    if (Math.abs(calculatedBase - total) > tolerance) {
      return null
    }
  }

  return { code, description, flavor, quantity, unitCost, discount }
}

function tryPrimaryMatch(trimmed: string): InvoiceLine | null {
  const flavor = extractFlavor(trimmed)
  const description = extractDescription(trimmed)

  // 1. Probar patrón de 5 columnas (ID, QTY, PRICE, DTO, VAT%, TOTAL)
  const m5 = PATTERN_5_COLS.exec(trimmed)
  if (m5) return buildLine(m5[1], m5[3], m5[4], description, flavor, m5[5], m5[7])

  // 2. Probar patrón de 4 columnas (ID, QTY, PRICE, VAT%, TOTAL) -> DTO = 0
  const m4 = PATTERN_4_COLS.exec(trimmed)
  if (m4) return buildLine(m4[1], m4[3], m4[4], description, flavor, undefined, m4[6])

  // 3. Probar patrón primario (sin porcentajes)
  const pm = PRIMARY_PATTERN.exec(trimmed)
  if (pm) return buildLine(pm[1], pm[3], pm[4], description, flavor, undefined, pm[5])

  return null
}

function trySimpleMatch(trimmed: string): InvoiceLine | null {
  const match = SIMPLE_PATTERN.exec(trimmed)
  if (!match) return null
  return buildLine(match[1], match[2], match[3], extractDescription(trimmed), extractFlavor(trimmed))
}

function parseLinesFromText(lines: string[]): { matched: InvoiceLine[]; unmatched: string[] } {
  const matched: InvoiceLine[] = []
  const unmatched: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const primary = tryPrimaryMatch(trimmed)
    if (primary) { matched.push(primary); continue }

    const simple = trySimpleMatch(trimmed)
    if (simple) { matched.push(simple); continue }

    if (ID_PREFIX.test(trimmed)) unmatched.push(trimmed)
  }

  return { matched, unmatched }
}
