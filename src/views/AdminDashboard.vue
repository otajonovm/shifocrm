<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Revenue + Debt -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white rounded-2xl shadow-card border border-gray-100">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-6 border-b border-gray-100">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">{{ t('adminDashboard.revenueTitle') }}</h2>
            <p class="text-sm text-gray-500">{{ t('adminDashboard.revenueSubtitle') }}</p>
          </div>
          <div class="inline-flex items-center rounded-lg bg-gray-100 p-1">
            <button
              v-for="range in revenueRanges"
              :key="range.id"
              @click="selectedRevenueRange = range.id"
              class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
              :class="selectedRevenueRange === range.id
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'"
            >
              {{ range.label }}
            </button>
          </div>
        </div>
        <div class="p-6">
          <p class="text-3xl font-bold text-gray-900">{{ formatCurrency(revenueDisplay.amount) }}</p>
          <p class="mt-2 text-sm text-gray-500">
            <span
              v-if="revenueDisplay.growth !== null"
              :class="revenueDisplay.growth >= 0 ? 'text-green-600' : 'text-red-600'"
            >
              {{ revenueDisplay.growth >= 0 ? '+' : '' }}{{ revenueDisplay.growth }}%
            </span>
            <span class="ml-1">{{ revenueDisplay.growthLabel }}</span>
          </p>
        </div>
      </div>
      <div class="bg-white rounded-2xl shadow-card border border-gray-100">
        <div class="p-6 border-b border-gray-100">
          <h2 class="text-lg font-semibold text-gray-900">{{ t('adminDashboard.debtTitle') }}</h2>
          <p class="text-sm text-gray-500">{{ t('adminDashboard.debtSubtitle') }}</p>
        </div>
        <div class="p-6">
          <p class="text-3xl font-bold text-gray-900">{{ formatCurrency(debtSummary.total) }}</p>
          <div v-if="debtSummary.topDebtors.length" class="mt-4 space-y-3">
            <div
              v-for="debtor in debtSummary.topDebtors"
              :key="debtor.id"
              class="flex items-center justify-between text-sm"
            >
              <router-link
                :to="`/patients/${debtor.id}`"
                class="text-gray-700 hover:text-primary-600 font-medium"
              >
                {{ debtor.name }}
              </router-link>
              <span class="font-semibold text-gray-900">{{ formatCurrency(debtor.amount) }}</span>
            </div>
          </div>
          <div v-else class="mt-4 text-sm text-gray-500">
            {{ t('adminDashboard.debtEmpty') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Today's Appointments Table -->
    <div class="bg-white rounded-2xl shadow-card border border-gray-100">
        <div class="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
          <h2 class="text-lg font-semibold text-gray-900">{{ t('adminDashboard.todayAppointmentsTitle') }}</h2>
          <p class="text-sm text-gray-500">{{ t('adminDashboard.todayAppointmentsSubtitle') }}</p>
          </div>
          <router-link
            to="/appointments"
            class="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {{ t('adminDashboard.viewAll') }}
          </router-link>
        </div>
        <div v-if="hasTodayAppointments" class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{{ t('adminDashboard.time') }}</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{{ t('adminDashboard.patient') }}</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{{ t('adminDashboard.doctor') }}</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{{ t('adminDashboard.status') }}</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">{{ t('adminDashboard.actions') }}</th>
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
        <div v-else class="p-12 text-center">
          <CalendarDaysIcon class="w-12 h-12 text-gray-300 mx-auto" />
          <p class="mt-4 text-gray-500">{{ t('adminDashboard.noTodayAppointments') }}</p>
        </div>
    </div>

    <!-- Quick Actions -->
    <div class="flex flex-wrap gap-3">
      <button
        @click="showNewPatientModal = true"
        class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-cyan-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all w-full sm:w-auto"
      >
        <PlusIcon class="w-5 h-5" />
        {{ t('adminDashboard.newPatient') }}
      </button>
      <button
        @click="showNewAppointmentModal = true"
        class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 hover:scale-[1.02] transition-all w-full sm:w-auto"
      >
        <CalendarDaysIcon class="w-5 h-5 text-primary-500" />
        {{ t('adminDashboard.scheduleAppointment') }}
      </button>
      <router-link
        to="/payments"
        class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 hover:scale-[1.02] transition-all w-full sm:w-auto"
      >
        <CurrencyDollarIcon class="w-5 h-5 text-primary-500" />
        {{ t('adminDashboard.recordPayment') }}
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePatientsStore } from '@/stores/patients'
import { useDoctorsStore } from '@/stores/doctors'
import { getVisitsByDate, getDebtVisits } from '@/api/visitsApi'
import { getPaymentsByDateRange } from '@/api/paymentsApi'
import { getVisitStatusLabel, getVisitStatusColors, getCompletedStatuses } from '@/constants/visitStatus'
import { getTodayISO } from '@/lib/date'
import {
  CalendarDaysIcon,
  CurrencyDollarIcon,
  PlusIcon,
  EyeIcon,
} from '@heroicons/vue/24/outline'

const showNewPatientModal = ref(false)
const showNewAppointmentModal = ref(false)
const { t } = useI18n()

const patientsStore = usePatientsStore()
const doctorsStore = useDoctorsStore()

const stats = ref({
  todayAppointments: 0,
  completedToday: 0,
  dailyRevenue: 0,
  weeklyRevenue: 0,
  weeklyGrowth: 0,
  monthlyRevenue: 0,
  monthlyGrowth: 0,
})

const todayAppointments = ref([])
const debtSummary = ref({
  total: 0,
  topDebtors: [],
})

const selectedRevenueRange = ref('day')
const revenueRanges = computed(() => ([
  { id: 'day', label: t('adminDashboard.dailyRevenue') },
  { id: 'week', label: t('adminDashboard.weeklyRevenue') },
  { id: 'month', label: t('adminDashboard.monthlyRevenue') },
]))

const revenueDisplay = computed(() => {
  if (selectedRevenueRange.value === 'week') {
    return {
      amount: stats.value.weeklyRevenue,
      growth: stats.value.weeklyGrowth,
      growthLabel: t('adminDashboard.weeklyCompared'),
    }
  }

  if (selectedRevenueRange.value === 'month') {
    return {
      amount: stats.value.monthlyRevenue,
      growth: stats.value.monthlyGrowth,
      growthLabel: t('adminDashboard.monthlyCompared'),
    }
  }

  return {
    amount: stats.value.dailyRevenue,
    growth: null,
    growthLabel: t('adminDashboard.today'),
  }
})

const hasTodayAppointments = computed(() => todayAppointments.value.length > 0)

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

  let dailyRevenue = 0
  let weeklyRevenue = 0
  let monthlyRevenue = 0
  let weeklyGrowth = 0
  let monthlyGrowth = 0
  const now = new Date()
  const { startISO: todayStartISO, endISO: todayEndISO } = getLocalDayRange(now)
  try {
    const todayPayments = await getPaymentsByDateRange(todayStartISO, todayEndISO)
    dailyRevenue = getNetIncomeFromPayments(todayPayments)
  } catch {
    dailyRevenue = visits.reduce((sum, visit) => {
      const paid = visit.paid_amount !== null && visit.paid_amount !== undefined
        ? Number(visit.paid_amount)
        : (visit.status === 'completed_paid' ? Number(visit.price || 0) : 0)
      return sum + (Number.isNaN(paid) ? 0 : paid)
    }, 0)
  }

  const weekStart = startOfWeek(now)
  const weekEnd = addDays(weekStart, 6)
  const prevWeekStart = addDays(weekStart, -7)
  const prevWeekEnd = addDays(weekEnd, -7)

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  const weekRange = getLocalRangeForDates(weekStart, weekEnd)
  const prevWeekRange = getLocalRangeForDates(prevWeekStart, prevWeekEnd)
  const monthRange = getLocalRangeForDates(monthStart, monthEnd)
  const prevMonthRange = getLocalRangeForDates(prevMonthStart, prevMonthEnd)

  let prevWeekRevenue = 0
  let prevMonthRevenue = 0
  try {
    const weekPayments = await getPaymentsByDateRange(weekRange.startISO, weekRange.endISO)
    weeklyRevenue = getNetIncomeFromPayments(weekPayments)
  } catch {
    weeklyRevenue = 0
  }

  try {
    const monthPayments = await getPaymentsByDateRange(monthRange.startISO, monthRange.endISO)
    monthlyRevenue = getNetIncomeFromPayments(monthPayments)
  } catch {
    monthlyRevenue = 0
  }

  try {
    const prevWeekPayments = await getPaymentsByDateRange(prevWeekRange.startISO, prevWeekRange.endISO)
    prevWeekRevenue = getNetIncomeFromPayments(prevWeekPayments)
  } catch {
    prevWeekRevenue = 0
  }

  try {
    const prevMonthPayments = await getPaymentsByDateRange(prevMonthRange.startISO, prevMonthRange.endISO)
    prevMonthRevenue = getNetIncomeFromPayments(prevMonthPayments)
  } catch {
    prevMonthRevenue = 0
  }

  weeklyGrowth = calculateGrowth(weeklyRevenue, prevWeekRevenue)
  monthlyGrowth = calculateGrowth(monthlyRevenue, prevMonthRevenue)

  stats.value = {
    todayAppointments: visits.length,
    completedToday: completedVisits.length,
    dailyRevenue,
    weeklyRevenue,
    weeklyGrowth,
    monthlyRevenue,
    monthlyGrowth,
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

  let debtVisits = []
  try {
    debtVisits = await getDebtVisits()
  } catch {
    debtVisits = []
  }

  const debtByPatient = new Map()
  let totalDebt = 0

  debtVisits.forEach((visit) => {
    const rawDebt = visit.debt_amount !== null && visit.debt_amount !== undefined
      ? Number(visit.debt_amount)
      : Number(visit.price || 0) - Number(visit.paid_amount || 0)
    const debt = Number.isNaN(rawDebt) ? 0 : rawDebt
    if (debt <= 0) return

    totalDebt += debt
    const patientId = Number(visit.patient_id)
    const prev = debtByPatient.get(patientId) || 0
    debtByPatient.set(patientId, prev + debt)
  })

  const topDebtors = Array.from(debtByPatient.entries())
    .map(([patientId, amount]) => {
      const patient = patientMap.get(Number(patientId))
      return {
        id: patientId,
        name: patient?.full_name || `#${patientId}`,
        amount,
      }
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)

  debtSummary.value = {
    total: totalDebt,
    topDebtors,
  }
}

onMounted(() => {
  loadDashboard()
})

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('uz-UZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0)
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

const getStatusClass = (status) => {
  const colors = getVisitStatusColors(status)
  return `${colors.bgClass} ${colors.textClass}`
}
</script>
