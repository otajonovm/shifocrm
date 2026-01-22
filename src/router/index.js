import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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
      meta: { requiresAuth: true, requiresRole: 'admin' },
    },
    {
      path: '/patients/:id',
      name: 'patient-detail',
      component: () => import('@/views/PatientDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/my-patients',
      name: 'my-patients',
      component: () => import('@/views/PatientsView.vue'),
      meta: { requiresAuth: true, requiresRole: 'doctor' },
    },
    {
      path: '/doctors',
      name: 'doctors',
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
      meta: { requiresAuth: true, requiresRole: 'admin' },
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
      meta: { requiresAuth: true, requiresRole: 'admin' },
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
      path: '/',
      redirect: '/dashboard',
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Redirect authenticated users away from login page
  if (to.name === 'login' && authStore.isAuthenticated) {
    const defaultRoute = authStore.userRole === 'doctor' ? 'dashboard' : 'dashboard'
    next({ name: defaultRoute })
    return
  }

  // Check authentication requirement
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  // Check role requirement
  if (to.meta.requiresRole) {
    if (to.meta.requiresRole === 'admin' && authStore.userRole !== 'admin') {
      // Redirect to appropriate dashboard
      const defaultRoute = authStore.userRole === 'doctor' ? 'dashboard' : 'dashboard'
      next({ name: defaultRoute })
      return
    }
    if (to.meta.requiresRole === 'doctor' && authStore.userRole !== 'doctor') {
      next({ name: 'dashboard' })
      return
    }
  }

  next()
})

export default router
