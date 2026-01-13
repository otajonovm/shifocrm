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
      path: '/doctors',
      name: 'doctors',
      component: () => import('@/views/DoctorsView.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' },
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
    const defaultRoute = authStore.userRole === 'doctor' ? '/doctor/profile' : '/dashboard'
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
      const defaultRoute = authStore.userRole === 'doctor' ? '/doctor/profile' : '/dashboard'
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
