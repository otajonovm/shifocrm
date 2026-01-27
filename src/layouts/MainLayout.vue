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

        <!-- Right: Search, Language, Notifications, User Menu -->
        <div class="flex items-center gap-3">
          <!-- Search (Admin only) -->
          <div v-if="authStore.userRole === 'admin'" class="hidden md:block">
            <div class="relative">
              <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                v-model="searchQuery"
                :placeholder="t('common.search')"
                class="w-64 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <!-- Notifications -->
          <button class="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
            <BellIcon class="w-6 h-6" />
            <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <!-- User Menu -->
          <div class="relative">
            <button
              @click="userMenuOpen = !userMenuOpen"
              class="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <UserCircleIcon class="w-6 h-6 text-gray-500" />
              <ChevronDownIcon class="w-4 h-4 text-gray-500 hidden sm:block" />
            </button>

            <!-- Dropdown -->
            <Transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div
                v-if="userMenuOpen"
                class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50"
              >
                <router-link
                  to="/doctor/profile"
                  class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  @click="userMenuOpen = false"
                >
                  <UserCircleIcon class="w-5 h-5 text-gray-400" />
                  {{ t('common.profile') }}
                </router-link>
                <router-link
                  to="/settings"
                  class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  @click="userMenuOpen = false"
                >
                  <Cog6ToothIcon class="w-5 h-5 text-gray-400" />
                  {{ t('common.settings') }}
                </router-link>
                <router-link
                  to="/help"
                  class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  @click="userMenuOpen = false"
                >
                  <QuestionMarkCircleIcon class="w-5 h-5 text-gray-400" />
                  {{ t('common.help') }}
                </router-link>
                <hr class="my-1 border-gray-100" />
                <button
                  @click="handleLogout"
                  class="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <ArrowRightOnRectangleIcon class="w-5 h-5" />
                  {{ t('common.logout') }}
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="p-4 sm:p-6 lg:p-8">
        <slot />
      </main>
    </div>

    <!-- Click outside to close user menu -->
    <div
      v-if="userMenuOpen"
      class="fixed inset-0 z-40"
      @click="userMenuOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import Sidebar from '@/components/layout/Sidebar.vue'
import {
  Bars3Icon,
  BellIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { t, locale } = useI18n()

const sidebarOpen = ref(false)
const userMenuOpen = ref(false)
const searchQuery = ref('')

const pageTitle = computed(() => {
  const titles = {
    '/dashboard': t('dashboard.title'),
    '/patients': t('patients.allPatients'),
    '/doctors': t('doctors.title'),
    '/appointments': t('appointments.title'),
    '/payments': t('payments.title'),
    '/services': t('services.title'),
    '/inventory': t('inventory.title'),
    '/reports': t('reports.title'),
    '/settings': t('settings.title'),
    '/my-patients': t('patients.myPatients'),
    '/my-appointments': t('appointments.myAppointments'),
    '/treatment-plans': t('dashboard.treatmentPlans'),
    '/doctor/profile': t('profile.title'),
  }
  return titles[route.path] || t('dashboard.title')
})

const pageSubtitle = computed(() => {
  const subtitles = {
    '/dashboard': t('dashboard.overview'),
    '/patients': t('patients.patientList'),
    '/doctors': t('doctors.doctorsList'),
    '/appointments': t('appointments.appointmentsCalendar'),
    '/payments': t('payments.financialReports'),
    '/services': t('services.servicePrices'),
    '/inventory': t('inventory.title'),
    '/reports': t('reports.statistics'),
    '/settings': t('settings.systemSettings'),
    '/my-patients': t('patients.myPatientList'),
    '/my-appointments': t('appointments.appointmentsCalendar'),
    '/treatment-plans': t('dashboard.treatmentPlans'),
    '/doctor/profile': t('profile.personalInfo'),
  }
  return subtitles[route.path] || ''
})

const userInitials = computed(() => {
  if (authStore.userRole === 'admin') return 'AD'
  const email = authStore.userEmail || ''
  return email.slice(0, 2).toUpperCase()
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

</script>
