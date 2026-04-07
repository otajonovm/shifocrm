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

const pageTitle = computed(() => {
  const titles = {
    '/dashboard': t('dashboard.title'),
    '/patients': authStore.userRole === 'solo' ? t('patients.soloTitle') : t('patients.allPatients'),
    '/doctors': t('doctors.title'),
    '/appointments': t('appointments.title'),
    '/leads': t('nav.leads'),
    '/my-leads': t('nav.myLeads'),
    '/payments': t('payments.title'),
    '/services': t('services.title'),
    '/inventory': t('inventory.title'),
    '/reports': t('reports.title'),
    '/settings': t('settings.title'),
    '/my-appointments': t('appointments.myAppointments'),
    '/treatment-plans': t('dashboard.treatmentPlans'),
    '/doctor/profile': t('profile.title'),
  }
  return titles[route.path] || t('dashboard.title')
})

const pageSubtitle = computed(() => {
  const subtitles = {
    '/dashboard': authStore.userRole === 'solo' ? t('soloDashboard.subtitle') : t('dashboard.overview'),
    '/patients': authStore.userRole === 'solo' ? t('patients.soloSubtitle') : t('patients.patientList'),
    '/doctors': t('doctors.doctorsList'),
    '/appointments': t('appointments.appointmentsCalendar'),
    '/leads': t('leads.subtitle'),
    '/my-leads': t('leads.subtitle'),
    '/payments': t('payments.financialReports'),
    '/services': t('services.servicePrices'),
    '/inventory': t('inventory.title'),
    '/reports': t('reports.statistics'),
    '/settings': t('settings.systemSettings'),
    '/my-appointments': t('appointments.appointmentsCalendar'),
    '/treatment-plans': t('dashboard.treatmentPlans'),
    '/doctor/profile': t('profile.personalInfo'),
  }
  return subtitles[route.path] || ''
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

</script>
