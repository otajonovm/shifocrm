<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      <!-- Jami Bemorlar -->
      <div class="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-blue-100 text-sm font-medium">Jami Bemorlar</p>
            <p class="text-3xl font-bold mt-1">{{ stats.totalPatients }}</p>
            <p class="text-blue-100 text-sm mt-2">
              <span class="text-green-300">+{{ stats.newPatientsToday }}</span> bugun
            </p>
          </div>
          <div class="p-3 bg-white/20 rounded-xl">
            <UsersIcon class="w-8 h-8" />
          </div>
        </div>
        <div class="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
      </div>

      <!-- Jami Doktorlar -->
      <div class="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-emerald-100 text-sm font-medium">Jami Doktorlar</p>
            <p class="text-3xl font-bold mt-1">{{ stats.totalDoctors }}</p>
            <p class="text-emerald-100 text-sm mt-2">
              <span class="text-green-300">{{ stats.activeDoctors }}</span> faol
            </p>
          </div>
          <div class="p-3 bg-white/20 rounded-xl">
            <UserGroupIcon class="w-8 h-8" />
          </div>
        </div>
        <div class="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
      </div>

      <!-- Bugungi Uchrashuvlar -->
      <div class="relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-purple-100 text-sm font-medium">Bugungi Uchrashuvlar</p>
            <p class="text-3xl font-bold mt-1">{{ stats.todayAppointments }}</p>
            <p class="text-purple-100 text-sm mt-2">
              <span class="text-green-300">{{ stats.completedToday }}</span> yakunlangan
            </p>
          </div>
          <div class="p-3 bg-white/20 rounded-xl">
            <CalendarDaysIcon class="w-8 h-8" />
          </div>
        </div>
        <div class="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
      </div>

      <!-- Kunlik Daromad -->
      <div class="relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-orange-100 text-sm font-medium">Kunlik Daromad</p>
            <p class="text-3xl font-bold mt-1">{{ formatCurrency(stats.dailyRevenue) }}</p>
            <p class="text-orange-100 text-sm mt-2">
              <span class="text-green-300">+12%</span> o'tgan haftaga nisbatan
            </p>
          </div>
          <div class="p-3 bg-white/20 rounded-xl">
            <CurrencyDollarIcon class="w-8 h-8" />
          </div>
        </div>
        <div class="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="flex flex-wrap gap-3">
      <button
        @click="showNewPatientModal = true"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-cyan-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
      >
        <PlusIcon class="w-5 h-5" />
        Yangi Bemor
      </button>
      <button
        @click="showNewAppointmentModal = true"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 hover:scale-[1.02] transition-all"
      >
        <CalendarDaysIcon class="w-5 h-5 text-primary-500" />
        Uchrashuvni Belgilash
      </button>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Today's Appointments Table -->
      <div class="lg:col-span-2 bg-white rounded-2xl shadow-card border border-gray-100">
        <div class="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Bugungi Uchrashuvlar</h2>
            <p class="text-sm text-gray-500">Joriy kun uchun rejalashtirilgan qabullar</p>
          </div>
          <router-link
            to="/appointments"
            class="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Barchasini ko'rish →
          </router-link>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vaqt</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bemor</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Doktor</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amallar</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="appointment in todayAppointments"
                :key="appointment.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4">
                  <span class="text-sm font-medium text-gray-900">{{ appointment.time }}</span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
                      {{ appointment.patientInitials }}
                    </div>
                    <span class="text-sm text-gray-900">{{ appointment.patientName }}</span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-600">{{ appointment.doctorName }}</span>
                </td>
                <td class="px-6 py-4">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getStatusClass(appointment.status)"
                  >
                    {{ appointment.statusLabel }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <button class="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                    <EyeIcon class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="todayAppointments.length === 0" class="p-12 text-center">
          <CalendarDaysIcon class="w-12 h-12 text-gray-300 mx-auto" />
          <p class="mt-4 text-gray-500">Bugun uchun uchrashuvlar yo'q</p>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="bg-white rounded-2xl shadow-card border border-gray-100">
        <div class="p-6 border-b border-gray-100">
          <h2 class="text-lg font-semibold text-gray-900">So'nggi Faoliyat</h2>
          <p class="text-sm text-gray-500">Oxirgi o'zgarishlar</p>
        </div>
        <div class="p-6 space-y-4">
          <div
            v-for="activity in recentActivities"
            :key="activity.id"
            class="flex items-start gap-3"
          >
            <div
              class="p-2 rounded-lg"
              :class="activity.iconBg"
            >
              <component :is="activity.icon" class="w-4 h-4" :class="activity.iconColor" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-900">{{ activity.title }}</p>
              <p class="text-xs text-gray-500">{{ activity.time }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePatientsStore } from '@/stores/patients'
import { useDoctorsStore } from '@/stores/doctors'
import { getVisitsByDate } from '@/api/visitsApi'
import { getVisitStatusLabel, getVisitStatusColors, getCompletedStatuses } from '@/constants/visitStatus'
import { getTodayISO, formatDateTime } from '@/lib/date'
import {
  UsersIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  PlusIcon,
  EyeIcon,
  UserPlusIcon,
  CheckCircleIcon,
} from '@heroicons/vue/24/outline'

const showNewPatientModal = ref(false)
const showNewAppointmentModal = ref(false)

const patientsStore = usePatientsStore()
const doctorsStore = useDoctorsStore()

const stats = ref({
  totalPatients: 0,
  newPatientsToday: 0,
  totalDoctors: 0,
  activeDoctors: 0,
  todayAppointments: 0,
  completedToday: 0,
  dailyRevenue: 0,
})

const todayAppointments = ref([])
const recentActivities = ref([])

const toISODate = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().split('T')[0]
}

const formatTime = (value) => {
  if (!value) return '--:--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--:--'
  return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
}

const getInitials = (name) => {
  if (!name) return '--'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('')
}

const buildRecentActivities = (visits) => {
  const activities = visits.slice(0, 3).map((visit) => {
    const hasPayment = (visit.paid_amount || 0) > 0
    const isCompleted = getCompletedStatuses().includes(visit.status)
    let title = 'Yangi tashrif'
    let icon = UserPlusIcon
    let iconBg = 'bg-blue-100'
    let iconColor = 'text-blue-600'

    if (hasPayment) {
      title = 'To\'lov qabul qilindi'
      icon = CurrencyDollarIcon
      iconBg = 'bg-orange-100'
      iconColor = 'text-orange-600'
    } else if (isCompleted) {
      title = 'Uchrashuv yakunlandi'
      icon = CheckCircleIcon
      iconBg = 'bg-green-100'
      iconColor = 'text-green-600'
    }

    return {
      id: visit.id,
      title,
      time: formatDateTime(visit.created_at || visit.date),
      icon,
      iconBg,
      iconColor,
    }
  })

  recentActivities.value = activities
}

const loadDashboard = async () => {
  const today = getTodayISO()

  await Promise.all([
    patientsStore.fetchPatients(),
    doctorsStore.fetchAll(),
  ])

  let visits = []
  try {
    visits = await getVisitsByDate(today)
  } catch {
    visits = []
  }

  const patientMap = new Map(
    patientsStore.items.map(patient => [Number(patient.id), patient])
  )
  const doctorMap = new Map(
    doctorsStore.items.map(doctor => [Number(doctor.id), doctor])
  )

  const completedStatuses = getCompletedStatuses()
  const completedVisits = visits.filter(visit => completedStatuses.includes(visit.status))

  stats.value = {
    totalPatients: patientsStore.items.length,
    newPatientsToday: patientsStore.items.filter(patient => toISODate(patient.created_at) === today).length,
    totalDoctors: doctorsStore.items.length,
    activeDoctors: doctorsStore.items.filter(doctor => doctor.is_active !== false).length,
    todayAppointments: visits.length,
    completedToday: completedVisits.length,
    dailyRevenue: visits.reduce((sum, visit) => {
      const paid = visit.paid_amount !== null && visit.paid_amount !== undefined
        ? Number(visit.paid_amount)
        : (visit.status === 'completed_paid' ? Number(visit.price || 0) : 0)
      return sum + (Number.isNaN(paid) ? 0 : paid)
    }, 0),
  }

  todayAppointments.value = visits.map((visit) => {
    const patient = patientMap.get(Number(visit.patient_id))
    const doctor = doctorMap.get(Number(visit.doctor_id))

    return {
      id: visit.id,
      time: formatTime(visit.created_at),
      patientName: patient?.full_name || `#${visit.patient_id}`,
      patientInitials: getInitials(patient?.full_name),
      doctorName: visit.doctor_name || doctor?.full_name || '-',
      status: visit.status,
      statusLabel: getVisitStatusLabel(visit.status),
    }
  })

  buildRecentActivities(visits)
}

onMounted(() => {
  loadDashboard()
})

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m'
}

const getStatusClass = (status) => {
  const colors = getVisitStatusColors(status)
  return `${colors.bgClass} ${colors.textClass}`
}
</script>
