import { useMemo } from 'react'

export function useIncidenciasStats(incidencias: any[], busqueda: string) {
  const filtradas = useMemo(() => {
    if (!busqueda.trim()) return incidencias
    const q = busqueda.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    return incidencias.filter(i =>
      i.nombre_socio.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(q)
    )
  }, [incidencias, busqueda])

  const stats = useMemo(() => ({
    total: filtradas.length,
    pendientes: filtradas.filter(i => i.estado === 'pendiente').length,
    resueltas: filtradas.filter(i => i.estado === 'resuelta').length,
    caducadas: filtradas.filter(i => i.estado === 'caducada').length,
    sinAviso: filtradas.filter(i => i.aviso === false).length
  }), [filtradas])

  return { stats, filtradas }
}
