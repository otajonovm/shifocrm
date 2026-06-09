/**
 * Tizim amallari audit jurnali (Activity Log) yordamchisi.
 *
 * Maqsad: rahbar (super_admin/clinic_owner) qaysi xodim qanday amal bajarganini
 * o'chirib bo'lmaydigan (read-only) jurnalda ko'ra olishi.
 *
 * Amallar `activity_logs` jadvaliga yoziladi. Aktyor (kim qilgani) ma'lumotlari
 * localStorage sessiyasidan olinadi va `details` ichida saqlanadi, chunki
 * frontend anon kalit bilan ishlaydi.
 */

import { logEmployeeActivity } from '@/api/employeesApi'

/** Joriy foydalanuvchi (aktyor) ma'lumotlarini localStorage sessiyasidan oladi. */
export function getCurrentActor() {
  let user = null
  try {
    user = JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    user = null
  }
  const role = localStorage.getItem('userRole') || null
  let clinicId = null
  const rawClinic = localStorage.getItem('userClinicId')
  if (rawClinic != null && rawClinic !== '') {
    const n = Number(rawClinic)
    clinicId = Number.isFinite(n) ? n : null
  }
  if (clinicId == null && user?.clinic_id != null) {
    const n = Number(user.clinic_id)
    clinicId = Number.isFinite(n) ? n : null
  }

  const name =
    user?.full_name ||
    user?.name ||
    user?.email ||
    localStorage.getItem('userEmail') ||
    'Tizim foydalanuvchisi'

  return {
    name,
    role,
    clinicId,
    employeeId: user?.employee_id || null,
  }
}

/** Rol kodlarini o'zbekcha nomga aylantiradi. */
export function actorRoleLabel(role) {
  const labels = {
    super_admin: 'Bosh administrator',
    clinic_owner: 'Klinika rahbari',
    admin: 'Administrator',
    reception: 'Qabulxona',
    cashier: 'Kassir',
    doctor: 'Shifokor',
    solo: 'Yakka shifokor',
    nurse: 'Hamshira',
  }
  return labels[role] || role || 'Foydalanuvchi'
}

/**
 * Audit jurnaliga yozuv qo'shadi. Hech qachon asosiy oqimni to'xtatmaydi
 * (xatolik bo'lsa faqat konsolga yoziladi).
 *
 * @param {object} entry
 * @param {string} entry.action - Mashina kodi, masalan: 'payment.delete'
 * @param {string} entry.summary - Lo'nda o'zbekcha matn (rahbarga ko'rinadi)
 * @param {string} [entry.entity] - Ob'ekt turi: 'payment' | 'service' | 'visit'...
 * @param {string|number} [entry.entityId]
 * @param {object} [entry.meta] - Qo'shimcha tafsilotlar (eski/yangi qiymatlar)
 */
export async function logActivity({ action, summary, entity = null, entityId = null, meta = {} }) {
  try {
    if (!action) return null
    const actor = getCurrentActor()

    const details = {
      summary: summary || action,
      entity,
      entity_id: entityId != null ? String(entityId) : null,
      actor_name: actor.name,
      actor_role: actor.role,
      clinic_id: actor.clinicId,
      meta: meta || {},
      logged_at: new Date().toISOString(),
    }

    return await logEmployeeActivity(actor.employeeId, action, details)
  } catch (error) {
    console.warn('⚠️ Audit jurnaliga yozib bo\'lmadi:', error)
    return null
  }
}
