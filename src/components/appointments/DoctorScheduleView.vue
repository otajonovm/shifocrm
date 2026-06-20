<template>
  <div class="doctor-schedule-container w-full h-full max-w-full min-w-0 overflow-hidden flex flex-col">
    <!-- Kunlik shifokor ustunlari jadvali -->
    <div class="bg-white overflow-hidden flex flex-col flex-1 w-full min-h-0 h-full">
      <!-- Toolbar (ixcham, soyasiz) -->
      <div class="px-2 sm:px-3 py-2 bg-white flex items-center justify-between flex-wrap gap-2 border-b border-gray-100 flex-shrink-0">
        <div
          v-if="clickMoveAppointment"
          class="w-full rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-medium text-primary-800 animate-fade-in"
        >
          «{{ clickMoveAppointment.patient_name }}» ko'chirilmoqda — yangi shifokor/vaqt ustuniga bosing yoki qayta bosing (bekor).
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
          class="inline-flex items-center justify-center gap-2 bg-primary-600 px-3 py-1.5 text-white transition-colors hover:bg-primary-700 sm:px-4"
          aria-label="Yangi uchrashuv"
        >
          <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v14m-7-7h14" />
          </svg>
          <span class="hidden sm:inline text-sm font-semibold">Yangi uchrashuv</span>
        </button>
      </div>

      <!-- Jadval: ekran balandligini to'ldiradi, kerak bo'lsa vertikal scroll -->
      <div
        ref="scheduleCanvasRef"
        class="flex-1 min-h-0 relative bg-white flex flex-col"
        :class="needsVerticalScroll ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden'"
      >
        <div class="flex-1 min-h-0 h-full overflow-x-auto touch-pan-x overscroll-x-contain">
          <div class="day-grid flex w-full min-w-full h-full min-h-0 relative">
          <!-- Chap: vaqt ustuni -->
          <div
            class="bg-gray-50/80 time-column flex flex-col h-full self-stretch flex-shrink-0 sticky left-0 z-40 pl-2 sm:pl-3 border-r border-gray-100"
            :class="timeColumnWidth"
          >
            <div class="sticky top-0 z-50 bg-gray-50/95 h-14 flex-shrink-0 border-b border-gray-100" />

            <div class="relative flex flex-col flex-1 min-h-0" :style="slotsAreaStyle">
              <div
                v-for="slot in timeSlots"
                :key="slot.key"
                class="flex items-start justify-end pt-1.5 pr-2 sm:pr-3 select-none border-b border-gray-100 font-mono tabular-nums leading-none text-xs sm:text-sm font-semibold text-gray-600 bg-gray-50/80 flex-shrink-0"
                :style="slotRowStyle"
              >
                {{ slot.display }}
              </div>

              <div
                v-if="currentTimeLineStyle"
                class="absolute right-1 sm:right-2 z-50 pointer-events-none"
                :style="currentTimeLineStyle"
              >
                <span class="inline-flex items-center rounded px-1 py-0.5 text-[10px] sm:text-xs font-bold tabular-nums text-red-600 bg-white/95 shadow-sm ring-1 ring-red-200">
                  {{ currentTimeLabel }}
                </span>
              </div>
            </div>
          </div>

          <!-- O'ng: shifokor ustunlari -->
          <div class="relative flex flex-1 min-w-0 w-full h-full self-stretch">
            <div
              v-for="(doctor, docIdx) in activeDoctors"
              :key="doctor.id"
              class="doctor-column relative border-r border-gray-100 flex flex-col h-full self-stretch flex-1 basis-0 min-w-[8rem] sm:min-w-[10rem] lg:min-w-[11rem]"
            >
              <!-- Shifokor sarlavhasi -->
              <div class="sticky top-0 z-30 bg-white px-2 sm:px-3 h-14 flex-shrink-0 flex items-center gap-2 border-b border-gray-100">
                <div class="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {{ doctorInitials(doctor) }}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xs sm:text-sm font-bold text-slate-800 truncate" :title="doctor.full_name">{{ doctor.full_name }}</div>
                  <div class="text-[10px] sm:text-xs text-slate-500 font-medium truncate">{{ doctor.specialization || 'Shifokor' }}</div>
                </div>
                <span
                  class="flex-shrink-0 inline-flex items-center justify-center min-w-[1.35rem] h-5 px-1.5 rounded-full text-[10px] font-bold"
                  :class="getAppointmentsForDoctor(doctor.id).length > 0
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-500'"
                  :title="`Bugun: ${getAppointmentsForDoctor(doctor.id).length} bemor`"
                >
                  {{ getAppointmentsForDoctor(doctor.id).length }}
                </span>
              </div>

              <!-- Vaqt katakchalari -->
              <div class="relative flex flex-col flex-1 min-h-0" :style="slotsAreaStyle">
                <div
                  v-for="slot in timeSlots"
                  :key="`bg-${doctor.id}-${slot.time}`"
                  class="border-b border-gray-100 cursor-pointer transition-colors duration-150 bg-white hover:bg-gray-50/80 flex-shrink-0"
                  :class="isDropTarget(doctor.id, slot.time) ? 'bg-primary-50/60' : ''"
                  :style="slotRowStyle"
                  :title="`${doctor.full_name} — ${slot.time}`"
                  @dragover.prevent="onDragOver($event, doctor.id, slot.time)"
                  @dragleave="onDragLeave($event, doctor.id, slot.time)"
                  @drop.prevent="onDrop($event, doctor.id, slot.time)"
                  @click="handleSlotClick(doctor.id, slot.time)"
                />

                <!-- Joriy vaqt chizig'i — uchrashuvlar bilan bir xil konteynerda -->
                <div
                  v-if="currentTimeLineStyle"
                  class="absolute left-0 right-0 z-30 pointer-events-none flex items-center px-0.5"
                  :style="currentTimeLineStyle"
                >
                  <div
                    v-if="docIdx === 0"
                    class="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full flex-shrink-0 shadow-[0_0_4px_rgba(239,68,68,0.6)] ring-2 ring-white"
                  />
                  <div class="flex-1 min-w-0 h-[2px] sm:h-[2.5px] rounded-full bg-red-500 shadow-[0_0_3px_rgba(239,68,68,0.45)]" />
                </div>

              <!-- Uchrashuvlar -->
              <div class="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                  v-for="appt in getAppointmentsForDoctor(doctor.id)"
                  :key="appt.id"
                  class="absolute inset-x-1 pointer-events-auto transition-opacity duration-150 w-[calc(100%-0.5rem)] overflow-hidden"
                  :class="isDraggingId === appt.id ? 'z-40' : 'z-10'"
                  :style="getAppointmentStyle(appt)"
                  draggable="true"
                  @dragstart="onDragStart($event, appt)"
                  @dragend="onDragEnd"
                >
                  <AppointmentBlock
                    :appointment="appt"
                    :slot-height-px="slotHeightPx"
                    :slot-minutes="SLOT_MINUTES"
                    :positioned-by-parent="true"
                    :move-select-active="clickMoveAppointment?.id === appt.id"
                    :is-dragging="isDraggingId === appt.id"
                    @update-status="handleStatusUpdate"
                    @open-payment="handleOpenPayment"
                    @open-patient-modal="handleOpenPatientModal"
                    @open-patient-detail="handleOpenPatientDetail"
                    @toggle-move-select="handleToggleMoveSelect"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
      </div>
    </div>

    <!-- Info: no doctors -->
    <div v-if="activeDoctors.length === 0" class="text-center py-12 text-gray-500">
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
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { isAdminLike } from '@/lib/roles'
import { useDoctorsStore } from '@/stores/doctors'
import { usePatientsStore } from '@/stores/patients'
import { useClinicStore } from '@/stores/clinic'
import {
  buildCalendarTimeSlots,
  minutesToTimeString,
  resolveCalendarMinuteRange,
  timeStringToMinutes,
} from '@/lib/clinicCalendarHours'
import * as visitsApi from '@/api/visitsApi'
import { updateAppointment, getAppointmentsByPatientId } from '@/api/appointmentsApi'
import { getSupabaseClient } from '@/lib/supabaseClient'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { useToast } from '@/composables/useToast'
import AppointmentBlock from './AppointmentBlock.vue'
import PatientModalInfo from './PatientModalInfo.vue'

const props = defineProps({
  selectedDate: {
    type: String,
    required: true
  },
  filterDoctorId: {
    type: [String, Number],
    default: '',
  },
  refreshKey: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:selectedDate', 'update-status', 'open-payment', 'open-patient-detail'])

const { t } = useI18n()
const toast = useToast()
const authStore = useAuthStore()
const isAdmin = computed(() => isAdminLike(authStore))
const doctorsStore = useDoctorsStore()
const patientsStore = usePatientsStore()
const clinicStore = useClinicStore()

const loading = ref(false)
const appointments = ref([])
const patientModalOpen = ref(false)
const selectedPatientAppointment = ref(null)
const scheduleCanvasRef = ref(null)
const canvasHeight = ref(0)
let canvasResizeObserver = null
let scheduleNowInterval = null
const currentDate = ref(props.selectedDate || new Date().toISOString().split('T')[0])
const isDraggingId = ref(null)
const dropHoverTarget = ref(null)
const clickMoveAppointment = ref(null)
const skipNextSlotClick = ref(false)

let realtimeChannel = null
let realtimeReloadTimer = null

const scheduleRealtimeReload = () => {
  if (realtimeReloadTimer) clearTimeout(realtimeReloadTimer)
  realtimeReloadTimer = setTimeout(() => {
    loadAppointments()
  }, 400)
}

const teardownRealtime = () => {
  if (realtimeChannel) {
    getSupabaseClient().removeChannel(realtimeChannel)
    realtimeChannel = null
  }
}

const setupRealtime = async () => {
  teardownRealtime()
  const supabase = getSupabaseClient()
  const date = currentDate.value
  const cid = await getCurrentClinicId()
  const channelName = `doctor-schedule-${date}-${cid || 'all'}`

  const channel = supabase.channel(channelName)

  const visitsFilter = cid
    ? `clinic_id=eq.${cid}`
    : undefined

  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'visits',
      filter: visitsFilter,
    },
    (payload) => {
      const rowDate = payload.new?.date || payload.old?.date
      if (!rowDate || String(rowDate).slice(0, 10) === date) {
        scheduleRealtimeReload()
      }
    }
  )

  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'appointments',
      filter: visitsFilter,
    },
    (payload) => {
      const scheduled = payload.new?.scheduled_at || payload.old?.scheduled_at
      if (!scheduled || String(scheduled).slice(0, 10) === date) {
        scheduleRealtimeReload()
      }
    }
  )

  channel.subscribe()
  realtimeChannel = channel
}

// Responsive breakpoints (mobile, tablet, desktop)
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)

const SLOT_MINUTES = 60
const COLUMN_HEADER_PX = 56
const MIN_SLOT_PX = 52

const calendarMinuteRange = computed(() =>
  resolveCalendarMinuteRange(clinicStore.calendarStartTime, clinicStore.calendarEndTime)
)
const dayStartMinutes = computed(() => calendarMinuteRange.value.startMinutes)
const dayEndMinutes = computed(() => calendarMinuteRange.value.endMinutes)

const timeSlots = computed(() =>
  buildCalendarTimeSlots(
    clinicStore.calendarStartTime,
    clinicStore.calendarEndTime,
    SLOT_MINUTES
  )
)

// Doktor uchun faqat o'z appointmentlari, admin uchun barchasi
// Responsive column widths
const timeColumnWidth = computed(() => {
  if (windowWidth.value < 640) return 'w-[3.25rem]' // 52px — vaqt o'qilishi uchun
  return 'w-[4.5rem]' // 72px
})

/** Vaqt qatorlari balandligi — mavjud ekranni pastigacha to'ldiradi */
const slotsAreaAvailablePx = computed(() => {
  return Math.max(0, canvasHeight.value - COLUMN_HEADER_PX)
})

const slotHeightPx = computed(() => {
  const slotCount = timeSlots.value.length
  if (!slotCount) return MIN_SLOT_PX

  const available = slotsAreaAvailablePx.value
  if (!available) return MIN_SLOT_PX

  const ideal = available / slotCount
  if (ideal < MIN_SLOT_PX) return MIN_SLOT_PX
  return ideal
})

const slotsAreaHeightPx = computed(() => slotHeightPx.value * timeSlots.value.length)

const needsVerticalScroll = computed(() => {
  const available = slotsAreaAvailablePx.value
  return available > 0 && slotsAreaHeightPx.value > available
})

const slotsAreaStyle = computed(() => {
  const height = slotsAreaHeightPx.value
  if (!height) return { flex: '1 1 0%', minHeight: 0 }
  return {
    height: `${height}px`,
    flex: needsVerticalScroll.value ? '0 0 auto' : '1 1 0%',
    minHeight: 0,
  }
})

const slotRowStyle = computed(() => {
  const h = slotHeightPx.value
  return { height: `${h}px`, minHeight: `${h}px`, flex: '0 0 auto' }
})

/** Jadval boshlanishi — birinchi slot vaqti (label bilan mos) */
const gridStartMinutes = computed(() => {
  const firstSlotTime = timeSlots.value[0]?.time
  return timeStringToMinutes(firstSlotTime) ?? dayStartMinutes.value
})

/** Joriy vaqt — uchrashuv kartalari bilan bir xil konteyner va hisob */
const scheduleNow = ref(new Date())

const currentTimeLabel = computed(() => {
  const h = String(scheduleNow.value.getHours()).padStart(2, '0')
  const m = String(scheduleNow.value.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
})

const currentTimeTopPx = computed(() => {
  const nowMinutes = scheduleNow.value.getHours() * 60 + scheduleNow.value.getMinutes()
  const start = gridStartMinutes.value
  const end = dayEndMinutes.value
  if (nowMinutes < start || nowMinutes >= end) return null

  const slotCount = timeSlots.value.length
  const areaHeight = slotsAreaHeightPx.value
  if (!slotCount || !areaHeight) return null

  const minutesFromStart = nowMinutes - start
  const totalGridMinutes = slotCount * SLOT_MINUTES
  return (minutesFromStart / totalGridMinutes) * areaHeight
})

const currentTimeLineStyle = computed(() => {
  const topPx = currentTimeTopPx.value
  if (topPx == null) return null
  return {
    top: `${topPx}px`,
    transform: 'translateY(-50%)',
  }
})

const visibleDoctors = computed(() => {
  const allDoctors = (doctorsStore.items || []).filter((d) => d.is_active !== false)
  if (isAdmin.value) {
    return allDoctors
  }
  const myId = authStore.user?.id
  return allDoctors.filter((d) => Number(d.id) === Number(myId))
})

const activeDoctors = computed(() => {
  if (!props.filterDoctorId) {
    return visibleDoctors.value
  }
  return visibleDoctors.value.filter(
    (d) => String(d.id) === String(props.filterDoctorId)
  )
})

const doctorInitials = (doctor) => {
  const name = doctor?.full_name || ''
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'DR'
}

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

const activeDoctorIdSet = computed(() => new Set(activeDoctors.value.map((doctor) => Number(doctor.id))))

const displayedDayAppointments = computed(() => {
  const idSet = activeDoctorIdSet.value
  return dayAppointments.value.filter((appt) => idSet.has(Number(appt.doctor_id)))
})

const bookedAppointmentsCount = computed(() => displayedDayAppointments.value.length)

const totalSlotsCount = computed(() => activeDoctors.value.length * timeSlots.value.length)

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

// Appointmentlarni yuklash
const loadAppointments = async () => {
  loading.value = true
  try {
    const startDate = currentDate.value
    const endDate = currentDate.value

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
      const startTime = normalizeTimeSlot(visit.start_time)
        || minutesToTimeString(calendarMinuteRange.value.startMinutes)
      const endTime = normalizeTimeSlot(visit.end_time) || addMinutesToTime(startTime, visit.duration_minutes || 60)

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

const getDurationMinutes = (appt) => {
  if (appt.duration_minutes && appt.duration_minutes > 0) return appt.duration_minutes
  if (appt.start_time && appt.end_time) {
    const [sh, sm] = appt.start_time.split(':').map(Number)
    const [eh, em] = appt.end_time.split(':').map(Number)
    return Math.max(15, (eh * 60 + em) - (sh * 60 + sm))
  }
  return 60
}

const normalizeTimeSlot = (timeStr) => {
  if (!timeStr) return ''
  const parts = String(timeStr).split(':')
  const h = Number(parts[0])
  const m = Number(parts[1] || 0)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return ''
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const addMinutesToTime = (timeStr, minutes) => {
  const normalized = normalizeTimeSlot(timeStr)
  if (!normalized) return ''
  const [h, m] = normalized.split(':').map(Number)
  const total = h * 60 + m + minutes
  const nh = Math.floor(total / 60) % 24
  const nm = total % 60
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
}

const patchAppointmentInList = (appointmentId, patch) => {
  const index = appointments.value.findIndex((a) => Number(a.id) === Number(appointmentId))
  if (index === -1) return null
  appointments.value[index] = {
    ...appointments.value[index],
    ...patch,
  }
  return appointments.value[index]
}

const syncLinkedAppointment = async ({
  patientId,
  date,
  previousDoctorId,
  previousStartTime,
  nextStartTime,
  nextDoctorId,
  durationMinutes,
}) => {
  if (!date || !patientId) return

  try {
    const rows = await getAppointmentsByPatientId(patientId)
    const prevStart = normalizeTimeSlot(previousStartTime)
    const scheduledAt = `${date}T${normalizeTimeSlot(nextStartTime)}:00`

    const match = (rows || []).find((row) => {
      if (!row?.scheduled_at) return false
      const rowDate = String(row.scheduled_at).slice(0, 10)
      const rowTime = normalizeTimeSlot(String(row.scheduled_at).slice(11, 19))
      return rowDate === date
        && Number(row.doctor_id) === Number(previousDoctorId)
        && rowTime === prevStart
    })

    if (!match?.id) return

    await updateAppointment(match.id, {
      doctor_id: Number(nextDoctorId),
      scheduled_at: scheduledAt,
      duration_minutes: durationMinutes,
    })
  } catch (syncErr) {
    console.warn('appointments jadvali sinxronlash:', syncErr?.message)
  }
}

const findAppointmentById = (id) =>
  appointments.value.find((a) => Number(a.id) === Number(id))

const isDropTarget = (doctorId, time) =>
  dropHoverTarget.value?.doctorId === Number(doctorId)
  && dropHoverTarget.value?.time === time

const moveAppointmentTo = async (appointment, targetDoctorId, targetTimeSlot) => {
  const appt = typeof appointment === 'object'
    ? findAppointmentById(appointment.id)
    : findAppointmentById(appointment)
  if (!appt) return

  const snapshot = {
    doctor_id: appt.doctor_id,
    doctor_name: appt.doctor_name,
    specialization: appt.specialization,
    start_time: appt.start_time,
    end_time: appt.end_time,
    duration_minutes: appt.duration_minutes,
  }

  const doctor = visibleDoctors.value.find((d) => Number(d.id) === Number(targetDoctorId))
  const duration = getDurationMinutes(appt)
  const nextStart = normalizeTimeSlot(targetTimeSlot || appt.start_time)
  const nextEnd = addMinutesToTime(nextStart, duration)
  if (!nextStart || !nextEnd) return

  const optimisticPatch = {
    doctor_id: Number(targetDoctorId),
    doctor_name: doctor?.full_name || appt.doctor_name,
    specialization: doctor?.specialization || appt.specialization,
    start_time: nextStart,
    end_time: nextEnd,
    duration_minutes: duration,
  }
  patchAppointmentInList(appt.id, optimisticPatch)

  try {
    const updated = await visitsApi.updateVisit(appt.id, {
      doctor_id: optimisticPatch.doctor_id,
      doctor_name: optimisticPatch.doctor_name,
      start_time: nextStart,
      end_time: nextEnd,
      duration_minutes: duration,
    })

    if (updated) {
      patchAppointmentInList(appt.id, {
        doctor_id: updated.doctor_id ?? optimisticPatch.doctor_id,
        doctor_name: updated.doctor_name || optimisticPatch.doctor_name,
        start_time: normalizeTimeSlot(updated.start_time) || nextStart,
        end_time: normalizeTimeSlot(updated.end_time) || nextEnd,
        duration_minutes: updated.duration_minutes || duration,
      })
    }

    await syncLinkedAppointment({
      patientId: appt.patient_id,
      date: appt.date || currentDate.value,
      previousDoctorId: snapshot.doctor_id,
      previousStartTime: snapshot.start_time,
      nextStartTime: nextStart,
      nextDoctorId: optimisticPatch.doctor_id,
      durationMinutes: duration,
    })

    const movedDoctor = Number(snapshot.doctor_id) !== Number(targetDoctorId)
    toast.success(
      movedDoctor
        ? 'Qabul boshqa shifokorga ko\'chirildi'
        : 'Qabul vaqti yangilandi'
    )
  } catch (error) {
    patchAppointmentInList(appt.id, snapshot)
    console.error('Failed to move appointment:', error)
    toast.error('Qabulni ko\'chirishda xatolik yuz berdi')
  }
}

const onDragStart = (event, appt) => {
  if (event.target.closest('button')) {
    event.preventDefault()
    return
  }
  isDraggingId.value = appt.id
  clickMoveAppointment.value = null
  const payload = {
    id: appt.id,
    doctor_id: appt.doctor_id,
    start_time: appt.start_time,
  }
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', JSON.stringify(payload))
  if (event.dataTransfer.setDragImage && event.currentTarget) {
    event.dataTransfer.setDragImage(event.currentTarget, 20, 20)
  }
}

const onDragEnd = () => {
  isDraggingId.value = null
  dropHoverTarget.value = null
}

const onDragOver = (event, doctorId, timeSlot) => {
  event.dataTransfer.dropEffect = 'move'
  dropHoverTarget.value = { doctorId: Number(doctorId), time: timeSlot }
}

const onDragLeave = (event, doctorId, timeSlot) => {
  if (
    dropHoverTarget.value?.doctorId === Number(doctorId)
    && dropHoverTarget.value?.time === timeSlot
  ) {
    dropHoverTarget.value = null
  }
}

const onDrop = async (event, targetDoctorId, targetTimeSlot) => {
  dropHoverTarget.value = null
  isDraggingId.value = null

  let payload = null
  try {
    payload = JSON.parse(event.dataTransfer.getData('text/plain') || '{}')
  } catch {
    payload = null
  }
  if (!payload?.id) return

  const appt = findAppointmentById(payload.id)
  if (!appt) return

  const sameDoctor = Number(appt.doctor_id) === Number(targetDoctorId)
  const sameTime = normalizeTimeSlot(appt.start_time) === normalizeTimeSlot(targetTimeSlot)
  if (sameDoctor && sameTime) return

  skipNextSlotClick.value = true
  await moveAppointmentTo(appt, targetDoctorId, targetTimeSlot)
  setTimeout(() => {
    skipNextSlotClick.value = false
  }, 100)
}

const handleToggleMoveSelect = (appt) => {
  if (clickMoveAppointment.value?.id === appt.id) {
    clickMoveAppointment.value = null
    toast.info('Ko\'chirish bekor qilindi')
    return
  }
  clickMoveAppointment.value = appt
  toast.info('Yangi shifokor yoki vaqt ustuniga bosing (yoki kartochkani ushlab suring)')
}

// Click-to-create yoki click-to-move
const handleSlotClick = (doctorId, timeStr) => {
  if (skipNextSlotClick.value) return
  if (clickMoveAppointment.value) {
    moveAppointmentTo(clickMoveAppointment.value, doctorId, timeStr)
    clickMoveAppointment.value = null
    return
  }
  openNewAppointmentModal(doctorId, timeStr)
}

const openNewAppointmentModal = (doctorId, startTime) => {
  emit('open-payment', null, {
    doctorId,
    startTime,
    date: currentDate.value
  })
}

// To'lov modali ochish
const handleOpenPayment = (appointmentId) => {
  emit('open-payment', appointmentId)
}

// Appointment'ning pixel position'ini hisoblash (start_time va end_time bo'yicha)
const getAppointmentStyle = (appt) => {
  const startTime = normalizeTimeSlot(appt.start_time)
  if (!startTime) return {}

  const hourPx = slotHeightPx.value
  const [startH, startM] = startTime.split(':').map(Number)
  const startTotalMinutes = startH * 60 + startM
  const startMinutesFromDay = startTotalMinutes - gridStartMinutes.value
  const topPx = (startMinutesFromDay / SLOT_MINUTES) * slotHeightPx.value

  let heightPx = hourPx
  const endTime = normalizeTimeSlot(appt.end_time)
  if (endTime) {
    const [endH, endM] = endTime.split(':').map(Number)
    const endTotalMinutes = endH * 60 + endM
    const durationMinutes = endTotalMinutes - startTotalMinutes
    heightPx = Math.max(hourPx * 0.92, (durationMinutes / SLOT_MINUTES) * hourPx - 2)
  } else if (appt.duration_minutes) {
    heightPx = Math.max(hourPx * 0.92, (appt.duration_minutes / SLOT_MINUTES) * hourPx - 2)
  }

  return {
    top: `${Math.max(0, topPx + 1)}px`,
    height: `${heightPx}px`,
    minHeight: `${Math.min(hourPx * 0.92, heightPx)}px`,
    maxHeight: `${heightPx}px`,
  }
}

// Watch current date va view mode
watch(() => currentDate.value, () => {
  loadAppointments()
  setupRealtime()
})

watch(
  () => [clinicStore.calendarStartTime, clinicStore.calendarEndTime],
  () => loadAppointments()
)

const remeasureCanvas = () => {
  if (!scheduleCanvasRef.value) return
  const height = scheduleCanvasRef.value.clientHeight
  if (height > 0) canvasHeight.value = height
}

watch(() => props.refreshKey, () => {
  if (props.refreshKey > 0) {
    loadAppointments()
    nextTick(() => {
      remeasureCanvas()
      requestAnimationFrame(remeasureCanvas)
    })
  }
})

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

watch(
  () => [timeSlots.value.length, slotsAreaAvailablePx.value],
  () => {
    nextTick(() => {
      remeasureCanvas()
      requestAnimationFrame(remeasureCanvas)
    })
  }
)

// Window resize handler for responsive design
const handleWindowResize = () => {
  windowWidth.value = window.innerWidth
  remeasureCanvas()
  requestAnimationFrame(remeasureCanvas)
}

onMounted(async () => {
  if (authStore.userClinicId != null) {
    await clinicStore.loadFromClinicId(authStore.userClinicId)
  }

  loadAppointments()
  setupRealtime()
  if (isAdmin.value) {
    patientsStore.fetchPatients()
  } else if (authStore.user?.id) {
    patientsStore.fetchPatientsByDoctor(authStore.user.id)
  }
  window.addEventListener('resize', handleWindowResize)
  scheduleNow.value = new Date()
  scheduleNowInterval = setInterval(() => {
    scheduleNow.value = new Date()
  }, 60000)

  if (scheduleCanvasRef.value && typeof ResizeObserver !== 'undefined') {
    canvasResizeObserver = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect?.height
      if (height) canvasHeight.value = height
    })
    canvasResizeObserver.observe(scheduleCanvasRef.value)
    remeasureCanvas()
    requestAnimationFrame(remeasureCanvas)
  }

  setTimeout(() => {
    if (scheduleCanvasRef.value && needsVerticalScroll.value) {
      const now = new Date()
      const nowMinutes = now.getHours() * 60 + now.getMinutes()
      const start = gridStartMinutes.value
      const end = dayEndMinutes.value
      const scrollIndex = nowMinutes >= start && nowMinutes < end
        ? Math.floor((nowMinutes - start) / SLOT_MINUTES)
        : 0
      scheduleCanvasRef.value.scrollTop = scrollIndex * slotHeightPx.value
    }
  }, 150)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize)
  canvasResizeObserver?.disconnect()
  if (scheduleNowInterval) clearInterval(scheduleNowInterval)
  if (realtimeReloadTimer) clearTimeout(realtimeReloadTimer)
  teardownRealtime()
})
</script>

<style scoped>
.doctor-schedule-container {
  width: 100%;
  height: 100%;
}

/* Google Calendar-like tweaks */
.day-grid {
  background: #ffffff;
  width: 100%;
  min-width: 100%;
  height: 100%;
}

.doctor-column {
  flex: 1 1 0%;
}

.day-grid .time-column {
  background: #fbfdff; /* very subtle tint */
}

.day-grid .time-column {
  color: #334155;
  font-weight: 700;
}

/* Make appointment blocks flatter and with subtle shadow */
.appointment-block {
  border-width: 0 !important;
  border-left-width: 6px !important;
  border-radius: 6px !important;
  padding: 6px !important;
  overflow: hidden;
}

/* Smaller text for time labels to fit compact layout */
.day-grid .text-xs {
  font-size: 12px;
}

/* Make current time indicator more prominent */
.day-grid :deep(.bg-red-500.rounded-full) {
  min-height: 2px;
}

</style>
