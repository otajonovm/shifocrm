import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  canAccessAdminRoutes,
  canAccessWarehouse,
  canManageStaff,
  isClinicOwner,
  isGlobalSuperAdmin,
  isLegacyClinicScopedSuperAdmin,
  ROLES,
} from '@/lib/roles'
import { checkDataPermission } from '@/lib/dataPermission'
import { useDoctorPermissionsStore } from '@/stores/doctorPermissions'
import { useEmployeePermissionsStore } from '@/stores/employeePermissions'
import { useEmployeesStore } from '@/stores/employees'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/patients',
      name: 'patients',
      component: () => import('@/views/PatientsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/patients/:id',
      name: 'patient-detail',
      component: () => import('@/views/PatientDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/my-patients',
      redirect: '/patients',
    },
    {
      path: '/doctors',
      name: 'doctors',
      component: () => import('@/views/DoctorsView.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' },
    },
    {
      path: '/staff',
      name: 'staff',
      component: () => import('@/views/DoctorsView.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' },
    },
    {
      path: '/appointments',
      name: 'appointments',
      component: () => import('@/views/AppointmentsView.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' },
    },
    {
      path: '/my-appointments',
      name: 'my-appointments',
      component: () => import('@/views/AppointmentsView.vue'),
      meta: { requiresAuth: true, requiresRole: 'doctor' },
    },
    {
      path: '/payments',
      name: 'payments',
      component: () => import('@/views/PaymentsView.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin', dataPermission: 'can_view_revenue' },
    },
    {
      path: '/services',
      name: 'services',
      component: () => import('@/views/ServicesView.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' },
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('@/views/ReportsView.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin', dataPermission: 'can_view_revenue' },
    },
    {
      path: '/audit',
      name: 'audit',
      component: () => import('@/views/AuditLogView.vue'),
      meta: { requiresAuth: true, requiresOwner: true },
    },
    {
      path: '/leads',
      name: 'leads',
      component: () => import('@/views/LeadsView.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' },
    },
    {
      path: '/my-leads',
      name: 'my-leads',
      component: () => import('@/views/LeadsView.vue'),
      meta: { requiresAuth: true, requiresRole: 'doctor' },
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: () => import('@/views/WarehouseView.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin', requiresWarehouse: true },
    },
    {
      path: '/warehouse',
      redirect: { name: 'inventory' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/treatment-plans',
      name: 'treatment-plans',
      component: () => import('@/views/TreatmentPlansView.vue'),
      meta: { requiresAuth: true, requiresRole: 'doctor' },
    },
    {
      path: '/doctor/profile',
      name: 'doctor-profile',
      component: () => import('@/views/DoctorProfileView.vue'),
      meta: { requiresAuth: true, requiresRole: 'doctor' },
    },
    {
      path: '/admin',
      redirect: { name: 'admin-clinics' },
    },
    {
      path: '/admin/clinics',
      name: 'admin-clinics',
      component: () => import('@/views/superadmin/AdminClinicsView.vue'),
      meta: { requiresAuth: true, requiresRole: 'super_admin' },
    },
    {
      path: '/admin/clinics/new',
      name: 'admin-clinics-new',
      component: () => import('@/views/superadmin/AdminClinicFormView.vue'),
      meta: { requiresAuth: true, requiresRole: 'super_admin' },
    },
    {
      path: '/admin/clinics/:id/edit',
      name: 'admin-clinics-edit',
      component: () => import('@/views/superadmin/AdminClinicFormView.vue'),
      meta: { requiresAuth: true, requiresRole: 'super_admin' },
    },
    {
      path: '/admin/solo-doctor/new',
      name: 'admin-solo-doctor-new',
      component: () => import('@/views/superadmin/AdminSoloDoctorFormView.vue'),
      meta: { requiresAuth: true, requiresRole: 'super_admin' },
    },
    {
      path: '/d/:slug',
      name: 'doctor-public-profile',
      component: () => import('@/views/DoctorPublicProfileView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/c/:slug',
      name: 'clinic-public-profile',
      component: () => import('@/views/ClinicPublicProfileView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      redirect: '/dashboard',
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const impersonatorRole = localStorage.getItem('impersonatorRole')

  // Redirect authenticated users away from login page
  if (to.name === 'login' && authStore.isAuthenticated) {
    if (isClinicOwner(authStore) || isLegacyClinicScopedSuperAdmin(authStore)) {
      next({ name: 'dashboard' })
      return
    }
    const defaultRoute = isGlobalSuperAdmin(authStore)
      ? 'admin-clinics'
      : 'dashboard'
    next({ name: defaultRoute })
    return
  }

  // Check authentication requirement
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  // Global super admin uses /admin; redirect dashboard to clinics (not when impersonating)
  if (
    to.name === 'dashboard'
    && isGlobalSuperAdmin(authStore)
    && impersonatorRole !== ROLES.SUPER_ADMIN
  ) {
    next({ name: 'admin-clinics' })
    return
  }

  // Solo doktor /doctors ga kirmasa — profilga yo'naltirish
  if (to.name === 'doctors' && authStore.userRole === ROLES.SOLO) {
    next({ name: 'doctor-profile' })
    return
  }

  // Klinika administratori uchun /doctors → Sozlamalar (rahbar /staff ga kira oladi)
  if (to.name === 'doctors' && authStore.userRole === ROLES.ADMIN) {
    next({ name: 'settings' })
    return
  }

  // Shifokor admin bo'limlariga kirmasin
  if (
    (to.name === 'staff' || to.name === 'doctors')
    && authStore.userRole === ROLES.DOCTOR
  ) {
    next({ name: 'dashboard' })
    return
  }

  // Faqat rahbar (klinika rahbari / super admin) uchun sahifalar (masalan, audit)
  if (to.meta.requiresOwner && !canManageStaff(authStore)) {
    next({ name: 'dashboard' })
    return
  }

  // Check role requirement
  if (to.meta.requiresRole) {
    // Super admin panel: faqat global super admin yoki impersonation paytida
    if (to.meta.requiresRole === ROLES.SUPER_ADMIN) {
      if (impersonatorRole !== ROLES.SUPER_ADMIN && !isGlobalSuperAdmin(authStore)) {
        next({ name: 'dashboard' })
        return
      }
      if (isClinicOwner(authStore)) {
        next({ name: 'dashboard' })
        return
      }
    }

    // Admin route: admin, clinic_owner, solo, impersonation
    if (to.meta.requiresRole === ROLES.ADMIN && !canAccessAdminRoutes(authStore)) {
      const defaultRoute = isGlobalSuperAdmin(authStore) ? 'admin-clinics' : 'dashboard'
      next({ name: defaultRoute })
      return
    }

    // Doctor route: doctor yoki solo
    if (
      to.meta.requiresRole === ROLES.DOCTOR
      && authStore.userRole !== ROLES.DOCTOR
      && authStore.userRole !== ROLES.SOLO
    ) {
      next({ name: 'dashboard' })
      return
    }
  }

  // Ma'lumot huquqlari (P2 enforcement)
  if (to.meta.dataPermission && authStore.isAuthenticated) {
    const doctorPermsStore = useDoctorPermissionsStore()
    const employeePermsStore = useEmployeePermissionsStore()
    const employeesStore = useEmployeesStore()

    const allowed = checkDataPermission(authStore, to.meta.dataPermission, {
      doctorPermsStore,
      employeePermsStore,
      employeesStore,
    })

    if (!allowed) {
      next({ name: 'dashboard' })
      return
    }
  }

  // Yakka stomatologlar ombor moduliga kira olmaydi
  if (to.meta.requiresWarehouse && !canAccessWarehouse(authStore)) {
    next({ name: 'dashboard' })
    return
  }

  next()
})

export default router
