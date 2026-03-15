// Hook que calcula estadísticas mensuales sobre los registros ya cargados.
// Devuelve métricas del mes seleccionado y un resumen de todos los meses del año.
// No hace llamadas a Supabase — todo se calcula con useMemo en frontend.
import { useMemo } from 'react'
import type { Registro } from './useRecords'

export type StatsMes = {
  mes: number          // 1–12
  totalIngresos: number
  numSesiones: number
  totalEfectivo: number
  totalTarjeta: number
  ticketMedio: number
}

// Calcula las métricas para un conjunto de registros ya filtrados por mes/año
function calcularStats(registros: Registro[]): Omit<StatsMes, 'mes'> {
  const totalIngresos = registros.reduce((s, r) => s + r.precio, 0)
  const numSesiones = registros.length
  const totalEfectivo = registros
    .filter(r => r.metodo_pago === 'efectivo')
    .reduce((s, r) => s + r.precio, 0)
  const totalTarjeta = registros
    .filter(r => r.metodo_pago === 'tarjeta')
    .reduce((s, r) => s + r.precio, 0)
  const ticketMedio = numSesiones > 0 ? totalIngresos / numSesiones : 0
  return { totalIngresos, numSesiones, totalEfectivo, totalTarjeta, ticketMedio }
}

export function useStats(registros: Registro[], mes: number, year: number) {
  // Métricas del mes seleccionado
  const statsMes = useMemo(() => {
    const filtrados = registros.filter(r => {
      // r.fecha es YYYY-MM-DD — comparamos directamente con string para evitar zona horaria
      const [y, m] = r.fecha.split('-').map(Number)
      return y === year && m === mes
    })
    return calcularStats(filtrados)
  }, [registros, mes, year])

  // Resumen anual: un objeto por cada mes del año seleccionado (1–12)
  const resumenAnual: StatsMes[] = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const numMes = i + 1
      const filtrados = registros.filter(r => {
        const [y, m] = r.fecha.split('-').map(Number)
        return y === year && m === numMes
      })
      return { mes: numMes, ...calcularStats(filtrados) }
    })
  }, [registros, year])

  return { statsMes, resumenAnual }
}
