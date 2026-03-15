// Hook para cargar los registros de un servicio desde Supabase.
// La RLS filtra automáticamente: admin ve todos, empleado solo los de sus servicios.
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type Registro = {
  id: string
  service_id: string
  employee_id: string | null
  fecha: string        // DATE en DB: YYYY-MM-DD
  hora: string         // TIME en DB: HH:MM:SS
  cliente: string
  tratamiento: string
  notas: string | null
  metodo_pago: 'efectivo' | 'tarjeta'
  precio: number
  profiles: { nombre: string } | null  // empleado que creó el registro
}

export function useRecords(serviceId: string) {
  const [registros, setRegistros] = useState<Registro[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    if (!serviceId) return
    setCargando(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('records')
      .select('*, profiles(nombre)')
      .eq('service_id', serviceId)
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false })

    if (err) {
      setError(err.message)
    } else {
      setRegistros((data as Registro[]) ?? [])
    }
    setCargando(false)
  }, [serviceId])

  useEffect(() => {
    cargar()
  }, [cargar])

  return { registros, cargando, error, recargar: cargar }
}
