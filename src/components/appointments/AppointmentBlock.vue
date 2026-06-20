<template>
  <div
    :class="[blockClasses, appointmentClasses]"
    :style="resolvedBlockStyle"
    :title="`${appointment.patient_name} - ${localStartTime} to ${localEndTime}`"
    @click="handleBlockClick"
  >
    <div class="absolute top-1 right-1 flex items-center gap-1">
      <span
        class="h-2.5 w-2.5 rounded-full shadow-sm ring-1 ring-white"
        :class="statusDotClass"
        :title="getStatusLabel(effectiveStatus)"
      />
    </div>

    <!-- Bemor ismi (click -> patient detail) -->
    <button
      type="button"
      class="font-semibold text-gray-900 truncate w-full text-sm text-left hover:text-primary-700 hover:underline leading-tight pr-5"
      @click.stop="handleOpenPatientDetail"
    >
      {{ appointment.patient_name || 'N/A' }}
    </button>

    <p v-if="appointment.phone" class="mt-0.5 text-[11px] sm:text-xs text-slate-600 truncate pr-4">
      {{ appointment.phone }}
    </p>

    <!-- Vaqt -->
    <div class="mt-1 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-800 tabular-nums">
      <svg class="w-3.5 h-3.5 flex-shrink-0 text-slate-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
      </svg>
      <span class="whitespace-nowrap">{{ localStartTime }} – {{ localEndTime }}</span>
    </div>

    <!-- Compact hint -->
    <div v-if="compactHint" class="mt-1 text-[11px] text-gray-500 line-clamp-1">
      {{ compactHint }}
    </div>

    <!-- Quick actions (show on hover, hidden on small mobile) -->
    <div class="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 flex gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
      <button
        v-if="canStartAppointment"
        @click.stop="handleStartAppointment"
        class="p-0.5 sm:p-1 rounded bg-amber-500 text-white hover:bg-amber-600 text-xs"
        title="Qabulda"
      >
        <svg class="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
      </button>
      <button
        v-if="canCompleteAppointment"
        @click.stop="handleCompleteAppointment"
        class="p-0.5 sm:p-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 text-xs"
        title="Tugadi"
      >
        <svg class="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
      </button>
      <button
        v-if="appointment.status === 'in_progress' || appointment.status === 'completed_paid' || appointment.status === 'completed_debt'"
        @click.stop="handlePaymentModal"
        class="p-0.5 sm:p-1 rounded bg-blue-500 text-white hover:bg-blue-600 text-xs"
        title="To'lov"
      >
        <svg class="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { extractLocalTime, timeStringToMinutes, getTimeDuration } from '@/utils/timezoneUtils'
import { VISIT_STATUSES } from '@/constants/visitStatus'

const props = defineProps({
  appointment: {
    type: Object,
    required: true
  },
  slotHeightPx: {
    type: Number,
    default: 40,
  },
  slotMinutes: {
    type: Number,
    default: 60,
  },
  positionedByParent: {
    type: Boolean,
    default: false
  },
  moveSelectActive: {
    type: Boolean,
    default: false
  },
  isDragging: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update-status',
  'open-payment',
  'open-patient-modal',
  'open-patient-detail',
  'toggle-move-select',
])

const { t } = useI18n()

const translateOrFallback = (key, fallback) => {
  const translated = t(key)
  if (!translated || translated === key) return fallback
  return translated
}

// Extract local time from appointment (handles UTC conversion)
const localStartTime = computed(() => {
  return extractLocalTime(props.appointment.start_time)
})

const localEndTime = computed(() => {
  if (props.appointment.end_time) {
    return extractLocalTime(props.appointment.end_time)
  }
  // Calculate from duration
  const duration = props.appointment.duration_minutes || 60
  const startMin = timeStringToMinutes(localStartTime.value)
  const endMin = startMin + duration
  const endH = Math.floor(endMin / 60)
  const endM = endMin % 60
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
})

// Duration hisoblash: end_time yoki duration_minutes dan
const getDuration = () => {
  if (props.appointment.duration_minutes && props.appointment.duration_minutes > 0) {
    return props.appointment.duration_minutes
  }
  if (props.appointment.end_time && props.appointment.start_time) {
    return getTimeDuration(localStartTime.value, localEndTime.value)
  }
  return 60
}

// Duration (minutlar) -> height (px) o'tkazish
const appointmentHeight = computed(() => {
  const duration = getDuration()
  const minutesPerSlot = Math.max(15, Number(props.slotMinutes) || 60)
  return Math.max(props.slotHeightPx, (duration / minutesPerSlot) * props.slotHeightPx)
})

const blockClasses = computed(() => {
  const base = [
    'appointment-block rounded-lg border border-l-4 p-1.5 sm:p-2 text-xs transition-all duration-150 group w-full min-w-0',
    props.isDragging ? 'opacity-50 cursor-grabbing' : 'cursor-grab',
    props.moveSelectActive ? 'ring-2 ring-primary-500 ring-offset-1 shadow-md scale-[1.02]' : '',
  ].filter(Boolean).join(' ')
  if (props.positionedByParent) {
    return `${base} relative w-full h-full overflow-hidden`
  }
  return `${base} absolute left-0.5 right-0.5`
})

// Block style: top va height
const blockStyle = computed(() => {
  const startMinutes = timeStringToMinutes(localStartTime.value)
  const dayStartMinutes = 9 * 60
  const topOffset = ((startMinutes - dayStartMinutes) / 60) * props.slotHeightPx
  return {
    top: `${topOffset}px`,
    height: `${appointmentHeight.value}px`
  }
})

const resolvedBlockStyle = computed(() => {
  if (props.positionedByParent) {
    return { height: '100%' }
  }
  return blockStyle.value
})

/** Qarz 0 bo'lsa completed_debt ham yashil (to'langan) ko'rinadi */
const effectiveStatus = computed(() => {
  const status = props.appointment.status
  const debt = Number(props.appointment.debt_amount) || 0
  if (status === VISIT_STATUSES.COMPLETED_DEBT && debt <= 0) {
    return VISIT_STATUSES.COMPLETED_PAID
  }
  return status
})

const STATUS_BLOCK_CLASSES = {
  [VISIT_STATUSES.PENDING]: 'bg-blue-50 border-blue-500',
  [VISIT_STATUSES.ARRIVED]: 'bg-amber-50 border-amber-500',
  [VISIT_STATUSES.IN_PROGRESS]: 'bg-violet-50 border-violet-500',
  [VISIT_STATUSES.COMPLETED_PAID]: 'bg-emerald-50 border-emerald-500',
  [VISIT_STATUSES.COMPLETED_DEBT]: 'bg-orange-50 border-orange-500',
  [VISIT_STATUSES.CANCELLED]: 'bg-gray-100 border-gray-400',
  [VISIT_STATUSES.NO_SHOW]: 'bg-rose-50 border-rose-500',
}

const STATUS_DOT_CLASSES = {
  [VISIT_STATUSES.PENDING]: 'bg-blue-500',
  [VISIT_STATUSES.ARRIVED]: 'bg-amber-500',
  [VISIT_STATUSES.IN_PROGRESS]: 'bg-violet-500',
  [VISIT_STATUSES.COMPLETED_PAID]: 'bg-emerald-500',
  [VISIT_STATUSES.COMPLETED_DEBT]: 'bg-orange-500',
  [VISIT_STATUSES.CANCELLED]: 'bg-gray-400',
  [VISIT_STATUSES.NO_SHOW]: 'bg-rose-500',
}

// Faqat status bo'yicha rang (xizmat nomi rangini bosib ketmaydi)
const appointmentClasses = computed(() => {
  return STATUS_BLOCK_CLASSES[effectiveStatus.value] || 'bg-white border-slate-300'
})

const statusDotClass = computed(() => {
  return STATUS_DOT_CLASSES[effectiveStatus.value] || 'bg-slate-400'
})

const compactHint = computed(() => {
  const status = effectiveStatus.value
  if (status === VISIT_STATUSES.COMPLETED_PAID) {
    return translateOrFallback('appointments.paymentPaid', 'To\'langan')
  }
  if (status === VISIT_STATUSES.COMPLETED_DEBT) {
    const debt = Number(props.appointment.debt_amount) || 0
    if (debt > 0) {
      return translateOrFallback('appointments.paymentDebt', 'Qarzdor')
    }
  }
  if (status === VISIT_STATUSES.CANCELLED) {
    return translateOrFallback('appointments.statusCancelled', 'Bekor')
  }
  if (status === VISIT_STATUSES.NO_SHOW) {
    return translateOrFallback('appointments.statusNoShow', 'Kelmadi')
  }
  return props.appointment.service_name || props.appointment.specialization || ''
})

const canStartAppointment = computed(() => {
  return props.appointment.status === 'pending' || props.appointment.status === 'arrived'
})

const canCompleteAppointment = computed(() => {
  return props.appointment.status === 'in_progress'
})

// Utilities
// Utilities
const getStatusLabel = (status) => {
  const statusMap = {
    'pending': translateOrFallback('appointments.statusPending', 'Kutmoqda'),
    'arrived': translateOrFallback('appointments.statusArrived', 'Keldi'),
    'in_progress': translateOrFallback('appointments.statusInProgress', 'Qabulda'),
    'completed_paid': translateOrFallback('appointments.statusCompleted', 'Tugadi'),
    'completed_debt': translateOrFallback('appointments.statusDebt', 'Qarzdor'),
    'cancelled': translateOrFallback('appointments.statusCancelled', 'Bekor qilindi'),
    'no_show': translateOrFallback('appointments.statusNoShow', 'Kelmadi')
  }
  return statusMap[status] || 'N/A'
}

let lastBlockClickAt = 0

const handleBlockClick = () => {
  const now = Date.now()
  if (now - lastBlockClickAt < 350) {
    emit('open-patient-modal', props.appointment)
    lastBlockClickAt = 0
    return
  }
  lastBlockClickAt = now
  emit('toggle-move-select', props.appointment)
}

const handleStartAppointment = () => {
  emit('update-status', {
    appointmentId: props.appointment.id,
    status: 'in_progress'
  })
}

const handleCompleteAppointment = () => {
  emit('update-status', {
    appointmentId: props.appointment.id,
    status: 'completed_paid'
  })
}

const handlePaymentModal = () => {
  emit('open-payment', props.appointment.id)
}

const handleOpenPatientDetail = () => {
  const patientId = Number(props.appointment?.patient_id)
  if (!Number.isFinite(patientId)) return
  emit('open-patient-detail', patientId)
}
</script>

<style scoped>
.appointment-block {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.appointment-block:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>
