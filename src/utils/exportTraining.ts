// Exportación dinámica a Excel con la estética de la plantilla corporativa.
// – Tantas filas por bloque como existan en la app.
// – Solo los bloques que existan (no se crean bloques vacíos).
// – Kg Movidos y Total Kg Movidos como fórmulas Excel.
import type ExcelJS from 'exceljs'
import type { SectionBlock } from './trainingUtils'

const WEEKS       = [1, 2, 3, 4, 5, 6]
const WEEK_FIELDS = 5         // CE, Sets, Reps/Watts, KG, R
const FIXED_COLS  = 3         // col1=spacer, col2=ejercicio, col3=obs
const TOTAL_COLS  = FIXED_COLS + WEEKS.length * WEEK_FIELDS  // 33

const LABELS_NORMAL:    string[] = ['CE', 'Sets', 'Reps',  'KG', 'R']
const LABELS_METABOLIC: string[] = ['CE', 'Sets', 'Watts', 'KG', 'R']

// ─── Paleta extraída de la plantilla corporativa ──────────────────────────────
const C = {
  black:    'FF000000',
  white:    'FFFFFFFF',
  darkText: 'FF1A1A1A',
  gray:     'FFCCCCCC',   // encabezados de columna
  peach:    'FFF9CB9C',   // CE col en filas Kg Movidos
  red:      'FF990000',   // fila Kg Movidos y Total
  green:    'FFB6D7A8',   // filas de ejercicio metabólico
  none:     'FFFFFFFF',
} as const

type Section = 'warmup' | 'main' | 'metabolic'

// Colores que coinciden con la app: bg-gray-200/text-gray-800, bg-red-200/text-red-900, bg-green-200/text-green-900
const SECTION_CFG: Record<Section, { label: string; bg: string; fg: string }> = {
  warmup:    { label: 'CALENTAMIENTO', bg: 'FFE5E7EB', fg: 'FF1F2937' },
  main:      { label: 'PRINCIPAL',     bg: 'FFFECACA', fg: 'FF7F1D1D' },
  metabolic: { label: 'METABÓLICO',    bg: 'FFBBF7D0', fg: 'FF14532D' },
}

function weekBaseCol(w: number): number {
  return FIXED_COLS + (w - 1) * WEEK_FIELDS + 1
}

// Convierte número de columna (1-based) a letra(s) Excel: 1→A, 28→AB…
function colLetter(n: number): string {
  let result = ''
  let col    = n
  while (col > 0) {
    col--
    result = String.fromCodePoint(65 + (col % 26)) + result
    col    = Math.floor(col / 26)
  }
  return result
}

function cellRef(col: number, row: number)              { return `${colLetter(col)}${row}` }
function rangeRef(col: number, r1: number, r2: number)  { return `${colLetter(col)}${r1}:${colLetter(col)}${r2}` }

// ─── Helpers de estilo ────────────────────────────────────────────────────────

function fill(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } }
}

function border(): Partial<ExcelJS.Borders> {
  const s = { style: 'thin' as const, color: { argb: 'FFDDDDDD' } }
  return { top: s, bottom: s, left: s, right: s }
}

function baseFont(opts: { bold?: boolean; size?: number; color?: string } = {}): Partial<ExcelJS.Font> {
  return {
    name:  'Arial',
    size:  opts.size  ?? 11,
    bold:  opts.bold  ?? false,
    color: { argb: opts.color ?? C.darkText },
  }
}

/** Aplica bg + fuente + borde + alineación a todos los cols de una fila. */
function styleRow(
  ws:     ExcelJS.Worksheet,
  rowNum: number,
  bg:     string,
  fontOpts: Parameters<typeof baseFont>[0] = {},
  leftAlignCols: number[] = [],
) {
  for (let c = 1; c <= TOTAL_COLS; c++) {
    const cell = ws.getCell(rowNum, c)
    cell.fill      = fill(bg)
    cell.font      = baseFont(fontOpts)
    cell.alignment = {
      horizontal: leftAlignCols.includes(c) ? 'left' : 'center',
      vertical:   'middle',
    }
    cell.border = border()
  }
}

function setVal(ws: ExcelJS.Worksheet, row: number, col: number, value: ExcelJS.CellValue) {
  ws.getCell(row, col).value = value
}

/** Convierte string a número si es posible; si no, lo deja como string vacío o texto. */
function numOrStr(val: string): number | string {
  if (val === '') return ''
  const n = Number(val)
  return Number.isNaN(n) ? val : n
}

function setFormula(ws: ExcelJS.Worksheet, row: number, col: number, formula: string) {
  ws.getCell(row, col).value = { formula }
}

function mergeRow(ws: ExcelJS.Worksheet, row: number, c1: number, c2: number) {
  ws.mergeCells(row, c1, row, c2)
}

/** Borde izquierdo medio en la columna CE de cada semana para delimitar semanas. */
function applyWeekBorders(ws: ExcelJS.Worksheet, rowNum: number) {
  for (const w of WEEKS) {
    const cell = ws.getCell(rowNum, weekBaseCol(w))
    cell.border = {
      ...cell.border,
      left: { style: 'medium', color: { argb: 'FF999999' } },
    }
  }
}

// ─── Bloques del sheet ────────────────────────────────────────────────────────

function writeTitleRow(ws: ExcelJS.Worksheet, r: number, dayName: string): number {
  mergeRow(ws, r, 1, TOTAL_COLS)
  setVal(ws, r, 1, dayName.toUpperCase())
  ws.getRow(r).height = 24
  styleRow(ws, r, C.black, { bold: true, size: 14, color: C.white })
  ws.getCell(r, 1).alignment = { horizontal: 'center', vertical: 'middle' }
  return r + 1
}

/** Cabecera global: etiquetas de semana (Semana 1…6) con Ejercicio/Obs. */
function writeWeekHeaders(ws: ExcelJS.Worksheet, r: number): number {
  for (const w of WEEKS) {
    const base = weekBaseCol(w)
    mergeRow(ws, r, base, base + WEEK_FIELDS - 1)
    setVal(ws, r, base, `Semana ${w}`)
  }
  ws.getRow(r).height = 16
  styleRow(ws, r, C.gray, {})
  applyWeekBorders(ws, r)
  return r + 1
}

function writeSectionHeader(ws: ExcelJS.Worksheet, r: number, section: Section): number {
  const { label, bg, fg } = SECTION_CFG[section]
  mergeRow(ws, r, 1, TOTAL_COLS)
  setVal(ws, r, 1, label)
  ws.getRow(r).height = 18
  styleRow(ws, r, bg, { bold: true, color: fg })
  ws.getCell(r, 1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  return r + 1
}

/** Fila de nombre de bloque (azul claro) + fila de etiquetas de columna (gris).
 *  Devuelve la primera fila disponible para ejercicios. */
function writeBlockHeader(
  ws:          ExcelJS.Worksheet,
  r:           number,
  name:        string,
  isMetabolic: boolean,
): number {
  // Nombre del bloque — azul claro
  mergeRow(ws, r, 1, TOTAL_COLS)
  setVal(ws, r, 1, name)
  ws.getRow(r).height = 16
  styleRow(ws, r, 'FFBDD7EE', { bold: true })
  ws.getCell(r, 1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  r++

  // Etiquetas de columna: Ejercicio | Obs | CE Sets Reps/Watts KG R × 6
  const labels = isMetabolic ? LABELS_METABOLIC : LABELS_NORMAL
  setVal(ws, r, 2, 'Ejercicio')
  setVal(ws, r, 3, 'Observaciones')
  for (const w of WEEKS) {
    labels.forEach((lbl, f) => setVal(ws, r, weekBaseCol(w) + f, lbl))
  }
  ws.getRow(r).height = 14
  styleRow(ws, r, C.gray, { bold: true, size: 10 }, [2, 3])
  applyWeekBorders(ws, r)
  return r + 1
}

function writeExerciseRows(
  ws:          ExcelJS.Worksheet,
  r:           number,
  block:       SectionBlock,
  isMetabolic: boolean,
): { nextRow: number; firstRow: number; lastRow: number } {
  const bg       = isMetabolic ? C.green : C.none
  const firstRow = r

  for (const exRow of block.rows) {
    setVal(ws, r, 2, exRow.exercise || '')
    setVal(ws, r, 3, exRow.notes    || '')
    for (const w of WEEKS) {
      const wd      = exRow.weeks[String(w)] ?? {}
      const setsVal = block.week_sets[String(w)] ?? ''
      const base    = weekBaseCol(w)
      setVal(ws, r, base + 0, numOrStr(wd['ce']  ?? ''))
      setVal(ws, r, base + 1, numOrStr(setsVal))
      setVal(ws, r, base + 2, numOrStr(isMetabolic ? (wd['watts'] ?? '') : (wd['reps'] ?? '')))
      setVal(ws, r, base + 3, numOrStr(wd['kg']  ?? ''))
      setVal(ws, r, base + 4, numOrStr(wd['r']   ?? ''))
    }
    ws.getRow(r).height = 16
    styleRow(ws, r, bg, {}, [2, 3])
    applyWeekBorders(ws, r)
    r++
  }
  return { nextRow: r, firstRow, lastRow: r - 1 }
}

/**
 * Fórmula por semana: =IFERROR(SUMPRODUCT(reps_range,kg_range)*sets_cell/10,"—")
 * Estilo: CE col → peach, resto → dark red + texto blanco.
 */
function writeKgMovidos(
  ws:         ExcelJS.Worksheet,
  r:          number,
  firstExRow: number,
  lastExRow:  number,
): { nextRow: number; kgRow: number } {
  mergeRow(ws, r, 1, FIXED_COLS)
  setVal(ws, r, 1, 'Kg Movidos')
  ws.getRow(r).height = 15

  for (const w of WEEKS) {
    const base      = weekBaseCol(w)
    const setsCell  = cellRef(base + 1, firstExRow)
    const repsRange = rangeRef(base + 2, firstExRow, lastExRow)
    const kgRange   = rangeRef(base + 3, firstExRow, lastExRow)
    const formula   = `IFERROR(SUMPRODUCT(${repsRange},${kgRange})*${setsCell}/10,"—")`

    // CE col: peach; Sets col (donde va el resultado): rojo; Reps/KG/R: rojo vacío
    setVal    (ws, r, base + 0, '')
    setFormula(ws, r, base + 1, formula)
    setVal    (ws, r, base + 2, '')
    setVal    (ws, r, base + 3, '')
    setVal    (ws, r, base + 4, '')
  }

  // Estilo fila completa: rojo + blanco
  styleRow(ws, r, C.red, { bold: true, color: C.white }, [2, 3])
  // CE de cada semana: peach + borde izquierdo medio
  for (const w of WEEKS) {
    const cell  = ws.getCell(r, weekBaseCol(w))
    cell.fill   = fill(C.peach)
    cell.font   = baseFont({ color: C.darkText })
    cell.border = { ...border(), left: { style: 'medium', color: { argb: 'FF999999' } } }
  }
  // Label area (cols 1-3): rojo
  for (let c = 1; c <= FIXED_COLS; c++) {
    ws.getCell(r, c).fill = fill(C.red)
    ws.getCell(r, c).font = baseFont({ bold: true, color: C.white })
  }

  return { nextRow: r + 1, kgRow: r }
}

/**
 * Fórmula por semana: =IFERROR(SUM(kgRow1_setsCol, kgRow2_setsCol,…),"—")
 * Mismo esquema de color que Kg Movidos.
 */
function writeTotalKg(ws: ExcelJS.Worksheet, r: number, kgMovidosRows: number[]): number {
  mergeRow(ws, r, 1, FIXED_COLS)
  setVal(ws, r, 1, 'Total de kg movidos')
  ws.getRow(r).height = 15

  for (const w of WEEKS) {
    const base    = weekBaseCol(w)
    const setsCol = base + 1
    const refs    = kgMovidosRows.map(kr => cellRef(setsCol, kr)).join(',')
    const formula = `IFERROR(SUM(${refs}),"—")`

    setVal    (ws, r, base + 0, '')
    setFormula(ws, r, base + 1, formula)
    setVal    (ws, r, base + 2, '')
    setVal    (ws, r, base + 3, '')
    setVal    (ws, r, base + 4, '')
  }

  styleRow(ws, r, C.red, { bold: true, color: C.white }, [2, 3])
  for (const w of WEEKS) {
    const cell  = ws.getCell(r, weekBaseCol(w))
    cell.fill   = fill(C.peach)
    cell.font   = baseFont({ color: C.darkText })
    cell.border = { ...border(), left: { style: 'medium', color: { argb: 'FF999999' } } }
  }
  for (let c = 1; c <= FIXED_COLS; c++) {
    ws.getCell(r, c).fill = fill(C.red)
    ws.getCell(r, c).font = baseFont({ bold: true, color: C.white })
  }

  return r + 1
}

// ─── Exportación principal ────────────────────────────────────────────────────

export async function exportTrainingDay(dayName: string, sectionBlocks: SectionBlock[]) {
  const { default: ExcelJSDyn } = await import('exceljs')

  const wb = new ExcelJSDyn.Workbook()
  wb.calcProperties.fullCalcOnLoad = true
  const ws = wb.addWorksheet('Sesión')

  ws.getColumn(1).width = 4
  ws.getColumn(2).width = 22
  ws.getColumn(3).width = 16
  for (const w of WEEKS) {
    for (let f = 0; f < WEEK_FIELDS; f++) {
      ws.getColumn(weekBaseCol(w) + f).width = 6.5
    }
  }

  let r = 1
  r = writeTitleRow(ws, r, dayName)
  r = writeWeekHeaders(ws, r)

  for (const section of (['warmup', 'main', 'metabolic'] as Section[])) {
    const blocks = sectionBlocks.filter(b => b.section === section)
    if (blocks.length === 0) continue

    r = writeSectionHeader(ws, r, section)

    const kgMovidosRows: number[] = []

    for (const block of blocks) {
      const isMetabolic = section === 'metabolic'
      r = writeBlockHeader(ws, r, block.name, isMetabolic)

      const { nextRow, firstRow, lastRow } = writeExerciseRows(ws, r, block, isMetabolic)
      r = nextRow

      if (section === 'main') {
        const { nextRow: next, kgRow } = writeKgMovidos(ws, r, firstRow, lastRow)
        kgMovidosRows.push(kgRow)
        r = next
      }
    }

    if (section === 'main' && kgMovidosRows.length > 0) {
      r = writeTotalKg(ws, r, kgMovidosRows)
    }
  }

  const buffer = await wb.xlsx.writeBuffer()
  const blob   = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = `${dayName}.xlsx`
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
