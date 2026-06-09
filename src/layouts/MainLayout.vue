<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <Sidebar
      :is-open="sidebarOpen"
      @close="sidebarOpen = false"
      @logout="handleLogout"
    />

    <!-- Main Content -->
    <div class="lg:pl-64">
      <!-- Header -->
      <header class="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 sm:px-6 lg:px-8">
        <!-- Left: Mobile menu & Page title -->
        <div class="flex items-center gap-4">
          <!-- Mobile menu button -->
          <button
            @click="sidebarOpen = true"
            class="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg lg:hidden"
          >
            <Bars3Icon class="w-6 h-6" />
          </button>

          <!-- Page Title -->
          <div class="hidden sm:block">
            <h1 class="text-xl font-semibold text-gray-900">{{ pageTitle }}</h1>
            <p class="text-sm text-gray-500">{{ pageSubtitle }}</p>
          </div>
        </div>

        <!-- Right: ShifoAI -->
        <div class="flex items-center gap-3">
          <!-- ShifoAI -->
          <div class="relative">
            <button
              type="button"
              @click="shifoAIOpen = true"
              class="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="ShifoAI — Tizim yordamchisi"
            >
              <div class="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                <SparklesIcon class="w-4 h-4 text-white" />
              </div>
              <span class="hidden sm:inline text-sm font-medium text-gray-700">ShifoAI</span>
            </button>
          </div>

        </div>
      </header>

      <!-- Page Content -->
      <main class="p-4 sm:p-6 lg:p-8">
        <slot />
      </main>
    </div>

    <!-- ShifoAI Panel -->
    <ShifoAIPanel :open="shifoAIOpen" @close="shifoAIOpen = false" />

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ROLES } from '@/lib/roles'
import { useI18n } from 'vue-i18n'
import Sidebar from '@/components/layout/Sidebar.vue'
import ShifoAIPanel from '@/components/shared/ShifoAIPanel.vue'
import {
  Bars3Icon,
  SparklesIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { t } = useI18n()

const sidebarOpen = ref(false)
const shifoAIOpen = ref(false)

const PAGE_ROUTE_KEYS = {
  '/dashboard': 'dashboard',
  '/patients': 'patients',
  '/staff': 'doctors',
  '/doctors': 'doctors',
  '/appointments': 'appointments',
  '/my-appointments': 'myAppointments',
  '/leads': 'leads',
  '/my-leads': 'leads',
  '/payments': 'payments',
  '/services': 'services',
  '/inventory': 'inventory',
  '/reports': 'reports',
  '/settings': 'settings',
  '/treatment-plans': 'treatmentPlans',
  '/doctor/profile': 'doctorProfile',
}

const resolvePageKey = (path) => {
  if (PAGE_ROUTE_KEYS[path]) return PAGE_ROUTE_KEYS[path]
  if (path.startsWith('/patients/')) return 'patients'
  return null
}

const pageTitle = computed(() => {
  const path = route.path
  const role = authStore.userRole

  if (path === '/dashboard') {
    if (role === ROLES.DOCTOR || role === ROLES.SOLO) {
      return t('page.myDashboard.title')
    }
    return t('dashboard.title')
  }

  if (path === '/patients' && (role === ROLES.DOCTOR || role === ROLES.SOLO)) {
    return t('page.myPatients.title')
  }

  const pageKey = resolvePageKey(path)
  if (pageKey) {
    const key = `page.${pageKey}.title`
    const translated = t(key)
    if (translated !== key) return translated
  }

  return t('dashboard.title')
})

const pageSubtitle = computed(() => {
  const path = route.path
  const role = authStore.userRole

  if (path === '/dashboard') {
    if (role === ROLES.DOCTOR || role === ROLES.SOLO) {
      return t('page.myDashboard.subtitle')
    }
    return role === ROLES.SOLO ? t('soloDashboard.subtitle') : t('dashboard.overview')
  }

  if (path === '/patients' && (role === ROLES.DOCTOR || role === ROLES.SOLO)) {
    return t('page.myPatients.subtitle')
  }

  const pageKey = resolvePageKey(path)
  if (pageKey) {
    const key = `page.${pageKey}.subtitle`
    const translated = t(key)
    if (translated !== key) return translated
  }

  return ''
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

</script>
