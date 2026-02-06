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
          <!-- Search (Admin + Solo) - Mobile uchun ham -->
          <div v-if="authStore.userRole === 'admin' || authStore.userRole === 'solo'" class="relative">
            <div class="relative">
              <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                v-model="searchQuery"
                @keyup.enter="handleGlobalSearch"
                @focus="showSearchResults = true"
                :placeholder="'Bemor, uchrashuv, to\'lov qidirish...'"
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
      v-if="userMenuOpen || showSearchResults"
      class="fixed inset-0 z-40"
      @click="userMenuOpen = false; showSearchResults = false"
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
import { listVisits } from '@/api/visitsApi'
import { listPayments } from '@/api/paymentsApi'
import Sidebar from '@/components/layout/Sidebar.vue'
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  CreditCardIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const patientsStore = usePatientsStore()
const doctorsStore = useDoctorsStore()
const { t, locale } = useI18n()

const sidebarOpen = ref(false)
const userMenuOpen = ref(false)
const searchQuery = ref('')
const showSearchResults = ref(false)
const searchResults = ref([])

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

// Global Search - Kuchaytirilgan qidiruv
const handleGlobalSearch = async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  const query = searchQuery.value.toLowerCase().trim()
  const results = []
  const patientMap = new Map(patientsStore.items.map(p => [Number(p.id), p]))

  // 1. Bemorlar bo'yicha qidirish (ism/telefon)
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
          subtitle: `Bemor · ${patient.phone || patient.med_id || ''}`,
          route: `/patients/${patient.id}`,
          icon: UserGroupIcon,
        })
      }
    })
  }

  // 2. Uchrashuvlar bo'yicha qidirish
  try {
    const visits = await listVisits('order=created_at.desc&limit=100')
    visits.forEach(visit => {
      const patient = patientMap.get(Number(visit.patient_id))
      const patientName = patient?.full_name || ''
      const visitDate = visit.date || visit.created_at
      const formattedDate = visitDate ? new Date(visitDate).toLocaleDateString('uz-UZ') : ''
      
      if (
        patientName.toLowerCase().includes(query) ||
        visit.service_name?.toLowerCase().includes(query) ||
        visit.notes?.toLowerCase().includes(query) ||
        formattedDate.includes(query)
      ) {
        results.push({
          id: `visit-${visit.id}`,
          type: 'appointment',
          title: `Uchrashuv: ${patientName || `#${visit.patient_id}`}`,
          subtitle: `${formattedDate} · ${visit.service_name || visit.notes || 'Qabul'}`,
          route: `/patients/${visit.patient_id}`,
          icon: CalendarDaysIcon,
        })
      }
    })
  } catch (error) {
    console.error('Failed to search visits:', error)
  }

  // 3. To'lovlar bo'yicha qidirish
  try {
    const payments = await listPayments('order=paid_at.desc&limit=100')
    payments.forEach(payment => {
      const patient = patientMap.get(Number(payment.patient_id))
      const patientName = patient?.full_name || ''
      const paymentDate = payment.paid_at
      const formattedDate = paymentDate ? new Date(paymentDate).toLocaleDateString('uz-UZ') : ''
      const amount = payment.amount ? new Intl.NumberFormat('uz-UZ').format(payment.amount) : '0'
      
      if (
        patientName.toLowerCase().includes(query) ||
        formattedDate.includes(query) ||
        amount.includes(query) ||
        payment.note?.toLowerCase().includes(query)
      ) {
        results.push({
          id: `payment-${payment.id}`,
          type: 'payment',
          title: `To'lov: ${patientName || `#${payment.patient_id}`}`,
          subtitle: `${formattedDate} · ${amount} so'm`,
          route: `/patients/${payment.patient_id}`,
          icon: CreditCardIcon,
        })
      }
    })
  } catch (error) {
    console.error('Failed to search payments:', error)
  }

  // 4. Doktorlar bo'yicha qidirish
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
          subtitle: `Doktor · ${doctor.specialization || doctor.email || ''}`,
          route: '/doctors',
          icon: UserGroupIcon,
        })
      }
    })
  }

  // Sort: bemorlar birinchi, keyin uchrashuvlar, to'lovlar, doktorlar
  const sortedResults = results.sort((a, b) => {
    const order = { patient: 1, appointment: 2, payment: 3, doctor: 4 }
    return (order[a.type] || 99) - (order[b.type] || 99)
  })

  searchResults.value = sortedResults.slice(0, 10) // 10 ta natija
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


</script>
