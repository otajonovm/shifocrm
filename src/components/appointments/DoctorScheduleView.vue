<template>
  <div class="doctor-schedule-container w-full space-y-4">
    <!-- Schedule grid - Day view (Dentist+ style) -->
    <div v-if="selectedViewMode === 'day'" class="bg-white overflow-hidden flex flex-col w-full max-w-none h-[calc(100vh-220px)] sm:h-[calc(100vh-250px)] min-h-[500px]">
      <!-- Toolbar -->
      <div class="px-4 sm:px-6 lg:px-8 py-4 bg-gradient-to-r from-slate-50 to-blue-50/60 flex items-center justify-between flex-wrap gap-3">
        <!-- Doctor Filter with Multi-select -->
        <div v-if="isAdmin" class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700">Shifokorlar:</label>
          <div class="relative" ref="doctorDropdownRef">
            <button
              @click="showDoctorDropdown = !showDoctorDropdown"
              class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white flex items-center gap-2 min-w-[200px]"
            >
              <span v-if="selectedDoctorIds.length === 0" class="text-gray-500">Hammasi</span>
              <span v-else-if="selectedDoctorIds.length === visibleDoctors.length" class="text-gray-900">Hammasi tanlangan</span>
              <span v-else class="text-gray-900">{{ selectedDoctorIds.length }} ta tanlangan</span>
              <svg class="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Dropdown -->
            <div
              v-if="showDoctorDropdown"
              class="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[250px]"
            >
              <div class="p-2 border-b border-gray-200 flex gap-2">
                <button
                  @click="selectAllDoctors"
                  class="px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded"
                >
                  Hammasini tanlash
                </button>
                <button
                  @click="clearDoctorSelection"
                  class="px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded"
                >
                  Tozalash
                </button>
              </div>
              <div class="max-h-60 overflow-y-auto p-2">
                <label
                  v-for="doctor in visibleDoctors"
                  :key="doctor.id"
                  class="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :value="doctor.id"
                    v-model="selectedDoctorIds"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm">{{ doctor.full_name }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center flex-wrap gap-2 text-xs">
          <span class="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-1 font-semibold text-primary-700">
            {{ t('appointments.kpiTotal') }}: {{ bookedAppointmentsCount }}
          </span>
          <span class="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
            {{ t('appointments.kpiOccupancy') }}: {{ emptySlotsCount }}
          </span>
        </div>

        <!-- New Appointment Button -->
        <button
          @click="openNewAppointmentModal(null, null)"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary-500 to-cyan-600 px-3 py-2 text-white transition-all hover:from-primary-600 hover:to-cyan-700 sm:px-4"
          aria-label="Yangi uchrashuv"
        >
          <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v14m-7-7h14" />
          </svg>
          <span class="hidden sm:inline text-sm font-semibold">Yangi uchrashuv</span>
        </button>
      </div>

      <!-- Schedule Canvas -->
      <div class="flex-1 overflow-auto relative bg-white">
        <div :class="['day-grid', dayGridContainerClass]">
          <!-- Left: Time column (sticky) -->
          <div class="bg-slate-50 time-column flex-shrink-0 sticky left-0 z-40 pl-2 sm:pl-3" :class="timeColumnWidth">
            <!-- Empty space for top-left intersection to align with doctor headers (compact) -->
            <div class="sticky top-0 z-50 bg-slate-50 h-[48px] sm:h-[56px]"></div>

            <div
              v-for="hour in hours"
              :key="hour.key"
              class="relative text-right pr-1 sm:pr-1 md:pr-2 py-0 text-[11px] font-semibold text-slate-500 bg-slate-50 select-none"
              :style="{ height: slotHeightPx + 'px' }"
            >
              <div v-if="hour.isLabel" class="absolute -top-2 right-1 sm:right-2 px-1.5 py-0.5 rounded-full bg-slate-50/95 backdrop-blur text-slate-600">
                {{ hour.display }}
              </div>
            </div>
          </div>

          <!-- Right: Doctor columns -->
          <div class="flex flex-1">
            <div
              v-for="(doctor, docIdx) in displayedDoctors"
              :key="doctor.id"
              class="relative"
              :class="isSparseDayLayout ? 'flex-none min-w-0' : 'flex-shrink-0'"
              :style="getDoctorColumnStyle(doctor)"
            >
              <!-- Doctor header (sticky top) -->
              <div class="sticky top-0 z-30 bg-gradient-to-b from-primary-50 to-white px-2 sm:px-3 py-2 sm:py-2 shadow-sm h-[48px] sm:h-[56px] flex flex-col justify-center">
                <div class="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-1" :title="doctor.full_name">{{ doctor.full_name }}</div>
                <div class="text-xs text-gray-500 line-clamp-1">{{ doctor.specialization || 'Shifokor' }}</div>
              </div>

              <!-- Time slots area -->
              <div class="relative">
                <!-- Background grid (clickable) -->
                <div
                  v-for="hour in hours"
                  :key="`bg-${doctor.id}-${hour.time}`"
                  class="bg-gradient-to-b from-blue-50/70 via-white to-white hover:from-blue-100 hover:via-blue-50 hover:to-white cursor-pointer transition-colors duration-150 active:bg-blue-200/90"
                  :style="{ height: slotHeightPx + 'px' }"
                  :title="`${doctor.full_name} — ${hour.time} da qabul ochish`"
                  @click="handleSlotClick(doctor.id, hour.time)"
                />

                <!-- Current time indicator: Only show text on the first doctor, or just use a horizontal line spanning everything -->
                <CurrentTimeIndicator
                  :start-hour="0"
                  :end-hour="24"
                  :show-text="docIdx === 0"
                  class="absolute left-0 right-0 z-20 pointer-events-none"
                />

              <!-- Appointments (draggable) -->
              <div class="absolute inset-0 pointer-events-none">
                <div
                  v-for="appt in getAppointmentsForDoctor(doctor.id)"
                  :key="appt.id"
                  class="absolute left-2 right-2 pointer-events-auto cursor-grab active:cursor-grabbing"
                  :class="draggingAppointment && draggingAppointment.id === appt.id ? 'z-40 opacity-85 scale-[0.985]' : 'z-10'"
                  :style="getAppointmentStyle(appt)"
                  @mousedown="startDrag($event, appt)"
                >
                  <AppointmentBlock
                    :appointment="appt"
                    :slot-height-px="slotHeightPx"
                    :positioned-by-parent="true"
                    @update-status="handleStatusUpdate"
                    @open-payment="handleOpenPayment"
                    @open-patient-modal="handleOpenPatientModal"
                    @open-patient-detail="handleOpenPatientDetail"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>

    <!-- Schedule grid - Week view -->
    <div v-else-if="selectedViewMode === 'week'" class="bg-white overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-900 bg-gray-50 w-32">{{ t('appointments.time') }}</th>
              <th
                v-for="day in weekDays"
                :key="day.dateStr"
                class="px-4 py-3 text-center text-sm font-semibold text-gray-900 bg-gray-50 border-l border-gray-200"
              >
                <div class="font-medium">{{ day.dayName }}</div>
                <div class="text-xs text-gray-500">{{ day.dateStr }}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(doctor, docIdx) in visibleDoctors"
              :key="`doctor-${doctor.id}`"
              :class="[
                'border-b border-gray-200',
                docIdx !== visibleDoctors.length - 1 ? 'border-b-2' : ''
              ]"
            >
              <td class="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-50 border-r border-gray-200 sticky left-0">
                <div>{{ doctor.full_name }}</div>
                <div class="text-xs text-gray-500">{{ doctor.specialization }}</div>
              </td>
              <td
                v-for="day in weekDays"
                :key="`${doctor.id}-${day.dateStr}`"
                class="px-2 py-3 border-l border-gray-200 text-center min-w-[120px] bg-gradient-to-br from-blue-50 to-transparent hover:from-blue-100 cursor-pointer transition-colors"
                @click="currentDate = day.dateStr; selectedViewMode = 'day'"
              >
                <div class="text-2xl font-bold text-primary-600">
                  {{ getAppointmentsForDoctorAndDate(doctor.id, day.dateStr).length }}
                </div>
                <div class="text-xs text-gray-500 mt-1">uchrashuvlar</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Schedule grid - Month view -->
    <div v-else-if="selectedViewMode === 'month'" class="bg-white overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50">
              <th
                v-for="dayName in dayNames"
                :key="dayName"
                class="px-4 py-3 text-center text-sm font-semibold text-gray-900"
              >
                {{ dayName }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(week, weekIdx) in monthCalendar"
              :key="weekIdx"
              class="border-b border-gray-200"
            >
              <td
                v-for="day in week"
                :key="day.dateStr"
                :class="[
                  'px-4 py-3 border-r border-gray-200 h-40 align-top',
                  day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                ]"
              >
                <div :class="['text-sm font-semibold mb-2', day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400']">
                  {{ day.dayNum }}
                </div>
                <div v-if="day.isCurrentMonth" class="space-y-1 text-xs">
                  <div
                    v-for="appt in getAppointmentsForDateMonth(day.dateStr)"
                    :key="appt.id"
                    :class="['p-1 rounded cursor-pointer hover:shadow-md truncate', getStatusBadgeClass(appt.status)]"
                    :title="`${appt.patient_name} - ${appt.doctor_name} (${appt.start_time})`"
                    @click="$emit('open-payment', appt.id)"
                  >
                    <div class="font-medium truncate">{{ appt.patient_name }}</div>
                    <div class="text-xs opacity-75">{{ appt.doctor_name }}</div>
                  </div>
                  <div v-if="getAppointmentsForDateMonth(day.dateStr).length > 3" class="text-xs text-gray-500 mt-1">
                    +{{ getAppointmentsForDateMonth(day.dateStr).length - 3 }} boshqa
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Info: no doctors -->
    <div v-if="visibleDoctors.length === 0" class="text-center py-12 text-gray-500">
      <p>{{ t('appointments.noDoctors') || 'Doktorlar topilmadi' }}</p>
    </div>

    <!-- Loading indicator -->
    <div v-if="loading" class="text-center py-6 text-gray-500">
      {{ t('appointments.loading') }}
    </div>

    <!-- Patient Modal -->
    <PatientModalInfo
      :appointment="selectedPatientAppointment"
      :is-open="patientModalOpen"
      @close="patientModalOpen = false"
      @update-status="handleStatusUpdate"
      @open-payment="handleOpenPayment"
      @call="handleCallPatient"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useDoctorsStore } from '@/stores/doctors'
import { usePatientsStore } from '@/stores/patients'
import * as visitsApi from '@/api/visitsApi'
import { getVisitStatusColors } from '@/constants/visitStatus'
import CurrentTimeIndicator from './CurrentTimeIndicator.vue'
import AppointmentBlock from './AppointmentBlock.vue'
import PatientModalInfo from './PatientModalInfo.vue'

const props = defineProps({
  selectedDate: {
    type: String,
    required: true
  },
  viewMode: {
    type: String,
    default: 'day'
  }
})

const emit = defineEmits(['update:selectedDate', 'update:view-mode', 'update-status', 'open-payment', 'open-patient-detail'])

const { t } = useI18n()
const authStore = useAuthStore()
const isClinicScopedSuperAdmin = computed(() => authStore.userRole === 'super_admin' && authStore.superAdminScope === 'clinic')
const isAdmin = computed(() => authStore.userRole === 'admin' || isClinicScopedSuperAdmin.value)
const doctorsStore = useDoctorsStore()
const patientsStore = usePatientsStore()

const loading = ref(false)
const appointments = ref([])
const patientModalOpen = ref(false)
const selectedPatientAppointment = ref(null)
// Hourly slots
const slotHeightPx = 60 // 1 soat = 60px
const currentDate = ref(props.selectedDate || new Date().toISOString().split('T')[0])
const selectedDoctorIds = ref([]) // Multi-select doctor IDs
const showDoctorDropdown = ref(false)
const doctorDropdownRef = ref(null) // Ref for dropdown element
const dragPendingAppointment = ref(null)
const draggingAppointment = ref(null)
const dragStartY = ref(0)
const dragStartTime = ref('')
const dragMoved = ref(false)
const suppressNextModalOpen = ref(false)
const DRAG_START_THRESHOLD_PX = 8

// Responsive breakpoints (mobile, tablet, desktop)
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)

const dayNames = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Yak']
const DAY_START_HOUR = 0
const DAY_END_HOUR = 24
const SLOT_MINUTES = 60

const selectedViewMode = computed({
  get: () => {
    const mode = String(props.viewMode || 'day')
    return ['day', 'week', 'month'].includes(mode) ? mode : 'day'
  },
  set: (mode) => {
    if (!['day', 'week', 'month'].includes(String(mode))) return
    emit('update:view-mode', mode)
  }
})

// Close dropdown on outside click
const handleClickOutside = (event) => {
  if (doctorDropdownRef.value && !doctorDropdownRef.value.contains(event.target)) {
    showDoctorDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Time array for day view grid (24 hours, 1 hour slots)
const hours = computed(() => {
  const result = []
  for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h++) {
    result.push({
      key: `${h}-0`,
      time: `${String(h).padStart(2, '0')}:00`,
      display: String(h),
      isLabel: true
    })
  }
  return result
})

// Doktor uchun faqat o'z appointmentlari, admin uchun barchasi
// Responsive column widths
const timeColumnWidth = computed(() => {
  // Compact widths: Mobile: 3rem (48px), Desktop: 4rem (64px)
  if (windowWidth.value < 640) return 'w-12' // 48px
  return 'w-16' // 64px
})

const doctorColumnWidth = computed(() => {
  // Mobile: 280px, Tablet: 320px, Desktop: 360px
  if (windowWidth.value < 640) return '280px' // Mobile
  if (windowWidth.value < 1024) return '320px' // Tablet
  return '360px' // Desktop
})

const visibleDoctors = computed(() => {
  const allDoctors = doctorsStore.items || []
  if (isAdmin.value) {
    return allDoctors
  }
  // Doktor uchun faqat o'zini ko'rsatish
  const myId = authStore.user?.id
  return allDoctors.filter(d => Number(d.id) === Number(myId))
})

// Displayed doctors (filtered by selection)
const displayedDoctors = computed(() => {
  if (selectedDoctorIds.value.length === 0) {
    return visibleDoctors.value
  }
  return visibleDoctors.value.filter(d => selectedDoctorIds.value.includes(d.id))
})

const patientByIdMap = computed(() => {
  const map = new Map()
  for (const patient of patientsStore.items || []) {
    map.set(Number(patient.id), patient)
  }
  return map
})

// Tanlangan kun uchun appointmentlar (day view)
const dayAppointments = computed(() => {
  return appointments.value.filter(appt => appt.date === currentDate.value)
})

const doctorLoadMap = computed(() => {
  const map = new Map()
  for (const doctor of displayedDoctors.value) {
    map.set(Number(doctor.id), 0)
  }

  for (const appointment of dayAppointments.value) {
    const id = Number(appointment.doctor_id)
    map.set(id, (map.get(id) || 0) + 1)
  }

  return map
})

const leadingDoctorIdForTwoColumn = computed(() => {
  if (displayedDoctors.value.length !== 2) return null
  const firstId = Number(displayedDoctors.value[0]?.id)
  const secondId = Number(displayedDoctors.value[1]?.id)
  const firstLoad = doctorLoadMap.value.get(firstId) || 0
  const secondLoad = doctorLoadMap.value.get(secondId) || 0
  return secondLoad > firstLoad ? secondId : firstId
})

const isSparseDayLayout = computed(() => {
  return selectedViewMode.value === 'day' && displayedDoctors.value.length <= 2
})

const dayGridContainerClass = computed(() => {
  return isSparseDayLayout.value ? 'flex w-full min-w-0' : 'flex min-w-max'
})

const getDoctorColumnStyle = (doctor) => {
  if (!isSparseDayLayout.value) {
    return { width: doctorColumnWidth.value }
  }

  if (displayedDoctors.value.length <= 1) {
    return { width: '100%' }
  }

  const currentDoctorId = Number(doctor?.id)
  const isLeadingDoctor = currentDoctorId === Number(leadingDoctorIdForTwoColumn.value)
  return { width: isLeadingDoctor ? '60%' : '40%' }
}

const displayedDoctorIdSet = computed(() => new Set(displayedDoctors.value.map(doctor => Number(doctor.id))))

const displayedDayAppointments = computed(() => {
  if (selectedViewMode.value !== 'day') return []
  const idSet = displayedDoctorIdSet.value
  return dayAppointments.value.filter(appt => idSet.has(Number(appt.doctor_id)))
})

const bookedAppointmentsCount = computed(() => displayedDayAppointments.value.length)

const totalSlotsCount = computed(() => {
  if (selectedViewMode.value !== 'day') return 0
  return displayedDoctors.value.length * hours.value.length
})

const emptySlotsCount = computed(() => {
  const total = totalSlotsCount.value
  if (!total) return 0
  return Math.max(total - bookedAppointmentsCount.value, 0)
})

// Get appointments for specific doctor
const getAppointmentsForDoctor = (doctorId) => {
  return dayAppointments.value
    .filter(appt => Number(appt.doctor_id) === Number(doctorId))
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
}

// Week days
const weekDays = computed(() => {
  const weekStart = getWeekStart(currentDate.value)
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    days.push({
      dateStr,
      dayName: d.toLocaleDateString('uz-UZ', { weekday: 'short' }),
      dayNum: d.getDate()
    })
  }
  return days
})

// Month calendar (42-day grid)
const monthCalendar = computed(() => {
  const date = new Date(currentDate.value + 'T00:00:00')
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)

  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())

  const calendar = []
  let week = []
  const current = new Date(startDate)

  for (let i = 0; i < 42; i++) {
    const dateStr = current.toISOString().split('T')[0]
    const isCurrentMonth = current.getMonth() === date.getMonth()

    week.push({
      dateStr,
      dayNum: current.getDate(),
      isCurrentMonth
    })

    if (week.length === 7) {
      calendar.push(week)
      week = []
    }

    current.setDate(current.getDate() + 1)
  }

  return calendar
})

const getWeekStart = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00')
  const day = date.getDay() || 7
  const diff = date.getDate() - day + 1
  const weekStart = new Date(date.setDate(diff))
  return weekStart.toISOString().split('T')[0]
}

const getStatusBadgeClass = (status) => {
  const colors = getVisitStatusColors(status)
  return `${colors.bgClass} ${colors.textClass}`
}

const getAppointmentsForDoctorAndDate = (doctorId, dateStr) => {
  return appointments.value
    .filter(appt => appt.date === dateStr && Number(appt.doctor_id) === Number(doctorId))
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
}

const getAppointmentsForDateMonth = (dateStr) => {
  return appointments.value
    .filter(appt => appt.date === dateStr)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
}

// Appointmentlarni yuklash
const loadAppointments = async () => {
  loading.value = true
  try {
    let startDate, endDate

    if (selectedViewMode.value === 'day') {
      startDate = currentDate.value
      endDate = currentDate.value
    } else if (selectedViewMode.value === 'week') {
      const weekStart = getWeekStart(currentDate.value)
      startDate = weekStart
      const weekEnd = new Date(weekStart + 'T00:00:00')
      weekEnd.setDate(weekEnd.getDate() + 6)
      endDate = weekEnd.toISOString().split('T')[0]
    } else {
      const date = new Date(currentDate.value + 'T00:00:00')
      startDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      endDate = lastDay.toISOString().split('T')[0]
    }

    let visits = []
    if (isAdmin.value) {
      visits = await visitsApi.getVisitsByDateRange(startDate, endDate)
    } else if (authStore.user?.id) {
      visits = await visitsApi.getVisitsByDoctorAndDateRange(
        authStore.user.id,
        startDate,
        endDate
      )
    }

    // Shifokor va bemor ma'lumotlarini qo'shish
    // TEMP: start_time va end_time database'da yo'q bo'lgani uchun placeholder qo'shamiz
    appointments.value = visits.map(visit => {
      const doctor = visibleDoctors.value.find(d => Number(d.id) === Number(visit.doctor_id))
      const patient = patientByIdMap.value.get(Number(visit.patient_id))

      // Temporary: agar start_time yo'q bo'lsa, default qiymat ishlatish
      const startTime = visit.start_time || '09:00'
      const endTime = visit.end_time || '10:00'

      return {
        ...visit,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: visit.duration_minutes || 60,
        doctor_name: doctor?.full_name || 'N/A',
        specialization: doctor?.specialization || 'N/A',
        patient_name: patient?.full_name || visit.patient_name || `#${visit.patient_id}`,
        phone: patient?.phone || visit.phone || '',
        med_id: patient?.med_id || visit.med_id || '',
        diagnosis: patient?.diagnosis || visit.diagnosis || null,
        patient_address: patient?.address || visit.patient_address || '',
        patient_gender: patient?.gender || visit.patient_gender || ''
      }
    })
  } catch (error) {
    console.error('Failed to load appointments:', error)
    appointments.value = []
  } finally {
    loading.value = false
  }
}

// Status o'zgartirish
const handleStatusUpdate = async (newStatus) => {
  const appointmentId = typeof newStatus === 'object' ? newStatus.appointmentId : selectedPatientAppointment.value?.id
  const statusToSet = typeof newStatus === 'object' ? newStatus.status : newStatus
  if (!appointmentId || !statusToSet) return

  const targetAppointment = appointments.value.find(a => Number(a.id) === Number(appointmentId))
  if (!targetAppointment) return

  try {
    await visitsApi.updateVisit(targetAppointment.id, { status: statusToSet })
    await loadAppointments()
    if (selectedPatientAppointment.value?.id) {
      const refreshed = appointments.value.find(a => Number(a.id) === Number(selectedPatientAppointment.value.id))
      if (refreshed) {
        selectedPatientAppointment.value = refreshed
      }
    }
    emit('update-status', { appointmentId: targetAppointment.id, status: statusToSet })
  } catch (error) {
    console.error('Failed to update status:', error)
  }
}

// Bemor modal'ini ochish
const handleOpenPatientModal = (appointment) => {
  if (suppressNextModalOpen.value) return
  selectedPatientAppointment.value = appointment
  patientModalOpen.value = true
}

const handleOpenPatientDetail = (patientId) => {
  const id = Number(patientId)
  if (!Number.isFinite(id)) return
  emit('open-patient-detail', id)
}

// Telefon qo'ng'iroq
const handleCallPatient = (phone) => {
  if (phone) {
    window.location.href = `tel:${phone}`
  }
}

// Multi-select dropdown metodlari
const selectAllDoctors = () => {
  selectedDoctorIds.value = visibleDoctors.value.map(d => d.id)
}

const clearDoctorSelection = () => {
  selectedDoctorIds.value = []
}

// Click-to-create appointment
const handleSlotClick = (doctorId, timeStr) => {
  openNewAppointmentModal(doctorId, timeStr)
}

const openNewAppointmentModal = (doctorId, startTime) => {
  emit('open-payment', null, {
    doctorId,
    startTime,
    date: currentDate.value
  })
}

// Drag & drop implementation
const startDrag = (event, appt) => {
  event.stopPropagation() // Prevent slot click
  dragPendingAppointment.value = appt
  dragStartY.value = event.clientY
  dragStartTime.value = appt.start_time
  dragMoved.value = false
  suppressNextModalOpen.value = false

  document.addEventListener('mousemove', handleDragMove)
  document.addEventListener('mouseup', handleDragEnd)
  document.body.style.cursor = 'grabbing'
}

const handleDragMove = (event) => {
  if (!dragPendingAppointment.value) return

  const deltaY = event.clientY - dragStartY.value
  if (!draggingAppointment.value && Math.abs(deltaY) < DRAG_START_THRESHOLD_PX) {
    return
  }

  if (!draggingAppointment.value) {
    draggingAppointment.value = dragPendingAppointment.value
    dragStartY.value = event.clientY
    dragStartTime.value = dragPendingAppointment.value.start_time
  }

  const deltaYForMove = event.clientY - dragStartY.value
  const deltaSlots = Math.round(deltaYForMove / slotHeightPx)

  if (deltaSlots !== 0) {
    dragMoved.value = true
    const [h, m] = dragStartTime.value.split(':').map(Number)
    const newMinutes = h * 60 + m + (deltaSlots * SLOT_MINUTES)
    const newH = Math.floor(newMinutes / 60)
    const newM = newMinutes % 60
    const dayStartMinutes = DAY_START_HOUR * 60
    const dayEndMinutes = DAY_END_HOUR * 60
    const durationMinutes = draggingAppointment.value.end_time
      ? (() => {
          const [endH, endM] = draggingAppointment.value.end_time.split(':').map(Number)
          return (endH * 60 + endM) - (h * 60 + m)
        })()
      : 30

    if (newMinutes >= dayStartMinutes && newMinutes + durationMinutes <= dayEndMinutes) {
      const newTime = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
      draggingAppointment.value.start_time = newTime

      // Update end_time if exists
      if (draggingAppointment.value.end_time) {
        const newEndMinutes = newMinutes + durationMinutes
        const newEndH = Math.floor(newEndMinutes / 60)
        const newEndM = newEndMinutes % 60
        draggingAppointment.value.end_time = `${String(newEndH).padStart(2, '0')}:${String(newEndM).padStart(2, '0')}`
      }

      dragStartY.value = event.clientY
      dragStartTime.value = newTime
    }
  }
}

const handleDragEnd = async () => {
  if (!dragPendingAppointment.value) return

  try {
    if (draggingAppointment.value) {
      // Update appointment via API
      await visitsApi.updateVisit(draggingAppointment.value.id, {
        start_time: draggingAppointment.value.start_time,
        end_time: draggingAppointment.value.end_time
      })

      // Reload appointments
      await loadAppointments()
    }
  } catch (error) {
    console.error('Failed to update appointment:', error)
    // Reload to revert visual changes
    await loadAppointments()
  } finally {
    suppressNextModalOpen.value = dragMoved.value
    dragPendingAppointment.value = null
    draggingAppointment.value = null
    document.removeEventListener('mousemove', handleDragMove)
    document.removeEventListener('mouseup', handleDragEnd)
    document.body.style.cursor = ''

    if (dragMoved.value) {
      setTimeout(() => {
        suppressNextModalOpen.value = false
      }, 0)
    }

    dragMoved.value = false
  }
}

// To'lov modali ochish
const handleOpenPayment = (appointmentId) => {
  emit('open-payment', appointmentId)
}

// Appointment'ning pixel position'ini hisoblash (start_time va end_time bo'yicha)
const getAppointmentStyle = (appt) => {
  if (!appt.start_time) return {}

  const [startH, startM] = appt.start_time.split(':').map(Number)
  const startMinutesFromDay = (startH - DAY_START_HOUR) * 60 + startM
  const topPx = (startMinutesFromDay / SLOT_MINUTES) * slotHeightPx

  // Default duration 1 hour agar end_time bo'lmasa
  let heightPx = slotHeightPx
  if (appt.end_time) {
    const [endH, endM] = appt.end_time.split(':').map(Number)
    const endMinutesFromDay = (endH - DAY_START_HOUR) * 60 + endM
    const durationMinutes = endMinutesFromDay - startMinutesFromDay
    heightPx = Math.max(slotHeightPx, (durationMinutes / SLOT_MINUTES) * slotHeightPx)
  } else if (appt.duration_minutes) {
    heightPx = Math.max(slotHeightPx, (appt.duration_minutes / SLOT_MINUTES) * slotHeightPx)
  }

  return {
    top: `${topPx}px`,
    height: `${heightPx}px`,
    minHeight: `${slotHeightPx}px`
  }
}

// Watch current date va view mode
watch([() => currentDate.value, () => selectedViewMode.value], loadAppointments)

watch(() => props.selectedDate, (value) => {
  if (value && value !== currentDate.value) {
    currentDate.value = value
  }
})

watch(currentDate, (value) => {
  if (value && value !== props.selectedDate) {
    emit('update:selectedDate', value)
  }
})

// Window resize handler for responsive design
const handleWindowResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  loadAppointments()
  if (isAdmin.value) {
    patientsStore.fetchPatients()
  } else if (authStore.user?.id) {
    patientsStore.fetchPatientsByDoctor(authStore.user.id)
  }
  window.addEventListener('resize', handleWindowResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize)
})
</script>

<style scoped>
.doctor-schedule-container {
  width: 100%;
}

/* Google Calendar-like tweaks */
.day-grid {
  background: #ffffff;
}

.day-grid .time-column {
  background: #fbfdff; /* very subtle tint */
}

.day-grid .time-column .text-xs {
  color: #64748b; /* slightly muted */
  font-weight: 600;
}

/* Make appointment blocks flatter and with subtle shadow */
.appointment-block {
  border-width: 0 !important;
  border-left-width: 6px !important;
  border-radius: 6px !important;
  padding: 6px !important;
}

/* Smaller text for time labels to fit compact layout */
.day-grid .text-xs {
  font-size: 12px;
}

/* Make current time indicator more prominent (thin red line with small dot) */
.day-grid .flex-1.h-0.5.bg-red-500 {
  height: 2px !important;
}

</style>
