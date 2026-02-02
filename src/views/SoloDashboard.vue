<template>
  <div class="space-y-8 animate-fade-in">
    <!-- Hero: Xush kelibsiz + vaqt + Tezkor amallar -->
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-cyan-600 px-6 py-8 text-white shadow-xl">
      <div class="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-primary-100 text-sm font-medium">{{ greetingText }}</p>
          <h1 class="mt-1 text-2xl font-bold sm:text-3xl">
            {{ t('soloDashboard.welcome', { name: doctorName }) }}
          </h1>
          <p class="mt-2 text-primary-100">{{ t('soloDashboard.subtitle') }}</p>
        </div>
        <div class="flex shrink-0 flex-col items-end text-right">
          <p class="text-sm text-primary-100">{{ todayDate }}</p>
          <p class="text-2xl font-bold tabular-nums">{{ currentTime }}</p>
        </div>
      </div>
      <!-- Tezkor amallar -->
      <div class="relative z-10 mt-6 flex flex-wrap gap-3">
        <router-link
          to="/patients"
          class="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-medium text-primary-600 shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"
        >
          <PlusIcon class="w-5 h-5" />
          {{ t('soloDashboard.quickNewPatient') }}
        </router-link>
        <router-link
          to="/appointments"
          class="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-5 py-3 font-medium text-white backdrop-blur transition-all hover:scale-[1.02] hover:bg-white/20"
        >
          <CalendarDaysIcon class="w-5 h-5" />
          {{ t('soloDashboard.quickAppointment') }}
        </router-link>
        <router-link
          to="/payments"
          class="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-5 py-3 font-medium text-white backdrop-blur transition-all hover:scale-[1.02] hover:bg-white/20"
        >
          <CreditCardIcon class="w-5 h-5" />
          {{ t('soloDashboard.quickPayment') }}
        </router-link>
      </div>
    </div>

    <!-- KPI kartalar — chiroyli, tushunarli -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div class="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
          <BanknotesIcon class="h-6 w-6 text-emerald-600" />
        </div>
        <div class="min-w-0">
          <p class="text-xs font-medium text-gray-500">{{ t('soloDashboard.todayRevenue') }}</p>
          <p class="mt-0.5 text-lg font-bold text-gray-900">{{ formatCurrency(dailyRevenue) }}</p>
        </div>
      </div>
      <div class="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100">
          <ChartBarIcon class="h-6 w-6 text-blue-600" />
        </div>
        <div class="min-w-0">
          <p class="text-xs font-medium text-gray-500">{{ t('soloDashboard.weeklyRevenue') }}</p>
          <p class="mt-0.5 text-lg font-bold text-gray-900">{{ formatCurrency(weeklyRevenue) }}</p>
        </div>
      </div>
      <div class="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" :class="debtSummary.total > 0 ? 'bg-amber-100' : 'bg-gray-100'">
          <ExclamationCircleIcon class="h-6 w-6" :class="debtSummary.total > 0 ? 'text-amber-600' : 'text-gray-500'" />
        </div>
        <div class="min-w-0">
          <p class="text-xs font-medium text-gray-500">{{ t('soloDashboard.totalDebt') }}</p>
          <p class="mt-0.5 text-lg font-bold" :class="debtSummary.total > 0 ? 'text-amber-600' : 'text-gray-900'">
            {{ formatCurrency(debtSummary.total) }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100">
          <UsersIcon class="h-6 w-6 text-primary-600" />
        </div>
        <div class="min-w-0">
          <p class="text-xs font-medium text-gray-500">{{ t('soloDashboard.totalPatients') }}</p>
          <p class="mt-0.5 text-lg font-bold text-gray-900">{{ totalPatients }}</p>
        </div>
      </div>
    </div>

    <!-- Bugungi uchrashuvlar -->
    <div class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div class="flex flex-col gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">{{ t('soloDashboard.todayAppointments') }}</h2>
          <p class="text-sm text-gray-500">{{ t('adminDashboard.todayAppointmentsSubtitle') }}</p>
        </div>
        <router-link
          to="/appointments"
          class="text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
        >
          {{ t('adminDashboard.viewAll') }} →
        </router-link>
      </div>
      <div v-if="todayAppointments.length" class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{{ t('adminDashboard.time') }}</th>
              <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{{ t('adminDashboard.patient') }}</th>
              <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{{ t('adminDashboard.status') }}</th>
              <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="apt in todayAppointments" :key="apt.id" class="transition-colors hover:bg-gray-50">
              <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ apt.time }}</td>
              <td class="px-6 py-4">
                <router-link :to="`/patients/${apt.patientId}`" class="flex items-center gap-3 text-gray-900 transition-colors hover:text-primary-600">
                  <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-600">
                    {{ apt.patientInitials }}
                  </div>
                  {{ apt.patientName }}
                </router-link>
              </td>
              <td class="px-6 py-4">
                <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium" :class="getStatusClass(apt.status)">
                  {{ apt.statusLabel }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <router-link :to="`/patients/${apt.patientId}`" class="inline-flex rounded-lg p-2 text-gray-400 transition-colors hover:bg-primary-50 hover:text-primary-600">
                  <EyeIcon class="h-4 w-4" />
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Empty state — qulay va tushunarli -->
      <div v-else class="flex flex-col items-center justify-center py-16 px-6">
        <div class="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
          <CalendarDaysIcon class="h-10 w-10 text-gray-400" />
        </div>
        <p class="mt-4 text-center text-gray-600">{{ t('adminDashboard.noTodayAppointments') }}</p>
        <p class="mt-1 text-center text-sm text-gray-500">{{ t('soloDashboard.emptyAppointmentsHint') }}</p>
        <router-link
          to="/appointments"
          class="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 font-medium text-white transition-all hover:bg-primary-700 hover:shadow-md"
        >
          <PlusIcon class="h-5 w-5" />
          {{ t('soloDashboard.addFirst') }}
        </router-link>
      </div>
    </div>

    <!-- Qarzdor bemorlar -->
    <div v-if="debtSummary.topDebtors.length" class="overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 class="text-lg font-semibold text-gray-900">{{ t('soloDashboard.topDebtors') }}</h2>
      <div class="mt-4 space-y-2">
        <router-link
          v-for="d in debtSummary.topDebtors"
          :key="d.id"
          :to="`/patients/${d.id}`"
          class="flex items-center justify-between rounded-lg py-3 px-3 transition-colors hover:bg-amber-50"
        >
          <span class="font-medium text-gray-900">{{ d.name }}</span>
          <span class="font-semibold text-amber-600">{{ formatCurrency(d.amount) }}</span>
        </router-link>
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
import { getVisitsByDate, getDebtVisits } from '@/api/visitsApi'
import { getPaymentsByDateRange } from '@/api/paymentsApi'
import { getVisitStatusLabel, getVisitStatusColors } from '@/constants/visitStatus'
import { getTodayISO } from '@/lib/date'
import {
  PlusIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  EyeIcon,
  BanknotesIcon,
  ChartBarIcon,
  ExclamationCircleIcon,
  UsersIcon,
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const patientsStore = usePatientsStore()
const doctorsStore = useDoctorsStore()
const { t } = useI18n()

const doctorName = computed(() =>
  authStore.user?.full_name || authStore.userEmail?.split('@')[0] || 'Doktor'
)

const currentTime = ref('')
const todayDate = ref('')
const greetingText = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return t('soloDashboard.greetingMorning')
  if (h < 18) return t('soloDashboard.greetingAfternoon')
  return t('soloDashboard.greetingEvening')
})

const todayAppointments = ref([])
const debtSummary = ref({ total: 0, topDebtors: [] })
const dailyRevenue = ref(0)
const weeklyRevenue = ref(0)
const totalPatients = ref(0)

const formatCurrency = (amount) =>
  new Intl.NumberFormat('uz-UZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0)

const getInitials = (name) => {
  if (!name) return '--'
  return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('')
}

const getStatusClass = (status) => {
  const c = getVisitStatusColors(status)
  return `${c.bgClass} ${c.textClass}`
}

const getLocalDayRange = (date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
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

const getNetIncome = (payments) =>
  payments.reduce((s, e) => s + (e.payment_type === 'refund' ? -(Number(e.amount) || 0) : Number(e.amount) || 0), 0)

const updateClock = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  todayDate.value = now.toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })
}

const loadDashboard = async () => {
  const today = getTodayISO()
  const now = new Date()
  const { startISO: dayStart, endISO: dayEnd } = getLocalDayRange(now)
  const weekStart = startOfWeek(now)
  const weekEnd = addDays(weekStart, 6)
  const weekRange = {
    startISO: new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()).toISOString(),
    endISO: new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate(), 23, 59, 59, 999).toISOString(),
  }

  await Promise.all([patientsStore.fetchPatients(), doctorsStore.fetchAll()])
  totalPatients.value = patientsStore.items.length
  const patientMap = new Map(patientsStore.items.map(p => [Number(p.id), p]))

  let visits = []
  try {
    visits = await getVisitsByDate(today)
  } catch {
    visits = []
  }

  todayAppointments.value = visits.map((v) => {
    const p = patientMap.get(Number(v.patient_id))
    return {
      id: v.id,
      patientId: v.patient_id,
      time: new Date(v.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      patientName: p?.full_name || `#${v.patient_id}`,
      patientInitials: getInitials(p?.full_name),
      status: v.status,
      statusLabel: getVisitStatusLabel(v.status),
    }
  })

  try {
    const dayPay = await getPaymentsByDateRange(dayStart, dayEnd)
    dailyRevenue.value = getNetIncome(dayPay)
  } catch {
    dailyRevenue.value = 0
  }
  try {
    const weekPay = await getPaymentsByDateRange(weekRange.startISO, weekRange.endISO)
    weeklyRevenue.value = getNetIncome(weekPay)
  } catch {
    weeklyRevenue.value = 0
  }

  let debtVisits = []
  try {
    debtVisits = await getDebtVisits()
  } catch {
    debtVisits = []
  }
  const byPatient = new Map()
  let total = 0
  debtVisits.forEach((v) => {
    const raw = v.debt_amount ?? (Number(v.price || 0) - Number(v.paid_amount || 0))
    const debt = Number.isNaN(Number(raw)) ? 0 : Number(raw)
    if (debt <= 0) return
    total += debt
    const pid = Number(v.patient_id)
    byPatient.set(pid, (byPatient.get(pid) || 0) + debt)
  })
  debtSummary.value = {
    total,
    topDebtors: Array.from(byPatient.entries())
      .map(([id, amount]) => ({ id, name: patientMap.get(id)?.full_name || `#${id}`, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5),
  }
}

let clockTimer
onMounted(() => {
  updateClock()
  clockTimer = setInterval(updateClock, 1000)
  loadDashboard()
})
onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
})
</script>
