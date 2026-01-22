<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Welcome Banner -->
    <div class="bg-gradient-to-r from-accent-500 to-purple-600 rounded-2xl p-6 text-white">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">{{ t('doctorDashboard.welcome', { name: doctorName }) }}</h1>
          <p class="text-purple-100 mt-1">{{ t('doctorDashboard.welcomeSubtitle') }}</p>
        </div>
        <div class="hidden sm:block">
          <p class="text-sm text-purple-200">{{ currentDate }}</p>
          <p class="text-2xl font-bold">{{ currentTime }}</p>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
      <!-- Mening Bemorlarim -->
      <div class="bg-white rounded-2xl p-6 shadow-card border border-gray-100 hover:shadow-card-hover transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm font-medium">{{ t('doctorDashboard.myPatients') }}</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats.myPatients }}</p>
            <p class="text-sm text-gray-500 mt-2">
              <span class="text-green-600">+{{ stats.newThisWeek }}</span> {{ t('doctorDashboard.thisWeek') }}
            </p>
          </div>
          <div class="p-3 bg-blue-100 rounded-xl">
            <UsersIcon class="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      <!-- Bugungi Uchrashuvlarim -->
      <div class="bg-white rounded-2xl p-6 shadow-card border border-gray-100 hover:shadow-card-hover transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm font-medium">{{ t('doctorDashboard.todayAppointments') }}</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats.todayAppointments }}</p>
            <p class="text-sm text-gray-500 mt-2">
              <span class="text-purple-600">{{ stats.remaining }}</span> {{ t('doctorDashboard.remaining') }}
            </p>
          </div>
          <div class="p-3 bg-purple-100 rounded-xl">
            <CalendarDaysIcon class="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      <!-- Yakunlangan Ko'riklar -->
      <div class="bg-white rounded-2xl p-6 shadow-card border border-gray-100 hover:shadow-card-hover transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm font-medium">{{ t('doctorDashboard.completedVisits') }}</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats.completed }}</p>
            <p class="text-sm text-gray-500 mt-2">
              {{ t('doctorDashboard.thisMonth') }}: <span class="text-green-600">{{ stats.completedThisMonth }}</span>
            </p>
          </div>
          <div class="p-3 bg-green-100 rounded-xl">
            <CheckCircleIcon class="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>
    </div>

    <!-- Today's Plans -->
    <div class="bg-white rounded-2xl shadow-card border border-gray-100">
      <div class="p-6 border-b border-gray-100">
        <h2 class="text-lg font-semibold text-gray-900">{{ t('doctorDashboard.todayPlansTitle') }}</h2>
        <p class="text-sm text-gray-500">{{ t('doctorDashboard.todayPlansSubtitle') }}</p>
      </div>
      <div class="p-6 space-y-4">
        <div v-if="todayPlans.length === 0" class="text-sm text-gray-500">
          {{ t('doctorDashboard.noPlans') }}
        </div>
        <div
          v-for="plan in todayPlans"
          :key="plan.id"
          class="flex items-center justify-between gap-4 rounded-xl border border-gray-100 p-4"
        >
          <div>
            <p class="text-sm font-semibold text-gray-900">{{ plan.title }}</p>
            <p class="text-xs text-gray-500">{{ plan.patientName }}</p>
            <p class="text-xs text-gray-400">{{ plan.notes || '-' }}</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="!plan.visit_id"
              @click="convertPlanToVisit(plan)"
              class="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-lg"
            >
              {{ t('doctorDashboard.planToVisit') }}
            </button>
            <button
              v-if="plan.status !== 'done'"
              @click="markPlanDone(plan)"
              class="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg"
            >
              {{ t('doctorDashboard.planDone') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Revenue Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
      <div class="bg-white rounded-2xl p-6 shadow-card border border-gray-100 hover:shadow-card-hover transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm font-medium">{{ t('doctorDashboard.dailyRevenue') }}</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ formatCurrency(revenue.today) }}</p>
            <p class="text-sm text-gray-500 mt-2">
              <span :class="revenue.weeklyGrowth >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ revenue.weeklyGrowth >= 0 ? '+' : '' }}{{ revenue.weeklyGrowth }}%
              </span>
              {{ t('doctorDashboard.weeklyChange') }}
            </p>
          </div>
          <div class="p-3 bg-orange-100 rounded-xl">
            <CurrencyDollarIcon class="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-6 shadow-card border border-gray-100 hover:shadow-card-hover transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm font-medium">{{ t('doctorDashboard.weeklyRevenue') }}</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ formatCurrency(revenue.weekly) }}</p>
            <p class="text-sm text-gray-500 mt-2">
              <span :class="revenue.weeklyGrowth >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ revenue.weeklyGrowth >= 0 ? '+' : '' }}{{ revenue.weeklyGrowth }}%
              </span>
              {{ t('doctorDashboard.weeklyCompared') }}
            </p>
          </div>
          <div class="p-3 bg-teal-100 rounded-xl">
            <CurrencyDollarIcon class="w-8 h-8 text-teal-600" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-6 shadow-card border border-gray-100 hover:shadow-card-hover transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm font-medium">{{ t('doctorDashboard.monthlyRevenue') }}</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ formatCurrency(revenue.monthly) }}</p>
            <p class="text-sm text-gray-500 mt-2">
              <span :class="revenue.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ revenue.monthlyGrowth >= 0 ? '+' : '' }}{{ revenue.monthlyGrowth }}%
              </span>
              {{ t('doctorDashboard.monthlyCompared') }}
            </p>
          </div>
          <div class="p-3 bg-indigo-100 rounded-xl">
            <CurrencyDollarIcon class="w-8 h-8 text-indigo-600" />
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Action -->
    <div>
      <button
        @click="startAppointment"
        class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-500 to-purple-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
      >
        <PlayIcon class="w-5 h-5" />
        {{ t('doctorDashboard.startAppointment') }}
      </button>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Today's Timeline -->
      <div class="lg:col-span-2 bg-white rounded-2xl shadow-card border border-gray-100">
        <div class="p-6 border-b border-gray-100">
        <h2 class="text-lg font-semibold text-gray-900">{{ t('doctorDashboard.todayScheduleTitle') }}</h2>
        <p class="text-sm text-gray-500">{{ t('doctorDashboard.todayScheduleSubtitle') }}</p>
        </div>
        <div class="p-6 space-y-4">
          <div
            v-for="(appointment, index) in todaySchedule"
            :key="appointment.id"
            class="relative flex gap-4"
          >
            <!-- Timeline line -->
            <div class="flex flex-col items-center">
              <div
                class="w-3 h-3 rounded-full"
                :class="getTimelineColor(appointment.status)"
              />
              <div
                v-if="index < todaySchedule.length - 1"
                class="w-0.5 h-full bg-gray-200 mt-1"
              />
            </div>
            <!-- Content -->
            <div class="flex-1 pb-4">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-900">{{ appointment.time }}</span>
                <span
                  class="text-xs px-2 py-0.5 rounded-full"
                  :class="getStatusBadge(appointment.status)"
                >
                  {{ appointment.statusLabel }}
                </span>
              </div>
              <p class="text-sm text-gray-600 mt-1">{{ appointment.patientName }}</p>
              <p class="text-xs text-gray-400">{{ appointment.reason }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { usePatientsStore } from '@/stores/patients'
import { useDoctorsStore } from '@/stores/doctors'
import { getVisitsByDate, getVisitsByDoctorAndDate, getVisitsByDoctorId } from '@/api/visitsApi'
import { getVisitStatusLabel, getVisitStatusColors, getCompletedStatuses, getActiveVisitStatuses } from '@/constants/visitStatus'
import { getTodayISO, formatDate } from '@/lib/date'
import {
  UsersIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  PlayIcon,
  EyeIcon,
} from '@heroicons/vue/24/outline'
import { getPaymentsByDoctorAndDateRange } from '@/api/paymentsApi'
import { getPlansByDoctorAndDateRange, updatePlan, updatePlanStatus } from '@/api/treatmentPlansApi'
import { createVisit } from '@/api/visitsApi'

const authStore = useAuthStore()
const patientsStore = usePatientsStore()
const doctorsStore = useDoctorsStore()
const { t } = useI18n()

const doctorName = computed(() => {
  return authStore.user?.full_name || authStore.userEmail?.split('@')[0] || 'Doktor'
})

const currentDate = ref('')
const currentTime = ref('')

const updateTime = () => {
  const now = new Date()
  currentDate.value = now.toLocaleDateString('uz-UZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  currentTime.value = now.toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

let timeInterval
onUnmounted(() => {
  clearInterval(timeInterval)
})

const stats = ref({
  myPatients: 0,
  newThisWeek: 0,
  todayAppointments: 0,
  remaining: 0,
  completed: 0,
  completedThisMonth: 0,
})

const revenue = ref({
  today: 0,
  weekly: 0,
  monthly: 0,
  weeklyGrowth: 0,
  monthlyGrowth: 0,
})

const todaySchedule = ref([])
const upcomingAppointments = ref([])
const todayPlans = ref([])

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

const getDoctorId = () => {
  if (authStore.user?.id) return authStore.user.id
  if (!authStore.userEmail) return null
  const doctor = doctorsStore.items.find(item => item.email === authStore.userEmail)
  return doctor?.id || null
}

const loadDoctorDashboard = async () => {
  const today = getTodayISO()

  await doctorsStore.fetchAll()
  const doctorId = getDoctorId()

  if (doctorId) {
    await patientsStore.fetchPatientsByDoctor(doctorId)
  } else {
    await patientsStore.fetchPatients()
  }

  let todayVisits = []
  let allVisits = []
  try {
    todayVisits = doctorId
      ? await getVisitsByDoctorAndDate(doctorId, today)
      : await getVisitsByDate(today)
  } catch {
    todayVisits = []
  }

  try {
    allVisits = doctorId
      ? await getVisitsByDoctorId(doctorId)
      : []
  } catch {
    allVisits = []
  }

  const patientMap = new Map(
    patientsStore.items.map(patient => [Number(patient.id), patient])
  )
  const completedStatuses = getCompletedStatuses()
  const activeStatuses = getActiveVisitStatuses()

  const now = new Date()
  const weekAgo = new Date()
  weekAgo.setDate(now.getDate() - 7)

  stats.value = {
    myPatients: patientsStore.items.length,
    newThisWeek: patientsStore.items.filter(patient => {
      const created = new Date(patient.created_at)
      return !Number.isNaN(created.getTime()) && created >= weekAgo
    }).length,
    todayAppointments: todayVisits.length,
    remaining: todayVisits.filter(visit => activeStatuses.includes(visit.status)).length,
    completed: todayVisits.filter(visit => completedStatuses.includes(visit.status)).length,
    completedThisMonth: allVisits.filter(visit => {
      const created = new Date(visit.created_at)
      return (
        !Number.isNaN(created.getTime()) &&
        created.getFullYear() === now.getFullYear() &&
        created.getMonth() === now.getMonth() &&
        completedStatuses.includes(visit.status)
      )
    }).length,
  }

  todaySchedule.value = todayVisits.map(visit => {
    const patient = patientMap.get(Number(visit.patient_id))
    return {
      id: visit.id,
      time: formatTime(visit.created_at),
      patientName: patient?.full_name || `#${visit.patient_id}`,
      reason: visit.service_name || visit.notes || 'Ko\'rik',
      status: visit.status,
      statusLabel: getVisitStatusLabel(visit.status),
    }
  })

  const upcoming = allVisits
    .filter(visit => {
      const visitDate = visit.date || toISODate(visit.created_at)
      return visitDate && visitDate >= today && activeStatuses.includes(visit.status)
    })
    .sort((a, b) => {
      const aDate = new Date(a.date || a.created_at)
      const bDate = new Date(b.date || b.created_at)
      return aDate - bDate
    })
    .slice(0, 5)

  upcomingAppointments.value = upcoming.map(visit => {
    const patient = patientMap.get(Number(visit.patient_id))
    return {
      id: visit.id,
      date: formatDate(visit.date || visit.created_at),
      time: formatTime(visit.created_at),
      patientName: patient?.full_name || `#${visit.patient_id}`,
      patientInitials: getInitials(patient?.full_name),
      reason: visit.service_name || visit.notes || 'Ko\'rik',
    }
  })

  await loadDoctorPlans(doctorId, today, patientMap)
  await loadDoctorRevenue(doctorId)
}

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
  loadDoctorDashboard()
})

const getTimelineColor = (status) => {
  const colors = getVisitStatusColors(status)
  return colors.bgClass || 'bg-gray-300'
}

const getStatusBadge = (status) => {
  const colors = getVisitStatusColors(status)
  return `${colors.bgClass} ${colors.textClass}`
}

const loadDoctorPlans = async (doctorId, today, patientMap) => {
  if (!doctorId) {
    todayPlans.value = []
    return
  }
  try {
    const plans = await getPlansByDoctorAndDateRange(doctorId, today, today)
    todayPlans.value = plans.map(plan => ({
      ...plan,
      patientName: patientMap.get(Number(plan.patient_id))?.full_name || `#${plan.patient_id}`
    }))
  } catch (error) {
    console.error('Failed to load doctor plans:', error)
    todayPlans.value = []
  }
}

const convertPlanToVisit = async (plan) => {
  try {
    if (plan.visit_id) {
      return
    }
    const visit = await createVisit({
      patient_id: plan.patient_id,
      doctor_id: plan.doctor_id,
      status: 'pending',
      price: plan.estimated_cost,
      service_name: plan.title,
      notes: plan.notes || 'Davolash rejasidan yaratildi',
      date: plan.planned_date,
      updated_by: plan.doctor_id ? `doctor:${plan.doctor_id}` : 'doctor'
    })
    const updated = await updatePlan(plan.id, { visit_id: visit.id })
    const idx = todayPlans.value.findIndex(item => item.id === plan.id)
    if (idx !== -1) {
      todayPlans.value[idx] = { ...todayPlans.value[idx], ...updated }
    }
  } catch (error) {
    console.error('Failed to convert plan to visit:', error)
  }
}

const markPlanDone = async (plan) => {
  try {
    const updated = await updatePlanStatus(plan.id, 'done')
    const idx = todayPlans.value.findIndex(item => item.id === plan.id)
    if (idx !== -1) {
      todayPlans.value[idx] = { ...todayPlans.value[idx], ...updated }
    }
  } catch (error) {
    console.error('Failed to update plan status:', error)
  }
}

const loadDoctorRevenue = async (doctorId) => {
  if (!doctorId) {
    revenue.value = {
      today: 0,
      weekly: 0,
      monthly: 0,
      weeklyGrowth: 0,
      monthlyGrowth: 0,
    }
    return
  }

  const now = new Date()
  const weekStart = startOfWeek(now)
  const weekEnd = addDays(weekStart, 6)
  const prevWeekStart = addDays(weekStart, -7)
  const prevWeekEnd = addDays(weekEnd, -7)

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  const todayRange = getLocalDayRange(new Date())
  const weekRange = getLocalRangeForDates(weekStart, weekEnd)
  const prevWeekRange = getLocalRangeForDates(prevWeekStart, prevWeekEnd)
  const monthRange = getLocalRangeForDates(monthStart, monthEnd)
  const prevMonthRange = getLocalRangeForDates(prevMonthStart, prevMonthEnd)

  const [todayPayments, weekPayments, monthPayments, prevWeekPayments, prevMonthPayments] = await Promise.all([
    getPaymentsByDoctorAndDateRange(doctorId, todayRange.startISO, todayRange.endISO),
    getPaymentsByDoctorAndDateRange(doctorId, weekRange.startISO, weekRange.endISO),
    getPaymentsByDoctorAndDateRange(doctorId, monthRange.startISO, monthRange.endISO),
    getPaymentsByDoctorAndDateRange(doctorId, prevWeekRange.startISO, prevWeekRange.endISO),
    getPaymentsByDoctorAndDateRange(doctorId, prevMonthRange.startISO, prevMonthRange.endISO),
  ])

  const todayRevenue = getNetIncomeFromPayments(todayPayments)
  const weeklyRevenue = getNetIncomeFromPayments(weekPayments)
  const monthlyRevenue = getNetIncomeFromPayments(monthPayments)
  const prevWeekRevenue = getNetIncomeFromPayments(prevWeekPayments)
  const prevMonthRevenue = getNetIncomeFromPayments(prevMonthPayments)

  revenue.value = {
    today: todayRevenue,
    weekly: weeklyRevenue,
    monthly: monthlyRevenue,
    weeklyGrowth: calculateGrowth(weeklyRevenue, prevWeekRevenue),
    monthlyGrowth: calculateGrowth(monthlyRevenue, prevMonthRevenue),
  }
}

const getNetIncomeFromPayments = (payments) => {
  return payments.reduce((sum, entry) => {
    const amount = Number(entry.amount) || 0
    return sum + (entry.payment_type === 'refund' ? -amount : amount)
  }, 0)
}

const calculateGrowth = (current, previous) => {
  if (!previous || previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

const getLocalDayRange = (date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
  return { startISO: start.toISOString(), endISO: end.toISOString() }
}

const getLocalRangeForDates = (startDate, endDate) => {
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999)
  return { startISO: start.toISOString(), endISO: end.toISOString() }
}

const startOfWeek = (date) => {
  const day = date.getDay()
  const diff = date.getDate() - (day === 0 ? 6 : day - 1)
  return new Date(date.getFullYear(), date.getMonth(), diff)
}

const addDays = (date, days) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('uz-UZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0)
}

const startAppointment = () => {
  // Navigate to appointment or open modal
  console.log('Starting appointment...')
}
</script>
