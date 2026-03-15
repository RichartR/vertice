// Helper reutilizable para sincronizar asignaciones en service_employees.
// Aplica el patrón DELETE + INSERT: borra las filas actuales y reinserta las nuevas.
// Se usa desde AdminUsersPage (por empleado) y AdminServicesPage (por servicio).
import { supabase } from '../lib/supabase'

/**
 * Actualiza los servicios asignados a un empleado.
 * Borra todas las filas con employee_id = employeeId y las reinserta.
 */
export async function updateEmployeeServices(
  employeeId: string,
  serviceIds: string[]
): Promise<void> {
  await supabase.from('service_employees').delete().eq('employee_id', employeeId)

  if (serviceIds.length > 0) {
    await supabase.from('service_employees').insert(
      serviceIds.map(service_id => ({ employee_id: employeeId, service_id }))
    )
  }
}

/**
 * Actualiza los empleados asignados a un servicio.
 * Borra todas las filas con service_id = serviceId y las reinserta.
 */
export async function updateServiceEmployees(
  serviceId: string,
  employeeIds: string[]
): Promise<void> {
  await supabase.from('service_employees').delete().eq('service_id', serviceId)

  if (employeeIds.length > 0) {
    await supabase.from('service_employees').insert(
      employeeIds.map(employee_id => ({ service_id: serviceId, employee_id }))
    )
  }
}
