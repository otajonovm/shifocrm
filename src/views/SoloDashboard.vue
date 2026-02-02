<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Xush kelibsiz + Tezkor amallar (20 yillik UX: asosiy narsa birinchi) -->
    <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          {{ t('soloDashboard.welcome', { name: doctorName }) }}
        </h1>
        <p class="text-gray-500 mt-1">{{ t('soloDashboard.subtitle') }}</p>
      </div>
      <!-- Tezkor amallar — har kuni kerak bo'ladigan 3 ta tugma -->
      <div class="flex flex-wrap gap-3">
        <router-link
          to="/patients"
          class="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-cyan-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
        >
          <PlusIcon class="w-5 h-5" />
          {{ t('soloDashboard.quickNewPatient') }}
        </router-link>
        <router-link
          to="/appointments"
          class="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 hover:scale-[1.02] transition-all"
        >
          <CalendarDaysIcon class="w-5 h-5 text-primary-500" />
          {{ t('soloDashboard.quickAppointment') }}
        </router-link>
        <router-link
          to="/payments"
          class="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 hover:scale-[1.02] transition-all"
        >
          <CreditCardIcon class="w-5 h-5 text-emerald-500" />
          {{ t('soloDashboard.quickPayment') }}
        </router-link>
      </div>
    </div>

    <!-- Daromad + Qarzlar (qisqa, tushunarli) -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
        <p class="text-sm font-medium text-gray-500">{{ t('soloDashboard.todayRevenue') }}</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatCurrency(dailyRevenue) }}</p>
      </div>
      <div class="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
        <p class="text-sm font-medium text-gray-500">{{ t('soloDashboard.weeklyRevenue') }}</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatCurrency(weeklyRevenue) }}</p>
      </div>
      <div class="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
        <p class="text-sm font-medium text-gray-500">{{ t('soloDashboard.totalDebt') }}</p>
        <p class="text-2xl font-bold" :class="debtSummary.total > 0 ? 'text-amber-600' : 'text-gray-900'">
          {{ formatCurrency(debtSummary.total) }}
        </p>
      </div>
    </div>

    <!-- Bugungi uchrashuvlar -->
    <div class="bg-white rounded-2xl shadow-card border border-gray-100">
      <div class="flex items-center justify-between p-6 border-b border-gray-100">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">{{ t('soloDashboard.todayAppointments') }}</h2>
          <p class="text-sm text-gray-500">{{ t('adminDashboard.todayAppointmentsSubtitle') }}</p>
        </div>
        <router-link to="/appointments" class="text-sm text-primary-600 hover:text-primary-700 font-medium">
          {{ t('adminDashboard.viewAll') }}
        </router-link>
      </div>
      <div v-if="todayAppointments.length" class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{{ t('adminDashboard.time') }}</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{{ t('adminDashboard.patient') }}</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{{ t('adminDashboard.status') }}</th>
              <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">{{ t('adminDashboard.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="apt in todayAppointments" :key="apt.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ apt.time }}</td>
              <td class="px-6 py-4">
                <router-link :to="`/patients/${apt.patientId}`" class="flex items-center gap-3 text-gray-900 hover:text-primary-600">
                  <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
                    {{ apt.patientInitials }}
                  </div>
                  {{ apt.patientName }}
                </router-link>
              </td>
              <td class="px-6 py-4">
                <span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium" :class="getStatusClass(apt.status)">
                  {{ apt.statusLabel }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <router-link :to="`/patients/${apt.patientId}`" class="p-2 text-gray-400 hover:text-primary-600 rounded-lg">
                  <EyeIcon class="w-4 h-4" />
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="p-12 text-center">
        <CalendarDaysIcon class="w-12 h-12 text-gray-300 mx-auto" />
        <p class="mt-4 text-gray-500">{{ t('adminDashboard.noTodayAppointments') }}</p>
        <router-link to="/appointments" class="inline-flex items-center gap-2 mt-4 text-primary-600 hover:text-primary-700 font-medium">
          <PlusIcon class="w-4 h-4" />
          {{ t('soloDashboard.addFirst') }}
        </router-link>
      </div>
    </div>

    <!-- Qarzdor bemorlar (qisqa ro'yxat) -->
    <div v-if="debtSummary.topDebtors.length" class="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
      <h2 class="text-lg font-semibold text-gray-900">{{ t('soloDashboard.topDebtors') }}</h2>
      <div class="mt-4 space-y-3">
        <router-link
          v-for="d in debtSummary.topDebtors"
          :key="d.id"
          :to="`/patients/${d.id}`"
          class="flex items-center justify-between py-2 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
        >
          <span class="font-medium text-gray-900">{{ d.name }}</span>
          <span class="font-semibold text-amber-600">{{ formatCurrency(d.amount) }}</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
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
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const patientsStore = usePatientsStore()
const doctorsStore = useDoctorsStore()
const { t } = useI18n()

const doctorName = computed(() =>
  authStore.user?.full_name || authStore.userEmail?.split('@')[0] || 'Doktor'
)

const todayAppointments = ref([])
const debtSummary = ref({ total: 0, topDebtors: [] })
const dailyRevenue = ref(0)
const weeklyRevenue = ref(0)

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

onMounted(() => loadDashboard())
</script>
