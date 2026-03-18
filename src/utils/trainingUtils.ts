export type ExerciseRow = {
  id: string
  section_block_id: string
  order_index: number
  exercise: string
  notes: string
  weeks: Record<string, { ce?: string; sets?: string; reps?: string; watts?: string; kg?: string; r?: string }>
}

export type SectionBlock = {
  id: string
  day_id: string
  section: 'warmup' | 'main' | 'metabolic'
  name: string
  order_index: number
  week_sets: Record<string, string>  // clave = número de semana, valor = sets compartidos para todas las filas
  rows: ExerciseRow[]
}

export type WeekStatus = {
  id: string
  day_id: string
  mesocycle_id: string
  week_number: number
  section: string
  completed: boolean
}

// Calcula kg movidos de un sub-bloque para una semana dada.
// Sets es un valor compartido del bloque (no por fila); reps y kg vienen por fila.
// Fórmula: suma de (sets × reps × kg) / 10 por cada fila.
// Devuelve null si algún valor necesario está vacío.
export function calcularKgMovidos(filas: ExerciseRow[], semana: number, setsValue: string): number | null {
  if (filas.length === 0) return null

  const sets = Number.parseFloat(setsValue)
  if (Number.isNaN(sets)) return null

  let total = 0
  for (const fila of filas) {
    const w = fila.weeks[String(semana)]
    const reps = Number.parseFloat(w?.reps ?? '')
    const kg = Number.parseFloat(w?.kg ?? '')

    if (Number.isNaN(reps) || Number.isNaN(kg)) return null
    total += (sets * reps * kg) / 10
  }

  return total
}

// Suma kg movidos de todos los sub-bloques de la sección principal para una semana.
// Devuelve null si algún sub-bloque devuelve null.
export function calcularTotalKgMovidos(subbloques: SectionBlock[], semana: number): number | null {
  if (subbloques.length === 0) return null

  let total = 0
  for (const bloque of subbloques) {
    const setsValue = bloque.week_sets[String(semana)] ?? ''
    const kg = calcularKgMovidos(bloque.rows, semana, setsValue)
    if (kg === null) return null
    total += kg
  }

  return total
}
