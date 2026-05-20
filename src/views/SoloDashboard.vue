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
          <p class="text-sm sm:text-base font-semibold">{{ t('soloDashboard.addAppointment') }}</p>
          <p class="text-xs sm:text-sm text-white/80 mt-0.5">{{ t('soloDashboard.newAppointmentHint') }}</p>
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
          <p class="text-sm sm:text-base font-semibold">{{ t('soloDashboard.addPatient') }}</p>
          <p class="text-xs sm:text-sm text-white/80 mt-0.5">{{ t('soloDashboard.newPatientHint') }}</p>
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
          <p class="text-sm sm:text-base font-semibold">{{ t('soloDashboard.addPayment') }}</p>
          <p class="text-xs sm:text-sm text-white/80 mt-0.5">{{ t('soloDashboard.newPaymentHint') }}</p>
        </div>
        <PlusIcon class="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
      </router-link>
    </div>

    <!-- Simplified stats: keep just 3 key cards for quick decision making -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      <div class="mobile-card flex items-center gap-3">
        <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <CalendarDaysIcon class="w-5 h-5 text-blue-600" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-medium text-gray-500">{{ t('soloDashboard.todayAppointmentsLabel') }}</p>
          <p class="text-base sm:text-lg font-bold text-gray-900">{{ todayAppointments.length }}</p>
        </div>
      </div>

      <div class="mobile-card flex items-center gap-3">
        <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
          <BanknotesIcon class="w-5 h-5 text-emerald-600" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-medium text-gray-500">{{ t('soloDashboard.todayRevenue') }}</p>
          <p class="text-base sm:text-lg font-bold text-gray-900 truncate">{{ formatCurrency(dailyRevenue) }}</p>
        </div>
      </div>

      <div class="mobile-card flex items-center gap-3">
        <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
          <UsersIcon class="w-5 h-5 text-primary-600" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-medium text-gray-500">{{ t('soloDashboard.newPatientsCount') }}</p>
          <p class="text-base sm:text-lg font-bold text-gray-900">{{ newPatientsCount }}</p>
        </div>
      </div>
    </div>

    <!-- 6. Eslatmalar / To-do -->
    <div class="mobile-card">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-base sm:text-lg font-semibold text-gray-900">{{ t('soloDashboard.notesTitle') }}</h2>
          <p class="text-xs sm:text-sm text-gray-500 mt-0.5">{{ t('soloDashboard.notesSubtitle') }}</p>
        </div>
        <button 
          @click="showTodoInput = true"
          class="text-xs sm:text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          {{ t('soloDashboard.addNote') }}
        </button>
      </div>

      <div class="space-y-2 sm:space-y-3 relative min-h-[100px]">
        <!-- Empty State -->
        <div v-if="todos.length === 0 && !showTodoInput && !isLoadingTodos" 
             class="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <DocumentTextIcon class="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 mb-2" />
          <p class="text-xs sm:text-sm font-medium text-gray-500">{{ t('soloDashboard.noNotes') }}</p>
          <p class="text-[10px] sm:text-xs text-gray-400 mt-0.5">{{ t('soloDashboard.addFirstNote') }}</p>
        </div>

        <!-- Todo Input -->
        <div v-if="showTodoInput" class="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 flex flex-col gap-4">
          <textarea
            v-model="newTodoText"
            rows="2"
            :placeholder="t('soloDashboard.notePlaceholder')"
            class="mobile-input resize-none"
          ></textarea>
          <div class="flex items-center gap-3">
            <select v-model="newTodoPatientId" class="mobile-input flex-1">
              <option value="">{{ t('soloDashboard.selectPatient') }}</option>
              <option v-for="patient in patientsStore.items" :key="patient.id" :value="patient.id">
                {{ patient.full_name }}
              </option>
            </select>
            <button 
              @click="addTodo"
              :disabled="!newTodoText.trim()"
              class="mobile-btn-primary px-4 py-2 text-sm disabled:opacity-50"
            >
              {{ t('soloDashboard.add') }}
            </button>
          </div>
          <button 
            @click="showTodoInput = false"
            class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {{ t('soloDashboard.cancel') }}
          </button>
        </div>

        <!-- Todo List -->
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
    </div>

    <!-- 7. Top-3 xizmatlar -->
    <div v-if="topServices.length > 0" class="mobile-card">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-base sm:text-lg font-semibold text-gray-900">{{ t('soloDashboard.topServicesTitle') }}</h2>
          <p class="text-xs sm:text-sm text-gray-500 mt-0.5">{{ t('soloDashboard.topServicesSubtitle') }}</p>
        </div>
        <router-link
          to="/services"
          class="text-xs sm:text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          {{ t('soloDashboard.viewAll') }}
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
              <h3 class="text-lg font-semibold text-gray-900">{{ t('soloDashboard.newNoteTitle') }}</h3>
              <button
                @click="showTodoModal = false"
                class="p-2 text-gray-400 hover:text-gray-600 rounded-lg touch-target"
              >
                <XMarkIcon class="w-5 h-5" />
              </button>
            </div>
            <div class="p-4 sm:p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('soloDashboard.noteTextLabel') }}</label>
                <input
                  v-model="newTodoText"
                  type="text"
                  :placeholder="t('soloDashboard.notePlaceholder')"
                  class="mobile-input"
                  @keyup.enter="addTodo"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('soloDashboard.selectPatient') }}</label>
                <select v-model="newTodoPatientId" class="mobile-input">
                  <option value="">-- {{ t('soloDashboard.selectPatient') }} --</option>
                  <option v-for="patient in patientsStore.items" :key="patient.id" :value="patient.id">
                    {{ patient.full_name }}
                  </option>
                </select>
              </div>

              <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  @click="showTodoModal = false"
                  class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors touch-target"
                >
                  {{ t('soloDashboard.cancel') }}
                </button>
                <button
                  @click="addTodo"
                  :disabled="!newTodoText.trim()"
                  class="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:hover:bg-primary-600 rounded-xl transition-colors touch-target"
                >
                  {{ t('soloDashboard.add') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePatientsStore } from '@/stores/patients'
import { useDoctorsStore } from '@/stores/doctors'
import { getVisitsByDate } from '@/api/visitsApi'
import { getPaymentsByDateRange } from '@/api/paymentsApi'
import { getTodayISO } from '@/lib/date'
import {
  PlusIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  BanknotesIcon,
  UsersIcon,
  UserPlusIcon,
  DocumentTextIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'

const patientsStore = usePatientsStore()
const doctorsStore = useDoctorsStore()
const { t } = useI18n()

const todayAppointments = ref([])
const todos = ref([])
const topServices = ref([])
const dailyRevenue = ref(0)
const newPatientsCount = ref(0)

const newTodoText = ref('')
const newTodoPatientId = ref('')
const showTodoInput = ref(false)

const formatCurrency = (amount) =>
  new Intl.NumberFormat('uz-UZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0)

const addDays = (date, days) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const getLocalDayRange = (date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
  return { startISO: start.toISOString(), endISO: end.toISOString() }
}

// Todos persisted locally (simple and fast for single-doctor workflow)
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
  const patient = newTodoPatientId.value ? patientsStore.items.find(p => Number(p.id) === Number(newTodoPatientId.value)) : null
  todos.value.unshift({ id: Date.now(), text: newTodoText.value.trim(), patientId: newTodoPatientId.value || null, patientName: patient?.full_name || null, completed: false, createdAt: new Date().toISOString() })
  saveTodos()
  newTodoText.value = ''
  newTodoPatientId.value = ''
  showTodoInput.value = false
}

const toggleTodo = (id) => {
  const t = todos.value.find(x => x.id === id)
  if (t) { t.completed = !t.completed; saveTodos() }
}

const deleteTodo = (id) => {
  todos.value = todos.value.filter(t => t.id !== id)
  saveTodos()
}

const loadDashboard = async () => {
  const today = getTodayISO()
  const now = new Date()

  // fetch patients and doctors list (lightweight)
  await Promise.all([patientsStore.fetchPatients(), doctorsStore.fetchAll()])

  // new patients in last 7 days
  const weekAgo = addDays(now, -7)
  newPatientsCount.value = patientsStore.items.filter(p => new Date(p.created_at || 0) >= weekAgo).length

  // today's visits
  let visits = []
  try { visits = await getVisitsByDate(today) } catch { visits = [] }
  todayAppointments.value = visits.map(v => ({ id: v.id, patientId: v.patient_id, patientName: v.patient_name || `#${v.patient_id}`, time: v.start_time || v.created_at }))

  // today's revenue
  try {
    const { startISO, endISO } = getLocalDayRange(now)
    const dayPay = await getPaymentsByDateRange(startISO, endISO)
    dailyRevenue.value = (dayPay || []).reduce((s, e) => s + (Number(e.amount) || 0), 0)
  } catch {
    dailyRevenue.value = 0
  }
}

onMounted(() => {
  loadTodos()
  loadDashboard()
})
</script>
