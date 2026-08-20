import { usePatientsStore } from '@/stores/patients'
import { useDoctorsStore } from '@/stores/doctors'
import { useEmployeesStore } from '@/stores/employees'

/** Chiqish / klinika almashinuvida keshni tozalash. */
export function resetAppCaches() {
  try {
    usePatientsStore().reset()
  } catch { /* store hali yaratilmagan */ }
  try {
    useDoctorsStore().reset()
  } catch { /* ignore */ }
  try {
    useEmployeesStore().reset()
  } catch { /* ignore */ }
  import('@/stores/reports').then(({ useReportsStore }) => {
    try {
      useReportsStore().reset()
    } catch { /* ignore */ }
  }).catch(() => {})
}
