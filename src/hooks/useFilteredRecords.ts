// Hook que filtra registros en memoria (sin llamadas a Supabase) usando useMemo.
// Se recalcula solo cuando cambian los registros o los filtros.
import { useMemo } from 'react'
import type { Registro } from './useRecords'
import { normalizar } from '../utils/normalizar'

export type Filtros = {
  cliente: string
  fechaDesde: string
  fechaHasta: string
  tratamiento: string
  metodoPago: '' | 'efectivo' | 'tarjeta'
  precioMin: string
  precioMax: string
}

// Estado inicial de los filtros — exportado para poder resetearlo desde ServicePage
export const FILTROS_VACIOS: Filtros = {
  cliente: '',
  fechaDesde: '',
  fechaHasta: '',
  tratamiento: '',
  metodoPago: '',
  precioMin: '',
  precioMax: '',
}

export function useFilteredRecords(registros: Registro[], filtros: Filtros): Registro[] {
  return useMemo(() => {
    return registros.filter(r => {
      // Texto parcial, case+diacrítico insensitive (via normalizar)
      if (filtros.cliente && !normalizar(r.cliente).includes(normalizar(filtros.cliente))) return false
      if (filtros.tratamiento && !normalizar(r.tratamiento).includes(normalizar(filtros.tratamiento))) return false

      // Rango de fechas: fecha en DB es YYYY-MM-DD, la comparación lexicográfica funciona directamente
      if (filtros.fechaDesde && r.fecha < filtros.fechaDesde) return false
      if (filtros.fechaHasta && r.fecha > filtros.fechaHasta) return false

      // Método de pago exacto
      if (filtros.metodoPago && r.metodo_pago !== filtros.metodoPago) return false

      // Rango de precio
      if (filtros.precioMin !== '' && r.precio < Number.parseFloat(filtros.precioMin)) return false
      if (filtros.precioMax !== '' && r.precio > Number.parseFloat(filtros.precioMax)) return false

      return true
    })
  }, [registros, filtros])
}
