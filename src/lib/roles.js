/**
 * Markaziy rol tekshiruvlari va UI label/badge helperlari.
 */

export const ROLES = {
  SUPERADMIN: 'superadmin',
  SUPER_ADMIN: 'superadmin',
  LEGACY_SUPER_ADMIN: 'super_admin',
  CLINIC_OWNER: 'clinic_owner',
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  SOLO: 'solo',
  CHIEF_DOCTOR: 'chief_doctor',
  RECEPTION: 'reception',
  CASHIER: 'cashier',
  ASSISTANT: 'assistant',
}

const SUPER_ADMIN_SCOPE_KEY = 'superAdminScope'

export function normalizeRole(role) {
  if (role === ROLES.LEGACY_SUPER_ADMIN) return ROLES.SUPERADMIN
  return role
}

export function isSuperAdminRole(role) {
  return normalizeRole(role) === ROLES.SUPERADMIN
}

/** Eski sessiya: super_admin + scope=clinic → clinic_owner deb hisoblanadi */
export function isLegacyClinicScopedSuperAdmin(authOrRole, scope) {
  const role = typeof authOrRole === 'object' ? authOrRole?.userRole : authOrRole
  const s = scope ?? (typeof authOrRole === 'object' ? authOrRole?.superAdminScope : null)
    ?? localStorage.getItem(SUPER_ADMIN_SCOPE_KEY)
  return isSuperAdminRole(role) && s === 'clinic'
}

export function isGlobalSuperAdmin(authStore) {
  if (!authStore) return false
  const role = normalizeRole(authStore.userRole)
  if (role !== ROLES.SUPERADMIN) return false
  if (isSuperAdminRole(authStore.impersonatorRole)) return false
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
  return authStore?.userRole === ROLES.DOCTOR || authStore?.userRole === ROLES.CHIEF_DOCTOR
}

export function isSolo(authStore) {
  return authStore?.userRole === ROLES.SOLO
}

export function isDoctorLike(authStore) {
  return isDoctor(authStore) || isSolo(authStore)
}

export function isCashier(authStore) {
  return authStore?.userRole === ROLES.CASHIER
}

export function isReception(authStore) {
  return authStore?.userRole === ROLES.RECEPTION
}

export function isAssistant(authStore) {
  return authStore?.userRole === ROLES.ASSISTANT
}

export function isStaffOps(authStore) {
  return isCashier(authStore) || isReception(authStore) || isAssistant(authStore)
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
 * Klinika rahbari login+parol sessiyasi uchun rol.
 * Yakka stom (solo- slug yoki max_doctors=1) → solo; aks holda clinic_owner.
 */
export function resolveClinicOwnerSessionRole(clinic) {
  if (!clinic) return ROLES.CLINIC_OWNER
  if (isSoloClinic(clinic)) return ROLES.SOLO
  if (Number(clinic.max_doctors) === 1) return ROLES.SOLO
  return ROLES.CLINIC_OWNER
}

/**
 * Eski localStorage sessiyasini yangi rolga migratsiya qiladi.
 * @returns {boolean} migratsiya bajarildimi
 */
export function migrateLegacyClinicOwnerSession() {
  const role = localStorage.getItem('userRole')
  const scope = localStorage.getItem(SUPER_ADMIN_SCOPE_KEY)
  if (!isSuperAdminRole(role) || scope !== 'clinic') return false

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
  if (authStore.userRole === ROLES.CHIEF_DOCTOR) return t('role.chiefDoctor') || 'Bosh shifokor'
  if (authStore.userRole === ROLES.RECEPTION) return t('role.reception') || 'Qabulxona'
  if (authStore.userRole === ROLES.CASHIER) return t('role.cashier') || 'Kassir'
  if (authStore.userRole === ROLES.ASSISTANT) return t('role.assistant') || 'Assistent'
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

/**
 * Audit, daftar import, boshqaruv markazi, foydalanuvchilar —
 * faqat global super admin yoki klinikaga kirgan super admin.
 */
export function canAccessSuperAdminTools(authStore) {
  if (!authStore) return false
  if (isGlobalSuperAdmin(authStore)) return true
  return isSuperAdminRole(authStore.impersonatorRole)
}

/** employees.role (DB) → sessiya roli */
export function employeeDbRoleToAuthRole(dbRole) {
  const role = String(dbRole || '').trim().toLowerCase()
  if (role === 'administrator' || role === 'super_admin' || role === 'superadmin') return ROLES.ADMIN
  if (role === 'clinic_owner') return ROLES.CLINIC_OWNER
  if (role === 'chief_doctor') return ROLES.CHIEF_DOCTOR
  if (role === 'reception' || role === 'receptionist') return ROLES.RECEPTION
  if (role === 'cashier') return ROLES.CASHIER
  if (role === 'assistant') return ROLES.ASSISTANT
  // Admin portal orqali employee.doctor login qilmasin — shifokor tab ishlatiladi
  if (role === 'doctor') return null
  return null
}

/** Router: admin-only route lar uchun ruxsat */
export function canAccessAdminRoutes(authStore) {
  if (!authStore?.isAuthenticated) return false
  if (isAdminLike(authStore)) return true
  if (authStore.userRole === ROLES.SOLO) return true
  if (isLegacyClinicScopedSuperAdmin(authStore)) return true
  return authStore.userRole === ROLES.ADMIN
}

/** Aqlli Ombor — faqat ko'p xonali klinika adminlari (yakka stom uchun emas) */
export function canAccessWarehouse(authStore) {
  if (!authStore?.isAuthenticated) return false
  if (isSolo(authStore)) return false
  return isAdminLike(authStore)
}

/** Bemor to'lovlari, yakunlash, material sarfi */
export function canManagePatientBilling(authStore) {
  if (!authStore?.isAuthenticated) return false
  return isAdminLike(authStore) || isDoctorLike(authStore) || isCashier(authStore)
}

/** Klinika foydasi / jamoa KPI — default deny reception/cashier/assistant */
export function canViewClinicProfit(authStore) {
  if (!authStore?.isAuthenticated) return false
  if (isGlobalSuperAdmin(authStore) || isClinicOwner(authStore) || isSolo(authStore)) return true
  if (authStore.userRole === ROLES.CHIEF_DOCTOR) return true
  if (isStaffOps(authStore)) return false
  return isClinicAdmin(authStore)
}
