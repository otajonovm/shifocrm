<template>
  <MainLayout>
    <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Uchrashuvlar</h1>
          <p class="text-gray-500">Qabullar jadvali va boshqaruvi</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="exportAppointments"
            class="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowDownTrayIcon class="w-5 h-5" />
            Export
          </button>
          <label
            v-if="isAdmin"
            class="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <ArrowUpTrayIcon class="w-5 h-5" />
            Import
            <input type="file" accept=".csv" class="hidden" @change="importAppointments" />
          </label>
          <button
            v-if="isAdmin"
            @click="openCreateModal"
            class="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-cyan-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <PlusIcon class="w-5 h-5" />
            Yangi Uchrashuv
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-2xl shadow-card border border-gray-100 p-4 space-y-4">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div class="flex items-center gap-2">
            <button
              @click="setToday"
              class="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              Bugun
            </button>
            <button
              @click="shiftRange(-1)"
              class="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              ←
            </button>
            <button
              @click="shiftRange(1)"
              class="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              →
            </button>
            <input
              v-model="selectedDate"
              type="date"
              class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <span class="text-sm text-gray-500">{{ dateRangeLabel }}</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-for="mode in viewModes"
              :key="mode.value"
              @click="viewMode = mode.value"
              class="px-3 py-2 text-sm font-medium rounded-lg border"
              :class="viewMode === mode.value ? 'bg-primary-50 border-primary-200 text-primary-700' : 'border-gray-200 hover:bg-gray-50'"
            >
              {{ mode.label }}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-6 gap-3">
          <div class="lg:col-span-2 relative">
            <MagnifyingGlassIcon class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Bemor ismi, telefon, MED ID..."
              class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <select
            v-if="isAdmin"
            v-model="selectedDoctor"
            class="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Barcha doktorlar</option>
            <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.id">
              {{ doctor.full_name }}
            </option>
          </select>
          <select
            v-model="selectedStatus"
            class="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Barcha statuslar</option>
            <option v-for="status in statusOptions" :key="status.value" :value="status.value">
              {{ status.label }}
            </option>
          </select>
          <input
            v-model="selectedService"
            type="text"
            placeholder="Xizmat nomi..."
            class="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <select
            v-model="selectedPayment"
            class="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">To'lov holati</option>
            <option value="paid">To'langan</option>
            <option value="partial">Qisman</option>
            <option value="unpaid">To'lanmagan</option>
            <option value="debt">Qarzdor</option>
          </select>
        </div>
      </div>

      <!-- Bulk Actions -->
      <div v-if="selectedIds.length > 0" class="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
        <span class="text-sm font-medium text-amber-800">
          {{ selectedIds.length }} ta tanlandi
        </span>
        <button
          @click="bulkUpdateStatus('cancelled')"
          class="px-3 py-1.5 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700"
        >
          Bekor qilish
        </button>
        <button
          @click="bulkUpdateStatus('no_show')"
          class="px-3 py-1.5 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700"
        >
          Kelmagan
        </button>
        <div v-if="isAdmin" class="flex items-center gap-2">
          <select
            v-model="bulkDoctorId"
            class="px-3 py-1.5 text-sm border border-amber-200 rounded-lg bg-white"
          >
            <option value="">Doktor tanlang</option>
            <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.id">
              {{ doctor.full_name }}
            </option>
          </select>
          <button
            @click="bulkChangeDoctor"
            class="px-3 py-1.5 text-sm font-medium text-amber-900 bg-amber-200 rounded-lg hover:bg-amber-300"
          >
            Doktor almashtirish
          </button>
        </div>
        <button
          @click="openRescheduleModal"
          class="px-3 py-1.5 text-sm font-medium text-amber-900 bg-amber-200 rounded-lg hover:bg-amber-300"
        >
          Ko'chirish
        </button>
        <button
          @click="clearSelected"
          class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-amber-200 rounded-lg"
        >
          Bekor
        </button>
      </div>

      <!-- Appointments Table -->
      <div class="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Uchrashuvlar ro'yxati</h2>
            <p class="text-sm text-gray-500">
              {{ filteredVisits.length }} ta uchrashuv
            </p>
          </div>
          <div class="text-sm text-gray-500">
            {{ dateRangeLabel }}
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-100 text-sm">
            <thead class="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th class="px-4 py-3">
                  <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" />
                </th>
                <th class="px-4 py-3">Sana</th>
                <th class="px-4 py-3">Vaqt</th>
                <th class="px-4 py-3">Bemor</th>
                <th class="px-4 py-3">Doktor</th>
                <th class="px-4 py-3">Xizmat</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3">To'lov</th>
                <th class="px-4 py-3">Xona/Kanal</th>
                <th class="px-4 py-3">Izoh</th>
                <th class="px-4 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-if="loading">
                <td class="px-6 py-4 text-gray-500" colspan="11">Yuklanmoqda...</td>
              </tr>
              <tr v-else-if="filteredVisits.length === 0">
                <td class="px-6 py-4 text-gray-500" colspan="11">Uchrashuvlar topilmadi.</td>
              </tr>
              <tr v-for="visit in filteredVisits" :key="visit.id" class="hover:bg-gray-50">
                <td class="px-4 py-3">
                  <input type="checkbox" :checked="selectedIds.includes(visit.id)" @change="toggleSelect(visit.id)" />
                </td>
                <td class="px-4 py-3 text-gray-700">{{ formatDate(visit.date) }}</td>
                <td class="px-4 py-3 text-gray-700">{{ formatTimeRange(visit) }}</td>
                <td class="px-4 py-3 text-gray-700">
                  <div class="font-medium">{{ getPatientName(visit.patient_id) }}</div>
                  <div class="text-xs text-gray-400">{{ getPatientPhone(visit.patient_id) }}</div>
                </td>
                <td class="px-4 py-3 text-gray-700">{{ visit.doctor_name || getDoctorName(visit.doctor_id) }}</td>
                <td class="px-4 py-3 text-gray-700">
                  <div>{{ visit.service_name || '-' }}</div>
                  <div class="text-xs text-gray-400">{{ formatCurrency(visit.price || 0) }}</div>
                </td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :class="getStatusClass(visit.status)">
                    {{ getStatusLabel(visit.status) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-gray-700">
                  <div>{{ getPaymentLabel(visit) }}</div>
                  <div class="text-xs text-gray-400">{{ formatCurrency(visit.paid_amount || 0) }}</div>
                </td>
                <td class="px-4 py-3 text-gray-700">
                  <div>{{ visit.room || '-' }}</div>
                  <div class="text-xs text-gray-400">{{ visit.channel || '-' }}</div>
                </td>
                <td class="px-4 py-3 text-gray-600 line-clamp-2 max-w-xs">{{ visit.notes || '-' }}</td>
                <td class="px-4 py-3 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      v-if="visit.status === 'pending'"
                      @click="updateStatus(visit, 'arrived')"
                      class="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded"
                    >
                      Keldi
                    </button>
                    <button
                      v-if="visit.status === 'arrived'"
                      @click="updateStatus(visit, 'in_progress')"
                      class="px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-50 rounded"
                    >
                      Boshlandi
                    </button>
                    <button
                      v-if="visit.status === 'in_progress'"
                      @click="openCompleteModal(visit)"
                      class="px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded"
                    >
                      Yakunlash
                    </button>
                    <button
                      v-if="visit.status !== 'cancelled'"
                      @click="updateStatus(visit, 'cancelled')"
                      class="px-2 py-1 text-xs font-medium text-rose-700 bg-rose-50 rounded"
                    >
                      Bekor
                    </button>
                    <button
                      v-if="visit.status === 'pending' || visit.status === 'arrived'"
                      @click="updateStatus(visit, 'no_show')"
                      class="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded"
                    >
                      Kelmagan
                    </button>
                    <button
                      @click="openRescheduleModal(visit)"
                      class="px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 rounded"
                    >
                      Ko'chirish
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create Appointment Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div class="w-full max-w-2xl bg-white rounded-2xl shadow-xl">
            <div class="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 class="text-lg font-semibold text-gray-900">Yangi uchrashuv</h3>
              <button @click="closeCreateModal" class="text-gray-400 hover:text-gray-600">
                <XMarkIcon class="w-6 h-6" />
              </button>
            </div>
            <div class="p-6 space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Bemor</label>
                  <select v-model="createForm.patient_id" class="w-full px-3 py-2 border rounded-lg">
                    <option value="">Tanlang...</option>
                    <option v-for="patient in patients" :key="patient.id" :value="patient.id">
                      {{ patient.full_name }} ({{ patient.phone }})
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Doktor</label>
                  <select v-model="createForm.doctor_id" class="w-full px-3 py-2 border rounded-lg">
                    <option value="">Tanlang...</option>
                    <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.id">
                      {{ doctor.full_name }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Sana</label>
                  <input v-model="createForm.date" type="date" class="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Boshlanish vaqti</label>
                  <input v-model="createForm.start_time" type="time" class="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Davomiyligi (min)</label>
                  <input v-model.number="createForm.duration_minutes" type="number" min="10" step="5" class="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Xizmat</label>
                  <input v-model="createForm.service_name" type="text" class="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Narx</label>
                  <input v-model.number="createForm.price" type="number" min="0" step="1000" class="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Xona</label>
                  <input v-model="createForm.room" type="text" class="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Kanal</label>
                  <input v-model="createForm.channel" type="text" class="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Izoh</label>
                <textarea v-model="createForm.notes" rows="3" class="w-full px-3 py-2 border rounded-lg"></textarea>
              </div>
              <div v-if="createError" class="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2">
                {{ createError }}
              </div>
            </div>
            <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button @click="closeCreateModal" class="px-4 py-2 text-sm border rounded-lg">Bekor</button>
              <button @click="createAppointment" class="px-4 py-2 text-sm text-white bg-primary-600 rounded-lg">
                Saqlash
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Reschedule Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showRescheduleModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div class="w-full max-w-lg bg-white rounded-2xl shadow-xl">
            <div class="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 class="text-lg font-semibold text-gray-900">Uchrashuvni ko'chirish</h3>
              <button @click="closeRescheduleModal" class="text-gray-400 hover:text-gray-600">
                <XMarkIcon class="w-6 h-6" />
              </button>
            </div>
            <div class="p-6 space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Sana</label>
                  <input v-model="rescheduleForm.date" type="date" class="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Boshlanish vaqti</label>
                  <input v-model="rescheduleForm.start_time" type="time" class="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Davomiyligi (min)</label>
                  <input v-model.number="rescheduleForm.duration_minutes" type="number" min="10" step="5" class="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Xona</label>
                  <input v-model="rescheduleForm.room" type="text" class="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Kanal</label>
                <input v-model="rescheduleForm.channel" type="text" class="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Sabab</label>
                <textarea v-model="rescheduleForm.reason" rows="2" class="w-full px-3 py-2 border rounded-lg"></textarea>
              </div>
              <div v-if="rescheduleError" class="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2">
                {{ rescheduleError }}
              </div>
            </div>
            <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button @click="closeRescheduleModal" class="px-4 py-2 text-sm border rounded-lg">Bekor</button>
              <button @click="applyReschedule" class="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg">
                Saqlash
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Complete Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showCompleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div class="w-full max-w-lg bg-white rounded-2xl shadow-xl">
            <div class="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 class="text-lg font-semibold text-gray-900">Uchrashuvni yakunlash</h3>
              <button @click="closeCompleteModal" class="text-gray-400 hover:text-gray-600">
                <XMarkIcon class="w-6 h-6" />
              </button>
            </div>
            <div class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Xizmat narxi (so'm)</label>
                <input v-model.number="completeForm.price" type="number" min="0" step="1000" class="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">To'langan summa (so'm)</label>
                <input v-model.number="completeForm.paid_amount" type="number" min="0" step="1000" class="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div class="text-sm text-gray-600">
                Qarzdorlik: <span class="font-semibold">{{ formatCurrency(Math.max(0, (completeForm.price || 0) - (completeForm.paid_amount || 0))) }}</span>
              </div>
              <div v-if="completeError" class="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2">
                {{ completeError }}
              </div>
            </div>
            <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button @click="closeCompleteModal" class="px-4 py-2 text-sm border rounded-lg">Bekor</button>
              <button @click="completeVisit" class="px-4 py-2 text-sm text-white bg-emerald-600 rounded-lg">
                Yakunlash
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </MainLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useDoctorsStore } from '@/stores/doctors'
import { usePatientsStore } from '@/stores/patients'
import { useToast } from '@/composables/useToast'
import * as visitsApi from '@/api/visitsApi'
import { createPayment, getPaymentsByVisitId } from '@/api/paymentsApi'
import { getVisitStatusLabel, getVisitStatusColors } from '@/constants/visitStatus'
import MainLayout from '@/layouts/MainLayout.vue'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const doctorsStore = useDoctorsStore()
const patientsStore = usePatientsStore()
const toast = useToast()

const isAdmin = computed(() => authStore.userRole === 'admin')
const doctorId = computed(() => authStore.user?.id || null)

const loading = ref(false)
const visits = ref([])

const viewModes = [
  { label: 'Kun', value: 'day' },
  { label: 'Hafta', value: 'week' },
  { label: 'Oy', value: 'month' }
]
const viewMode = ref('day')
const selectedDate = ref(new Date().toISOString().split('T')[0])

const searchQuery = ref('')
const selectedDoctor = ref('')
const selectedStatus = ref('')
const selectedService = ref('')
const selectedPayment = ref('')

const selectedIds = ref([])
const bulkDoctorId = ref('')

const showCreateModal = ref(false)
const createError = ref('')
const createForm = ref({
  patient_id: '',
  doctor_id: '',
  date: '',
  start_time: '',
  duration_minutes: 30,
  service_name: '',
  price: null,
  notes: '',
  room: '',
  channel: ''
})

const showRescheduleModal = ref(false)
const rescheduleError = ref('')
const rescheduleTargets = ref([])
const rescheduleForm = ref({
  date: '',
  start_time: '',
  duration_minutes: 30,
  room: '',
  channel: '',
  reason: ''
})

const showCompleteModal = ref(false)
const completeError = ref('')
const completeTarget = ref(null)
const completeForm = ref({
  price: null,
  paid_amount: null
})

const doctors = computed(() => doctorsStore.items)
const patients = computed(() => patientsStore.items)

const statusOptions = computed(() => [
  { value: 'pending', label: 'Yozildi' },
  { value: 'arrived', label: 'Keldi' },
  { value: 'in_progress', label: 'Davolanish' },
  { value: 'completed_paid', label: 'Yakunlandi' },
  { value: 'completed_debt', label: 'Qarzdor' },
  { value: 'cancelled', label: 'Bekor' },
  { value: 'no_show', label: 'Kelmagan' }
])

const dateRange = computed(() => {
  const base = new Date(selectedDate.value)
  if (Number.isNaN(base.getTime())) return { start: selectedDate.value, end: selectedDate.value }

  if (viewMode.value === 'day') {
    return { start: toISODate(base), end: toISODate(base) }
  }
  if (viewMode.value === 'week') {
    const start = startOfWeek(base)
    const end = addDays(start, 6)
    return { start: toISODate(start), end: toISODate(end) }
  }
  const start = new Date(base.getFullYear(), base.getMonth(), 1)
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 0)
  return { start: toISODate(start), end: toISODate(end) }
})

const dateRangeLabel = computed(() => {
  if (dateRange.value.start === dateRange.value.end) {
    return formatDate(dateRange.value.start)
  }
  return `${formatDate(dateRange.value.start)} - ${formatDate(dateRange.value.end)}`
})

const filteredVisits = computed(() => {
  let result = visits.value

  if (selectedDoctor.value) {
    const doctorIdNum = Number(selectedDoctor.value)
    result = result.filter(v => Number(v.doctor_id) === doctorIdNum)
  }
  if (selectedStatus.value) {
    result = result.filter(v => v.status === selectedStatus.value)
  }
  if (selectedService.value) {
    const serviceQuery = selectedService.value.toLowerCase()
    result = result.filter(v => (v.service_name || '').toLowerCase().includes(serviceQuery))
  }
  if (selectedPayment.value) {
    result = result.filter(v => getPaymentStatus(v) === selectedPayment.value)
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(v => {
      const patient = patientsStore.items.find(p => Number(p.id) === Number(v.patient_id))
      const name = patient?.full_name?.toLowerCase() || ''
      const phone = patient?.phone || ''
      const medId = patient?.med_id ? String(patient.med_id) : ''
      return name.includes(query) || phone.includes(query) || medId.includes(query)
    })
  }

  return result
})

const allSelected = computed(() => filteredVisits.value.length > 0 && selectedIds.value.length === filteredVisits.value.length)

const loadVisits = async () => {
  loading.value = true
  try {
    const { start, end } = dateRange.value
    if (isAdmin.value) {
      visits.value = await visitsApi.getVisitsByDateRange(start, end)
    } else if (doctorId.value) {
      visits.value = await visitsApi.getVisitsByDoctorAndDateRange(doctorId.value, start, end)
    } else {
      visits.value = []
    }
  } catch (error) {
    console.error('Failed to load visits:', error)
    visits.value = []
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  createError.value = ''
  createForm.value = {
    patient_id: '',
    doctor_id: '',
    date: selectedDate.value,
    start_time: '',
    duration_minutes: 30,
    service_name: '',
    price: null,
    notes: '',
    room: '',
    channel: ''
  }
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
}

const openRescheduleModal = (visit = null) => {
  rescheduleError.value = ''
  rescheduleTargets.value = visit ? [visit] : selectedVisits()
  if (rescheduleTargets.value.length === 0) return
  const first = rescheduleTargets.value[0]
  rescheduleForm.value = {
    date: first.date || selectedDate.value,
    start_time: first.start_time || '',
    duration_minutes: first.duration_minutes || 30,
    room: first.room || '',
    channel: first.channel || '',
    reason: ''
  }
  showRescheduleModal.value = true
}

const closeRescheduleModal = () => {
  showRescheduleModal.value = false
  rescheduleTargets.value = []
}

const openCompleteModal = (visit) => {
  completeError.value = ''
  completeTarget.value = visit
  completeForm.value = {
    price: visit.price || null,
    paid_amount: visit.paid_amount || null
  }
  showCompleteModal.value = true
}

const closeCompleteModal = () => {
  showCompleteModal.value = false
  completeTarget.value = null
}

const createAppointment = async () => {
  createError.value = ''
  if (!createForm.value.patient_id || !createForm.value.doctor_id) {
    createError.value = 'Bemor va doktor tanlash majburiy.'
    return
  }
  if (!createForm.value.date || !createForm.value.start_time) {
    createError.value = 'Sana va vaqtni kiriting.'
    return
  }

  const endTime = buildEndTime(createForm.value.start_time, createForm.value.duration_minutes)
  const overlap = await hasOverlap({
    date: createForm.value.date,
    start_time: createForm.value.start_time,
    end_time: endTime,
    doctor_id: createForm.value.doctor_id,
    room: createForm.value.room
  })
  if (overlap) {
    createError.value = 'Tanlangan vaqtda doktor yoki xona band.'
    return
  }

  try {
    const doctor = doctors.value.find(d => Number(d.id) === Number(createForm.value.doctor_id))
    await visitsApi.createVisit({
      patient_id: createForm.value.patient_id,
      doctor_id: createForm.value.doctor_id,
      doctor_name: doctor?.full_name || '',
      notes: createForm.value.notes,
      status: 'pending',
      price: createForm.value.price,
      service_name: createForm.value.service_name,
      date: createForm.value.date,
      start_time: createForm.value.start_time,
      end_time: endTime,
      duration_minutes: createForm.value.duration_minutes,
      room: createForm.value.room,
      channel: createForm.value.channel,
      updated_by: getActorLabel()
    })
    toast.success('Uchrashuv yaratildi')
    showCreateModal.value = false
    await loadVisits()
  } catch (error) {
    console.error('Failed to create appointment:', error)
    createError.value = 'Saqlashda xatolik yuz berdi'
  }
}

const applyReschedule = async () => {
  rescheduleError.value = ''
  if (!rescheduleForm.value.date || !rescheduleForm.value.start_time) {
    rescheduleError.value = 'Sana va vaqtni kiriting.'
    return
  }

  const endTime = buildEndTime(rescheduleForm.value.start_time, rescheduleForm.value.duration_minutes)
  for (const visit of rescheduleTargets.value) {
    const overlap = await hasOverlap({
      date: rescheduleForm.value.date,
      start_time: rescheduleForm.value.start_time,
      end_time: endTime,
      doctor_id: visit.doctor_id,
      room: rescheduleForm.value.room,
      ignoreVisitId: visit.id
    })
    if (overlap) {
      rescheduleError.value = 'Tanlangan vaqtda konflikt bor.'
      return
    }
  }

  try {
    for (const visit of rescheduleTargets.value) {
      await visitsApi.updateVisit(visit.id, {
        date: rescheduleForm.value.date,
        start_time: rescheduleForm.value.start_time,
        end_time: endTime,
        duration_minutes: rescheduleForm.value.duration_minutes,
        room: rescheduleForm.value.room,
        channel: rescheduleForm.value.channel,
        notes: visit.notes,
        updated_by: getActorLabel()
      })
    }
    toast.success('Uchrashuvlar ko\'chirildi')
    closeRescheduleModal()
    await loadVisits()
  } catch (error) {
    console.error('Failed to reschedule:', error)
    rescheduleError.value = 'Ko\'chirishda xatolik yuz berdi'
  }
}

const updateStatus = async (visit, status) => {
  try {
    await visitsApi.updateVisit(visit.id, { status, updated_by: getActorLabel() })
    await loadVisits()
  } catch (error) {
    console.error('Failed to update status:', error)
    toast.error('Statusni o\'zgartirishda xatolik')
  }
}

const completeVisit = async () => {
  if (!completeTarget.value) return
  completeError.value = ''

  const price = completeForm.value.price !== null ? Number(completeForm.value.price) : null
  const paidAmount = completeForm.value.paid_amount !== null ? Number(completeForm.value.paid_amount) : null
  const debt = price !== null ? price - (paidAmount || 0) : null

  try {
    const updateData = {
      price,
      paid_amount: paidAmount,
      debt_amount: debt > 0 ? debt : null,
      status: debt > 0 ? 'completed_debt' : 'completed_paid',
      updated_by: getActorLabel()
    }

    await visitsApi.updateVisit(completeTarget.value.id, updateData)
    if (paidAmount && paidAmount > 0) {
      await syncPayment(completeTarget.value, paidAmount)
    }
    toast.success('Uchrashuv yakunlandi')
    closeCompleteModal()
    await loadVisits()
  } catch (error) {
    console.error('Failed to complete visit:', error)
    completeError.value = 'Yakunlashda xatolik yuz berdi'
  }
}

const syncPayment = async (visit, paidAmount) => {
  try {
    const existing = await getPaymentsByVisitId(visit.id)
    const netPaid = existing.reduce((sum, entry) => {
      const amount = Number(entry.amount) || 0
      return sum + (entry.payment_type === 'refund' ? -amount : amount)
    }, 0)
    const diff = paidAmount - netPaid
    if (diff > 0) {
      await createPayment({
        visit_id: visit.id,
        patient_id: visit.patient_id,
        doctor_id: visit.doctor_id,
        amount: diff,
        payment_type: 'payment',
        method: 'cash',
        note: netPaid > 0 ? 'Qo\'shimcha to\'lov' : 'Tashrif to\'lovi'
      })
    }
  } catch (error) {
    console.error('Payment sync failed:', error)
  }
}

const bulkUpdateStatus = async (status) => {
  try {
    for (const id of selectedIds.value) {
      await visitsApi.updateVisit(id, { status, updated_by: getActorLabel() })
    }
    clearSelected()
    await loadVisits()
  } catch (error) {
    console.error('Failed bulk status update:', error)
  }
}

const bulkChangeDoctor = async () => {
  if (!bulkDoctorId.value) return
  const doctor = doctors.value.find(d => Number(d.id) === Number(bulkDoctorId.value))
  try {
    for (const id of selectedIds.value) {
      await visitsApi.updateVisit(id, {
        doctor_id: Number(bulkDoctorId.value),
        doctor_name: doctor?.full_name || '',
        updated_by: getActorLabel()
      })
    }
    clearSelected()
    await loadVisits()
  } catch (error) {
    console.error('Failed bulk doctor change:', error)
  }
}

const toggleSelect = (id) => {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter(item => item !== id)
  } else {
    selectedIds.value.push(id)
  }
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = filteredVisits.value.map(v => v.id)
  }
}

const clearSelected = () => {
  selectedIds.value = []
  bulkDoctorId.value = ''
}

const selectedVisits = () => visits.value.filter(v => selectedIds.value.includes(v.id))

const exportAppointments = () => {
  const data = filteredVisits.value.map(visit => ({
    id: visit.id,
    patient_id: visit.patient_id,
    doctor_id: visit.doctor_id,
    date: visit.date,
    start_time: visit.start_time,
    duration_minutes: visit.duration_minutes,
    service_name: visit.service_name,
    price: visit.price,
    status: visit.status
  }))
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'appointments.json'
  a.click()
  URL.revokeObjectURL(url)
  toast.success('Export tayyor')
}

const importAppointments = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  const text = await file.text()
  const lines = text.split('\n').filter(Boolean)
  if (lines.length <= 1) {
    toast.error('CSV bo\'sh yoki noto\'g\'ri')
    return
  }
  const [headerLine, ...rows] = lines
  const headers = headerLine.split(',').map(h => h.trim())
  const required = ['patient_id', 'doctor_id', 'date', 'start_time', 'duration_minutes']
  if (!required.every(r => headers.includes(r))) {
    toast.error('CSV ustunlari yetarli emas')
    return
  }
  try {
    for (const row of rows) {
      const cells = row.split(',').map(c => c.trim())
      const payload = headers.reduce((acc, key, index) => {
        acc[key] = cells[index] || ''
        return acc
      }, {})
      const endTime = buildEndTime(payload.start_time, Number(payload.duration_minutes))
      await visitsApi.createVisit({
        patient_id: payload.patient_id,
        doctor_id: payload.doctor_id,
        date: payload.date,
        start_time: payload.start_time,
        end_time: endTime,
        duration_minutes: Number(payload.duration_minutes),
        service_name: payload.service_name || null,
        price: payload.price ? Number(payload.price) : null,
        notes: payload.notes || null,
        room: payload.room || null,
        channel: payload.channel || null,
        status: payload.status || 'pending',
        updated_by: getActorLabel()
      })
    }
    toast.success('Import yakunlandi')
    await loadVisits()
  } catch (error) {
    console.error('Import failed:', error)
    toast.error('Importda xatolik')
  } finally {
    event.target.value = ''
  }
}

const setToday = () => {
  selectedDate.value = new Date().toISOString().split('T')[0]
}

const shiftRange = (direction) => {
  const base = new Date(selectedDate.value)
  if (Number.isNaN(base.getTime())) return
  let delta = 1
  if (viewMode.value === 'week') delta = 7
  if (viewMode.value === 'month') delta = 30
  selectedDate.value = toISODate(addDays(base, delta * direction))
}

const getPatientName = (patientId) => {
  const patient = patientsStore.items.find(p => Number(p.id) === Number(patientId))
  return patient?.full_name || `#${patientId}`
}

const getPatientPhone = (patientId) => {
  const patient = patientsStore.items.find(p => Number(p.id) === Number(patientId))
  return patient?.phone || ''
}

const getDoctorName = (doctorIdValue) => {
  const doctor = doctorsStore.items.find(d => Number(d.id) === Number(doctorIdValue))
  return doctor?.full_name || '-'
}

const getStatusLabel = (status) => getVisitStatusLabel(status)

const getStatusClass = (status) => {
  const colors = getVisitStatusColors(status)
  return `${colors.bgClass} ${colors.textClass}`
}

const getPaymentStatus = (visit) => {
  const price = Number(visit.price || 0)
  const paid = Number(visit.paid_amount || 0)
  if (visit.status === 'completed_debt') return 'debt'
  if (price === 0) return 'paid'
  if (paid >= price) return 'paid'
  if (paid > 0 && paid < price) return 'partial'
  return 'unpaid'
}

const getPaymentLabel = (visit) => {
  const status = getPaymentStatus(visit)
  if (status === 'paid') return 'To\'langan'
  if (status === 'partial') return 'Qisman'
  if (status === 'debt') return 'Qarzdor'
  return 'To\'lanmagan'
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatTimeRange = (visit) => {
  const start = visit.start_time || ''
  const end = visit.end_time || (visit.start_time ? buildEndTime(visit.start_time, visit.duration_minutes || 0) : '')
  if (!start) return '--'
  return end ? `${start} - ${end}` : start
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0).replace('UZS', 'so\'m')
}

const toISODate = (date) => date.toISOString().split('T')[0]

const addDays = (date, days) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const startOfWeek = (date) => {
  const day = date.getDay()
  const diff = date.getDate() - (day === 0 ? 6 : day - 1)
  return new Date(date.getFullYear(), date.getMonth(), diff)
}

const buildEndTime = (startTime, durationMinutes) => {
  if (!startTime || !durationMinutes) return null
  const [hours, minutes] = startTime.split(':').map(Number)
  const total = hours * 60 + minutes + Number(durationMinutes)
  const endHours = String(Math.floor(total / 60) % 24).padStart(2, '0')
  const endMinutes = String(total % 60).padStart(2, '0')
  return `${endHours}:${endMinutes}`
}

const hasOverlap = async ({ date, start_time, end_time, doctor_id, room, ignoreVisitId = null }) => {
  if (!date || !start_time || !end_time) return false
  const start = timeToMinutes(start_time)
  const end = timeToMinutes(end_time)
  const baseVisits = await getVisitsForDate(date, doctor_id)
  return baseVisits.some(visit => {
    if (ignoreVisitId && visit.id === ignoreVisitId) return false
    if (visit.date !== date) return false
    const sameDoctor = doctor_id && Number(visit.doctor_id) === Number(doctor_id)
    const sameRoom = room && visit.room && visit.room === room
    if (!sameDoctor && !sameRoom) return false
    const visitStart = timeToMinutes(visit.start_time || '00:00')
    const visitEnd = timeToMinutes(visit.end_time || visit.start_time || '00:00')
    return start < visitEnd && end > visitStart
  })
}

const getVisitsForDate = async (date, doctorIdValue) => {
  const { start, end } = dateRange.value
  if (date >= start && date <= end) {
    return visits.value
  }

  try {
    if (doctorIdValue) {
      return await visitsApi.getVisitsByDoctorAndDateRange(doctorIdValue, date, date)
    }
    return await visitsApi.getVisitsByDateRange(date, date)
  } catch (error) {
    console.error('Failed to load visits for overlap:', error)
    return visits.value
  }
}

const timeToMinutes = (value) => {
  if (!value) return 0
  const [h, m] = value.split(':').map(Number)
  return h * 60 + m
}

const getActorLabel = () => {
  if (isAdmin.value) return 'admin'
  return authStore.user?.id ? `doctor:${authStore.user.id}` : 'doctor'
}

onMounted(async () => {
  const patientLoad = isAdmin.value
    ? patientsStore.fetchPatients()
    : (doctorId.value ? patientsStore.fetchPatientsByDoctor(doctorId.value) : patientsStore.fetchPatients())

  await Promise.all([
    doctorsStore.fetchAll(),
    patientLoad
  ])
  await loadVisits()
})

watch([viewMode, selectedDate], loadVisits)
</script>
