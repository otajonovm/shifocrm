import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  ROLES,
  isClinicOwner,
  isGlobalSuperAdmin,
  isAdminLike,
  migrateLegacyClinicOwnerSession,
  canAccessAdminRoutes,
  canManageStaff,
  isSoloClinic,
  resolveDoctorLoginRole,
} from './roles.js'

describe('roles', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('isClinicOwner returns true for clinic_owner role', () => {
    expect(isClinicOwner({ userRole: ROLES.CLINIC_OWNER })).toBe(true)
  })

  it('migrates legacy super_admin+clinic scope to clinic_owner', () => {
    localStorage.setItem('userRole', ROLES.SUPER_ADMIN)
    localStorage.setItem('superAdminScope', 'clinic')
    expect(migrateLegacyClinicOwnerSession()).toBe(true)
    expect(localStorage.getItem('userRole')).toBe(ROLES.CLINIC_OWNER)
    expect(localStorage.getItem('superAdminScope')).toBeNull()
    expect(isClinicOwner({ userRole: ROLES.CLINIC_OWNER })).toBe(true)
  })

  it('isGlobalSuperAdmin excludes clinic-scoped legacy session', () => {
    expect(
      isGlobalSuperAdmin({ userRole: ROLES.SUPER_ADMIN, superAdminScope: 'clinic' })
    ).toBe(false)
    expect(
      isGlobalSuperAdmin({ userRole: ROLES.SUPER_ADMIN, superAdminScope: 'global' })
    ).toBe(true)
  })

  it('canAccessAdminRoutes includes clinic_owner and admin', () => {
    expect(canAccessAdminRoutes({ isAuthenticated: true, userRole: ROLES.CLINIC_OWNER })).toBe(true)
    expect(canAccessAdminRoutes({ isAuthenticated: true, userRole: ROLES.ADMIN })).toBe(true)
    expect(canAccessAdminRoutes({ isAuthenticated: true, userRole: ROLES.DOCTOR })).toBe(false)
  })

  it('isAdminLike includes clinic_owner and impersonating admin', () => {
    expect(isAdminLike({ userRole: ROLES.CLINIC_OWNER })).toBe(true)
    expect(isAdminLike({ userRole: ROLES.ADMIN, impersonatorRole: ROLES.SUPER_ADMIN })).toBe(true)
    expect(isAdminLike({ userRole: ROLES.DOCTOR })).toBe(false)
  })

  it('isSoloClinic only matches solo- slug prefix, not max_doctors', () => {
    expect(isSoloClinic({ slug: 'solo-123-abc', max_doctors: 1 })).toBe(true)
    expect(isSoloClinic({ slug: 'my-clinic', max_doctors: 1 })).toBe(false)
    expect(isSoloClinic({ slug: 'dental-pro', max_doctors: 4 })).toBe(false)
  })

  it('resolveDoctorLoginRole assigns solo only for solo clinics', () => {
    expect(resolveDoctorLoginRole({ slug: 'solo-xyz' })).toBe(ROLES.SOLO)
    expect(resolveDoctorLoginRole({ slug: 'clinic-abc', max_doctors: 1 })).toBe(ROLES.DOCTOR)
  })

  it('canManageStaff allows clinic_owner and global super admin, not regular admin', () => {
    expect(canManageStaff({ userRole: ROLES.CLINIC_OWNER })).toBe(true)
    expect(canManageStaff({ userRole: ROLES.SUPER_ADMIN, superAdminScope: 'global' })).toBe(true)
    expect(canManageStaff({ userRole: ROLES.ADMIN, impersonatorRole: ROLES.SUPER_ADMIN })).toBe(true)
    expect(canManageStaff({ userRole: ROLES.ADMIN })).toBe(false)
    expect(canManageStaff({ userRole: ROLES.DOCTOR })).toBe(false)
  })
})
