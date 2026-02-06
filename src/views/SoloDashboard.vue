<template>
  <div class="space-y-4 sm:space-y-6 animate-fade-in pb-6 pb-safe">
    <!-- 1. Tezkor tugmalar - Eng yuqorida, katta va aniq -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      <router-link
        to="/appointments?action=add"
        class="mobile-card flex items-center gap-4 p-4 sm:p-5 bg-gradient-to-br from-primary-500 to-primary-600 text-white transition-all active:scale-[0.98] touch-manipulation"
      >
        <div class="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <CalendarDaysIcon class="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm sm:text-base font-semibold">Qabul qo'shish</p>
          <p class="text-xs sm:text-sm text-white/80 mt-0.5">Yangi uchrashuv</p>
        </div>
        <PlusIcon class="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
      </router-link>
      
      <router-link
        to="/patients?action=add"
        class="mobile-card flex items-center gap-4 p-4 sm:p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white transition-all active:scale-[0.98] touch-manipulation"
      >
        <div class="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <UserPlusIcon class="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm sm:text-base font-semibold">Bemor qo'shish</p>
          <p class="text-xs sm:text-sm text-white/80 mt-0.5">Yangi bemor</p>
        </div>
        <PlusIcon class="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
      </router-link>
      
      <router-link
        to="/payments?action=add"
        class="mobile-card flex items-center gap-4 p-4 sm:p-5 bg-gradient-to-br from-amber-500 to-amber-600 text-white transition-all active:scale-[0.98] touch-manipulation"
      >
        <div class="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <CreditCardIcon class="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm sm:text-base font-semibold">To'lov kiritish</p>
          <p class="text-xs sm:text-sm text-white/80 mt-0.5">Yangi to'lov</p>
        </div>
        <PlusIcon class="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
      </router-link>
    </div>

    <!-- 2. Bugungi vazifalar - Action Panel -->
    <div class="mobile-card">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-base sm:text-lg font-semibold text-gray-900">Bugungi vazifalar</h2>
          <p class="text-xs sm:text-sm text-gray-500 mt-0.5">5 soniyada ko‘rinadigan holat</p>
        </div>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div class="rounded-2xl border border-gray-100 bg-white p-4 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <CalendarDaysIcon class="w-5 h-5 text-blue-600" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{{ todayAppointments.length }}</p>
            <p class="text-xs sm:text-sm text-gray-500 mt-0.5">Bugungi qabullar</p>
          </div>
        </div>

        <div class="rounded-2xl border border-gray-100 bg-white p-4 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <ExclamationCircleIcon class="w-5 h-5 text-amber-600" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{{ unconfirmedCount }}</p>
            <p class="text-xs sm:text-sm text-gray-500 mt-0.5">Tasdiqlanmagan</p>
          </div>
        </div>

        <div class="rounded-2xl border border-gray-100 bg-white p-4 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
            <ClockIcon class="w-5 h-5 text-purple-600" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{{ pendingCount }}</p>
            <p class="text-xs sm:text-sm text-gray-500 mt-0.5">Kutilayotgan</p>
          </div>
        </div>

        <div class="rounded-2xl border border-gray-100 bg-white p-4 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
            <ClipboardDocumentListIcon class="w-5 h-5 text-rose-600" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{{ incompleteTreatments }}</p>
            <p class="text-xs sm:text-sm text-gray-500 mt-0.5">Yakunlanmagan</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. Mini statistika kartalari (4 ta) -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div class="mobile-card flex items-center gap-3 sm:gap-4">
        <div class="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
          <BanknotesIcon class="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-medium text-gray-500">Bugungi daromad</p>
          <p class="text-base sm:text-lg font-bold text-gray-900 truncate">{{ formatCurrency(dailyRevenue) }}</p>
        </div>
      </div>
      
      <div class="mobile-card flex items-center gap-3 sm:gap-4">
        <div class="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 flex items-center justify-center">
          <CalendarDaysIcon class="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-medium text-gray-500">Bugungi qabullar</p>
          <p class="text-base sm:text-lg font-bold text-gray-900">{{ todayAppointments.length }}</p>
        </div>
      </div>
      
      <div class="mobile-card flex items-center gap-3 sm:gap-4">
        <div class="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
          <ChartBarIcon class="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-medium text-gray-500">Haftalik daromad</p>
          <p class="text-base sm:text-lg font-bold text-gray-900 truncate">{{ formatCurrency(weeklyRevenue) }}</p>
        </div>
      </div>
      
      <div class="mobile-card flex items-center gap-3 sm:gap-4">
        <div class="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary-100 flex items-center justify-center">
          <UsersIcon class="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-medium text-gray-500">Yangi bemorlar</p>
          <p class="text-base sm:text-lg font-bold text-gray-900">{{ newPatientsCount }}</p>
        </div>
      </div>
    </div>

    <!-- 5. Bugun kelgan bemorlar -->
    <div v-if="todayVisitedPatients.length > 0" class="mobile-card">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-base sm:text-lg font-semibold text-gray-900">Bugun kelgan bemorlar</h2>
          <p class="text-xs sm:text-sm text-gray-500 mt-0.5">Bugungi tashriflar</p>
        </div>
        <router-link
          to="/patients"
          class="text-xs sm:text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          Barchasi →
        </router-link>
      </div>
      <div class="space-y-2">
        <div
          v-for="patient in todayVisitedPatients.slice(0, 5)"
          :key="patient.id"
          @click="$router.push(`/patients/${patient.id}`)"
          class="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors touch-manipulation"
        >
          <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
            {{ getInitials(patient.full_name) }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ patient.full_name }}</p>
            <p class="text-xs text-gray-500">{{ patient.phone }}</p>
          </div>
          <span class="mobile-badge text-xs" :class="getStatusClass(patient.lastStatus)">
            {{ patient.lastStatusLabel }}
          </span>
        </div>
      </div>
    </div>

    <!-- 6. Eslatmalar / To-do -->
    <div class="mobile-card">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-base sm:text-lg font-semibold text-gray-900">Eslatmalar</h2>
          <p class="text-xs sm:text-sm text-gray-500 mt-0.5">Bugun bajariladigan ishlar</p>
        </div>
        <button
          @click="showTodoModal = true"
          class="text-xs sm:text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors touch-target"
        >
          + Qo'shish
        </button>
      </div>
      <div v-if="todos.length === 0" class="text-center py-8">
        <ClipboardDocumentListIcon class="w-12 h-12 text-gray-300 mx-auto mb-2" />
        <p class="text-sm text-gray-500">Eslatmalar yo'q</p>
        <button
          @click="showTodoModal = true"
          class="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Birinchi eslatmani qo'shing
        </button>
      </div>
      <div v-else class="space-y-2">
        <div
          v-for="todo in todos.slice(0, 5)"
          :key="todo.id"
          class="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
        >
          <input
            type="checkbox"
            :checked="todo.completed"
            @change="toggleTodo(todo.id)"
            class="mt-0.5 w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 touch-target"
          />
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-900" :class="{ 'line-through text-gray-400': todo.completed }">
              {{ todo.text }}
            </p>
            <p v-if="todo.patientName" class="text-xs text-gray-500 mt-0.5">
              {{ todo.patientName }}
            </p>
          </div>
          <button
            @click="deleteTodo(todo.id)"
            class="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors touch-target"
          >
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- 7. Top-3 xizmatlar -->
    <div v-if="topServices.length > 0" class="mobile-card">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-base sm:text-lg font-semibold text-gray-900">Eng ko'p bajarilgan xizmatlar</h2>
          <p class="text-xs sm:text-sm text-gray-500 mt-0.5">Bugun / Haftada</p>
        </div>
        <router-link
          to="/services"
          class="text-xs sm:text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          Barchasi →
        </router-link>
      </div>
      <div class="space-y-2">
        <div
          v-for="(service, index) in topServices.slice(0, 3)"
          :key="service.service_name"
          class="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50"
        >
          <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm">
            {{ index + 1 }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ service.service_name || 'Noma\'lum' }}</p>
            <p class="text-xs text-gray-500">{{ formatCurrency(service.total_revenue) }} · {{ service.count }} marta</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Todo Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showTodoModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          @click.self="showTodoModal = false"
        >
          <div class="w-full max-w-md bg-white rounded-2xl border border-gray-100">
            <div class="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
              <h3 class="text-lg font-semibold text-gray-900">Yangi eslatma</h3>
              <button
                @click="showTodoModal = false"
                class="p-2 text-gray-400 hover:text-gray-600 rounded-lg touch-target"
              >
                <XMarkIcon class="w-5 h-5" />
              </button>
            </div>
            <div class="p-4 sm:p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Eslatma matni</label>
                <input
                  v-model="newTodoText"
                  type="text"
                  placeholder="Masalan: Anvar aka protez uchun qayta chaqirish"
                  class="mobile-input"
                  @keyup.enter="addTodo"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Bemor (ixtiyoriy)</label>
                <select v-model="newTodoPatientId" class="mobile-input">
                  <option value="">Tanlash</option>
                  <option v-for="patient in patientsStore.items" :key="patient.id" :value="patient.id">
                    {{ patient.full_name }}
                  </option>
                </select>
              </div>
            </div>
            <div class="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-100">
              <button
                @click="showTodoModal = false"
                class="mobile-btn-secondary px-4 py-2 text-sm"
              >
                Bekor qilish
              </button>
              <button
                @click="addTodo"
                :disabled="!newTodoText.trim()"
                class="mobile-btn-primary px-4 py-2 text-sm disabled:opacity-50"
              >
                Qo'shish
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { usePatientsStore } from '@/stores/patients'
import { useDoctorsStore } from '@/stores/doctors'
import { getVisitsByDate, getDebtVisits, getVisitsByDateRange } from '@/api/visitsApi'
import { getPaymentsByDateRange } from '@/api/paymentsApi'
import { getPlansByDoctorAndDateRange } from '@/api/treatmentPlansApi'
import { getTopServices } from '@/api/servicesApi'
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
  UserPlusIcon,
  ClipboardDocumentListIcon,
  TrashIcon,
  XMarkIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const patientsStore = usePatientsStore()
const doctorsStore = useDoctorsStore()
const { t } = useI18n()

const doctorName = computed(() =>
  authStore.user?.full_name || authStore.userEmail?.split('@')[0] || 'Doktor'
)

const greetingText = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return t('soloDashboard.greetingMorning')
  if (h < 18) return t('soloDashboard.greetingAfternoon')
  return t('soloDashboard.greetingEvening')
})

const todayAppointments = ref([])
const todayVisitedPatients = ref([])
const todos = ref([])
const topServices = ref([])
const debtSummary = ref({ total: 0, topDebtors: [] })
const dailyRevenue = ref(0)
const weeklyRevenue = ref(0)
const totalPatients = ref(0)
const newPatientsCount = ref(0)
const incompleteTreatments = ref(0)
const showTodoModal = ref(false)
const newTodoText = ref('')
const newTodoPatientId = ref('')

const pendingCount = computed(() => {
  return todayAppointments.value.filter(apt => apt.status === 'pending').length
})

const unconfirmedCount = computed(() => {
  return todayAppointments.value.filter(apt => 
    apt.status === 'pending' || apt.status === 'arrived'
  ).length
})

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

const toISODate = (date) => {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
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

// Todo funksiyalari
const loadTodos = () => {
  const saved = localStorage.getItem('solo_dashboard_todos')
  if (saved) {
    try {
      todos.value = JSON.parse(saved)
    } catch {
      todos.value = []
    }
  }
}

const saveTodos = () => {
  localStorage.setItem('solo_dashboard_todos', JSON.stringify(todos.value))
}

const addTodo = () => {
  if (!newTodoText.value.trim()) return
  
  const patient = newTodoPatientId.value 
    ? patientsStore.items.find(p => Number(p.id) === Number(newTodoPatientId.value))
    : null
  
  todos.value.unshift({
    id: Date.now(),
    text: newTodoText.value.trim(),
    patientId: newTodoPatientId.value || null,
    patientName: patient?.full_name || null,
    completed: false,
    createdAt: new Date().toISOString()
  })
  
  saveTodos()
  newTodoText.value = ''
  newTodoPatientId.value = ''
  showTodoModal.value = false
}

const toggleTodo = (id) => {
  const todo = todos.value.find(t => t.id === id)
  if (todo) {
    todo.completed = !todo.completed
    saveTodos()
  }
}

const deleteTodo = (id) => {
  todos.value = todos.value.filter(t => t.id !== id)
  saveTodos()
}

const loadDashboard = async () => {
  const today = getTodayISO()
  const now = new Date()
  const doctorId = authStore.user?.id
  
  const { startISO: dayStart, endISO: dayEnd } = getLocalDayRange(now)
  const weekStart = startOfWeek(now)
  const weekEnd = addDays(weekStart, 6)
  const weekRange = {
    startISO: new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()).toISOString(),
    endISO: new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate(), 23, 59, 59, 999).toISOString(),
  }

  // Hafta va oy boshlanishi
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const weekAgo = addDays(now, -7)
  const monthAgo = addDays(now, -30)

  await Promise.all([patientsStore.fetchPatients(), doctorsStore.fetchAll()])
  totalPatients.value = patientsStore.items.length
  const patientMap = new Map(patientsStore.items.map(p => [Number(p.id), p]))

  // Yangi bemorlar (hafta/oy)
  newPatientsCount.value = patientsStore.items.filter(p => {
    const created = new Date(p.created_at || 0)
    return created >= weekAgo
  }).length

  // Bugungi tashriflar
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
      time: v.start_time || new Date(v.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      patientName: p?.full_name || `#${v.patient_id}`,
      patientInitials: getInitials(p?.full_name),
      serviceName: v.service_name,
      reason: v.notes,
      status: v.status,
      statusLabel: getVisitStatusLabel(v.status),
    }
  })

  // Bugun kelgan bemorlar (unique)
  const todayPatientIds = new Set(visits.map(v => Number(v.patient_id)))
  todayVisitedPatients.value = Array.from(todayPatientIds).map(pid => {
    const patient = patientMap.get(pid)
    const patientVisits = visits.filter(v => Number(v.patient_id) === pid)
    const lastVisit = patientVisits[0] // Eng oxirgisi
    return {
      id: pid,
      full_name: patient?.full_name || `#${pid}`,
      phone: patient?.phone || '',
      lastStatus: lastVisit?.status || 'pending',
      lastStatusLabel: lastVisit ? getVisitStatusLabel(lastVisit.status) : 'Kutilmoqda'
    }
  })

  // Daromadlar
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

  // Yakunlanmagan davolashlar
  if (doctorId) {
    try {
      const plans = await getPlansByDoctorAndDateRange(doctorId, today, addDays(now, 30).toISOString().split('T')[0])
      incompleteTreatments.value = plans.filter(p => 
        p.status === 'planned' || p.status === 'postponed'
      ).length
    } catch {
      incompleteTreatments.value = 0
    }
  }

  // Top xizmatlar
  try {
    const services = await getTopServices()
    // Bugungi va haftalik xizmatlarni hisoblash
    const todayServices = visits
      .filter(v => v.service_name)
      .reduce((acc, v) => {
        const name = v.service_name
        if (!acc[name]) acc[name] = { service_name: name, count: 0, total_revenue: 0 }
        acc[name].count++
        acc[name].total_revenue += Number(v.price || 0)
        return acc
      }, {})
    
    const weekVisits = await getVisitsByDateRange(
      weekRange.startISO.split('T')[0],
      weekRange.endISO.split('T')[0]
    )
    const weekServices = weekVisits
      .filter(v => v.service_name)
      .reduce((acc, v) => {
        const name = v.service_name
        if (!acc[name]) acc[name] = { service_name: name, count: 0, total_revenue: 0 }
        acc[name].count++
        acc[name].total_revenue += Number(v.price || 0)
        return acc
      }, {})
    
    // Birlashtirish va sort qilish
    const combined = {}
    Object.keys(todayServices).forEach(name => {
      combined[name] = { ...todayServices[name] }
    })
    Object.keys(weekServices).forEach(name => {
      if (combined[name]) {
        combined[name].count += weekServices[name].count
        combined[name].total_revenue += weekServices[name].total_revenue
      } else {
        combined[name] = { ...weekServices[name] }
      }
    })
    
    topServices.value = Object.values(combined)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
  } catch (error) {
    console.error('Failed to load top services:', error)
    topServices.value = []
  }

  // Qarzdorlar
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

onMounted(() => {
  loadTodos()
  loadDashboard()
})
</script>
