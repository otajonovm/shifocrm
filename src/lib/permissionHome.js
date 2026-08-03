/**
 * Ruxsat berilgan birinchi home route (deny-by-default sessiyalar uchun).
 */

export const DOCTOR_HOME_CANDIDATES = [
  { path: '/dashboard', section: 'dashboard' },
  { path: '/patients', section: 'patients' },
  { path: '/my-appointments', section: 'appointments' },
  { path: '/my-leads', section: 'leads' },
  { path: '/treatment-plans', section: 'treatment_plans' },
  { path: '/doctor/profile', section: 'settings' },
]

export const STAFF_HOME_CANDIDATES = [
  { path: '/dashboard', section: 'dashboard' },
  { path: '/appointments', section: 'appointments' },
  { path: '/patients', section: 'patients' },
  { path: '/payments', section: 'payments' },
  { path: '/leads', section: 'leads' },
  { path: '/reports', section: 'reports' },
]

/**
 * @param {(section: string, action?: string) => boolean} canFn
 * @returns {string}
 */
export function resolveDoctorHomePath(canFn) {
  for (const item of DOCTOR_HOME_CANDIDATES) {
    if (canFn(item.section, 'view')) return item.path
  }
  return '/forbidden'
}

/**
 * @param {(section: string, action?: string) => boolean} canFn
 * @returns {string}
 */
export function resolveStaffHomePath(canFn) {
  for (const item of STAFF_HOME_CANDIDATES) {
    if (canFn(item.section, 'view')) return item.path
  }
  return '/forbidden'
}
