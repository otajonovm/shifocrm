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
          <!-- Search (Admin + Solo) -->
          <div v-if="authStore.userRole === 'admin' || authStore.userRole === 'solo'" class="hidden md:block">
            <div class="relative">
              <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                v-model="searchQuery"
                @keyup.enter="handleGlobalSearch"
                @focus="showSearchResults = true"
                :placeholder="t('common.search')"
                class="w-64 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <!-- Search Results Dropdown -->
              <Transition
                enter-active-class="transition ease-out duration-100"
                enter-from-class="transform opacity-0 scale-95"
                enter-to-class="transform opacity-100 scale-100"
                leave-active-class="transition ease-in duration-75"
                leave-from-class="transform opacity-100 scale-100"
                leave-to-class="transform opacity-0 scale-95"
              >
                <div
                  v-if="showSearchResults && searchQuery && searchResults.length > 0"
                  class="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-auto"
                >
                  <div class="py-2">
                    <div
                      v-for="result in searchResults"
                      :key="result.id"
                      @click="navigateToSearchResult(result)"
                      class="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div class="flex items-center gap-2">
                        <component :is="result.icon" class="w-4 h-4 text-gray-400" />
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium text-gray-900 truncate">{{ result.title }}</p>
                          <p class="text-xs text-gray-500 truncate">{{ result.subtitle }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>

          <!-- Notifications -->
          <div class="relative">
            <button
              @click="notificationsOpen = !notificationsOpen"
              class="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <BellIcon class="w-6 h-6" />
              <span
                v-if="unreadNotificationsCount > 0"
                class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
              ></span>
            </button>

            <!-- Notifications Dropdown -->
            <Transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div
                v-if="notificationsOpen"
                class="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 max-h-96 overflow-auto"
                @click.stop
              >
                <div class="px-4 py-3 border-b border-gray-100">
                  <h3 class="text-sm font-semibold text-gray-900">{{ t('common.notifications') }}</h3>
                </div>
                <div v-if="notifications.length === 0" class="px-4 py-8 text-center">
                  <BellIcon class="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p class="text-sm text-gray-500">{{ t('common.noNotifications') }}</p>
                </div>
                <div v-else class="py-1">
                  <div
                    v-for="notification in notifications"
                    :key="notification.id"
                    @click="handleNotificationClick(notification)"
                    class="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                    :class="{ 'bg-blue-50': !notification.read }"
                  >
                      <div class="flex items-start gap-3">
                      <div class="flex-shrink-0 mt-0.5">
                        <BellIcon class="w-5 h-5 text-gray-400" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900">{{ notification.title }}</p>
                        <p class="text-xs text-gray-500 mt-0.5">{{ notification.message }}</p>
                        <p class="text-xs text-gray-400 mt-1">{{ formatNotificationTime(notification.time) }}</p>
                      </div>
                      <div v-if="!notification.read" class="flex-shrink-0">
                        <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </div>

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
                  :to="authStore.userRole === 'admin' ? '/settings' : '/doctor/profile'"
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

    <!-- Click outside to close menus -->
    <div
      v-if="userMenuOpen || notificationsOpen || showSearchResults"
      class="fixed inset-0 z-40"
      @click="userMenuOpen = false; notificationsOpen = false; showSearchResults = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import { usePatientsStore } from '@/stores/patients'
import { useDoctorsStore } from '@/stores/doctors'
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
  UserGroupIcon,
  CalendarDaysIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const patientsStore = usePatientsStore()
const doctorsStore = useDoctorsStore()
const { t, locale } = useI18n()

const sidebarOpen = ref(false)
const userMenuOpen = ref(false)
const notificationsOpen = ref(false)
const searchQuery = ref('')
const showSearchResults = ref(false)
const searchResults = ref([])
const notifications = ref([])

const pageTitle = computed(() => {
  const titles = {
    '/dashboard': t('dashboard.title'),
    '/patients': authStore.userRole === 'solo' ? t('patients.soloTitle') : t('patients.allPatients'),
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
    '/dashboard': authStore.userRole === 'solo' ? t('soloDashboard.subtitle') : t('dashboard.overview'),
    '/patients': authStore.userRole === 'solo' ? t('patients.soloSubtitle') : t('patients.patientList'),
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
  const name = authStore.user?.full_name
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const email = authStore.userEmail || ''
  return email.slice(0, 2).toUpperCase() || '??'
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

// Global Search
const handleGlobalSearch = () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  const query = searchQuery.value.toLowerCase().trim()
  const results = []

  // Search patients
  if (patientsStore.items.length > 0) {
    patientsStore.items.forEach(patient => {
      if (
        patient.full_name?.toLowerCase().includes(query) ||
        patient.phone?.includes(query) ||
        patient.med_id?.toString().includes(query)
      ) {
        results.push({
          id: `patient-${patient.id}`,
          type: 'patient',
          title: patient.full_name,
          subtitle: patient.phone || patient.med_id || '',
          route: `/patients/${patient.id}`,
          icon: UserGroupIcon,
        })
      }
    })
  }

  // Search doctors
  if (doctorsStore.items.length > 0) {
    doctorsStore.items.forEach(doctor => {
      if (
        doctor.full_name?.toLowerCase().includes(query) ||
        doctor.email?.toLowerCase().includes(query) ||
        doctor.phone?.includes(query)
      ) {
        results.push({
          id: `doctor-${doctor.id}`,
          type: 'doctor',
          title: doctor.full_name,
          subtitle: doctor.specialization || doctor.email || '',
          route: '/doctors',
          icon: UserGroupIcon,
        })
      }
    })
  }

  searchResults.value = results.slice(0, 5) // Limit to 5 results
}

const navigateToSearchResult = (result) => {
  showSearchResults.value = false
  searchQuery.value = ''
  router.push(result.route)
}

// Watch search query
watch(searchQuery, (newVal) => {
  if (newVal) {
    handleGlobalSearch()
    showSearchResults.value = true
  } else {
    searchResults.value = []
    showSearchResults.value = false
  }
})

// Notifications
const unreadNotificationsCount = computed(() => {
  return notifications.value.filter(n => !n.read).length
})

const formatNotificationTime = (time) => {
  if (!time) return ''
  const now = new Date()
  const notificationTime = new Date(time)
  const diffMs = now - notificationTime
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return t('common.justNow')
  if (diffMins < 60) return `${diffMins} ${t('common.minutesAgo')}`
  if (diffHours < 24) return `${diffHours} ${t('common.hoursAgo')}`
  if (diffDays < 7) return `${diffDays} ${t('common.daysAgo')}`
  return notificationTime.toLocaleDateString('uz-UZ')
}

const handleNotificationClick = (notification) => {
  notification.read = true
  if (notification.route) {
    router.push(notification.route)
    notificationsOpen.value = false
  }
}

// Load notifications (mock data for now)
const loadNotifications = () => {
  // In real app, this would fetch from API
  // Mock notifications - you can replace this with real API call
  notifications.value = []
}

onMounted(() => {
  loadNotifications()
})

</script>
