<template>
  <div class="relative">
    <select
      :value="selectedHour"
      class="w-full appearance-none px-3 py-2.5 pr-10 text-sm font-mono tabular-nums border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
      @change="onChange"
    >
      <option
        v-for="hour in availableHours"
        :key="hour"
        :value="hour"
      >
        {{ formatHourLabel(hour) }}
      </option>
    </select>
    <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
      <ClockIcon class="w-4 h-4" aria-hidden="true" />
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ClockIcon } from '@heroicons/vue/24/outline'
import { normalizeCalendarTime, timeStringToHour } from '@/lib/clinicCalendarHours'

const props = defineProps({
  /** "08:00" format */
  modelValue: {
    type: String,
    default: '08:00',
  },
  /** Minimal soat (1–24), tugash vaqti uchun */
  minHour: {
    type: Number,
    default: 1,
  },
  /** Maksimal soat (1–24) */
  maxHour: {
    type: Number,
    default: 24,
  },
})

const emit = defineEmits(['update:modelValue'])

const HOURS = Array.from({ length: 24 }, (_, i) => i + 1)

const selectedHour = computed(() => {
  const h = timeStringToHour(props.modelValue)
  if (h != null && h >= 1 && h <= 24) return h
  return Math.min(Math.max(props.minHour, 8), props.maxHour)
})

const availableHours = computed(() =>
  HOURS.filter((h) => h >= props.minHour && h <= props.maxHour)
)

const formatHourLabel = (hour) => `${String(hour).padStart(2, '0')}:00`

const onChange = (event) => {
  const hour = Number(event.target.value)
  if (!Number.isFinite(hour)) return
  emit('update:modelValue', normalizeCalendarTime(`${hour}:00`))
}
</script>
