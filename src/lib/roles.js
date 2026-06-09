/**
 * Markaziy rol tekshiruvlari va UI label/badge helperlari.
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  CLINIC_OWNER: 'clinic_owner',
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  SOLO: 'solo',
}

const SUPER_ADMIN_SCOPE_KEY = 'superAdminScope'

/** Eski sessiya: super_admin + scope=clinic → clinic_owner deb hisoblanadi */
export function isLegacyClinicScopedSuperAdmin(authOrRole, scope) {
  const role = typeof authOrRole === 'object' ? authOrRole?.userRole : authOrRole
  const s = scope ?? (typeof authOrRole === 'object' ? authOrRole?.superAdminScope : null)
    ?? localStorage.getItem(SUPER_ADMIN_SCOPE_KEY)
  return role === ROLES.SUPER_ADMIN && s === 'clinic'
}

export function isGlobalSuperAdmin(authStore) {
  if (!authStore) return false
  const role = authStore.userRole
  if (role !== ROLES.SUPER_ADMIN) return false
  if (authStore.impersonatorRole === ROLES.SUPER_ADMIN) return false
  return !isLegacyClinicScopedSuperAdmin(authStore)
}

export function isClinicOwner(authStore) {
  if (!authStore) return false
  if (authStore.userRole === ROLES.CLINIC_OWNER) return true
  return isLegacyClinicScopedSuperAdmin(authStore)
}

export function isClinicAdmin(authStore) {
  return authStore?.userRole === ROLES.ADMIN
}

/** Klinika boshqaruvi: rahbar, administrator yoki super admin impersonation */
export function isAdminLike(authStore) {
  if (!authStore) return false
  if (isClinicOwner(authStore) || isClinicAdmin(authStore)) return true
  if (authStore.impersonatorRole === ROLES.SUPER_ADMIN && authStore.userRole === ROLES.ADMIN) {
    return true
  }
  return false
}

export function isDoctor(authStore) {
  return authStore?.userRole === ROLES.DOCTOR
}

export function isSolo(authStore) {
  return authStore?.userRole === ROLES.SOLO
}

export function isDoctorLike(authStore) {
  return isDoctor(authStore) || isSolo(authStore)
}

/**
 * Super Admin orqali yaratilgan yakka stom klinikasi (slug: solo-...).
 * max_doctors=1 bo'lishi yakka stom degani EMAS — jamoa klinikasi ham 1 limitli bo'lishi mumkin.
 */
export function isSoloClinic(clinic) {
  if (!clinic) return false
  const slug = String(clinic.slug || '').trim().toLowerCase()
  return slug.startsWith('solo-')
}

/** Doktor login: yakka stom yoki klinika shifokori */
export function resolveDoctorLoginRole(clinic) {
  return isSoloClinic(clinic) ? ROLES.SOLO : ROLES.DOCTOR
}

/**
 * Eski localStorage sessiyasini yangi rolga migratsiya qiladi.
 * @returns {boolean} migratsiya bajarildimi
 */
export function migrateLegacyClinicOwnerSession() {
  const role = localStorage.getItem('userRole')
  const scope = localStorage.getItem(SUPER_ADMIN_SCOPE_KEY)
  if (role !== ROLES.SUPER_ADMIN || scope !== 'clinic') return false

  localStorage.setItem('userRole', ROLES.CLINIC_OWNER)
  localStorage.removeItem(SUPER_ADMIN_SCOPE_KEY)

  const raw = localStorage.getItem('user')
  if (raw) {
    try {
      const user = JSON.parse(raw)
      if (user && !user.account_type) {
        user.account_type = 'clinic_owner'
        localStorage.setItem('user', JSON.stringify(user))
      }
    } catch {
      // ignore
    }
  }
  return true
}

export function getRoleLabel(authStore, t) {
  if (!authStore || !t) return ''
  if (isGlobalSuperAdmin(authStore)) return t('role.superAdmin')
  if (isClinicOwner(authStore)) return t('role.clinicOwner')
  if (isClinicAdmin(authStore) || (authStore.userRole === ROLES.ADMIN)) return t('role.administrator')
  if (isSolo(authStore)) return t('role.solo')
  if (isDoctor(authStore)) return t('role.doctor')
  return authStore.userEmail || t('role.doctor')
}

export function getRoleBadgeClass(authStore) {
  if (isGlobalSuperAdmin(authStore)) return 'bg-purple-100 text-purple-700'
  if (isClinicOwner(authStore)) return 'bg-amber-100 text-amber-800'
  if (isClinicAdmin(authStore) || authStore?.userRole === ROLES.ADMIN) {
    return 'bg-orange-100 text-orange-700'
  }
  if (isSolo(authStore)) return 'bg-teal-100 text-teal-700'
  return 'bg-green-100 text-green-700'
}

export function getDisplayUserName(authStore, t) {
  if (!authStore || !t) return ''
  if (isGlobalSuperAdmin(authStore)) return t('role.superAdmin')
  if (isClinicOwner(authStore)) {
    return authStore.user?.login || t('role.clinicOwner')
  }
  if (isClinicAdmin(authStore) || authStore.userRole === ROLES.ADMIN) {
    return authStore.user?.login || t('role.administrator')
  }
  if (isSolo(authStore)) {
    return authStore.user?.full_name || authStore.userEmail || t('role.solo')
  }
  return authStore.userEmail || authStore.user?.full_name || t('role.doctor')
}

/** Xodimlar bo'limida qo'shish, o'chirish, ruxsatlar */
export function canManageStaff(authStore) {
  if (!authStore) return false
  if (isGlobalSuperAdmin(authStore) || isClinicOwner(authStore)) return true
  if (authStore.impersonatorRole === ROLES.SUPER_ADMIN && authStore.userRole === ROLES.ADMIN) {
    return true
  }
  return false
}

/** Router: admin-only route lar uchun ruxsat */
export function canAccessAdminRoutes(authStore) {
  if (!authStore?.isAuthenticated) return false
  if (isAdminLike(authStore)) return true
  if (authStore.userRole === ROLES.SOLO) return true
  if (isLegacyClinicScopedSuperAdmin(authStore)) return true
  return authStore.userRole === ROLES.ADMIN
}
