<template>
  <div class="relative z-30 flex-shrink-0 bg-white border-b border-gray-100">
    <!-- Ixcham navigatsiya qatori -->
    <div class="px-3 py-2 sm:px-4 sm:py-2.5 flex items-center gap-2 sm:gap-3 min-h-[44px]">
      <div class="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5 flex-shrink-0">
        <button
          type="button"
          class="p-1.5 rounded-md text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
          @click="shiftPeriod(-1)"
        >
          <ChevronLeftIcon class="w-4 h-4" />
        </button>
        <button
          type="button"
          class="px-2 py-1 text-xs font-bold text-primary-700 bg-white rounded-md shadow-sm border border-primary-100 whitespace-nowrap"
          @click="goToToday"
        >
          {{ t('appointments.today') }}
        </button>
        <button
          type="button"
          class="p-1.5 rounded-md text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
          @click="shiftPeriod(1)"
        >
          <ChevronRightIcon class="w-4 h-4" />
        </button>
      </div>

      <p class="text-sm font-semibold text-slate-900 truncate min-w-0 flex-1" :title="formatDateFull(selectedDate)">
        {{ formatDateLabel(selectedDate) }}
      </p>

      <!-- Filtrlar (R) — o'ng tepa -->
      <button
        ref="filterButtonRef"
        type="button"
        class="relative inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all duration-300 ease-in-out flex-shrink-0 shadow-sm"
        :class="isFilterOpen
          ? 'bg-primary-600 text-white border-primary-600 shadow-primary-200/50'
          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'"
        :aria-expanded="isFilterOpen"
        aria-controls="calendar-filter-panel"
        @click="toggleFilters"
      >
        <FunnelIcon class="w-4 h-4" />
        <span class="whitespace-nowrap">{{ t('appointments.filterTitle') }}</span>
        <span
          v-if="activeFilterCount > 0 && !isFilterOpen"
          class="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white"
        >
          {{ activeFilterCount }}
        </span>
      </button>
    </div>

    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isFilterOpen"
          class="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-4"
        >
          <div class="absolute inset-0 bg-slate-900/40" @click="closeFilters" />

          <div
            id="calendar-filter-panel"
            class="relative z-10 flex max-h-[88dvh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:max-h-[80vh] sm:max-w-md sm:rounded-3xl"
            @click.stop
          >
            <div class="mx-auto mt-2 h-1.5 w-10 rounded-full bg-slate-200 sm:hidden" />

            <div class="flex items-center justify-between px-4 pb-2 pt-3">
              <h2 class="text-lg font-bold text-slate-900">{{ t('appointments.filterTitle') }}</h2>
              <button
                type="button"
                class="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                @click="closeFilters"
              >
                <XMarkIcon class="h-5 w-5" />
              </button>
            </div>

            <div class="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pb-4">
              <section>
                <p class="mb-2 text-xs font-semibold text-slate-500">{{ t('appointments.filterPeriod') }}</p>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    v-for="period in periodOptions"
                    :key="period.value"
                    type="button"
                    class="rounded-2xl px-2 py-3 text-sm font-semibold transition-colors"
                    :class="viewMode === period.value
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600'"
                    @click="emit('view-change', period.value)"
                  >
                    {{ period.label }}
                  </button>
                </div>
              </section>

              <section v-if="viewMode !== 'month'">
                <p class="mb-2 text-xs font-semibold text-slate-500">{{ t('appointments.filterPickDay') }}</p>
                <div class="grid grid-cols-7 gap-1.5">
                  <button
                    v-for="day in weekDays"
                    :key="day.date"
                    type="button"
                    class="flex flex-col items-center rounded-xl px-1 py-2"
                    :class="isSelectedDate(day.date)
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-50 text-slate-600'"
                    @click="selectDate(day.date)"
                  >
                    <span class="text-[10px] font-medium">{{ day.dayName }}</span>
                    <span class="text-sm font-bold">{{ day.dayNum }}</span>
                  </button>
                </div>
              </section>

              <section>
                <div class="relative">
                  <MagnifyingGlassIcon class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    :value="searchQuery"
                    type="search"
                    :placeholder="t('appointments.searchPlaceholder')"
                    class="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                    @input="emit('search-change', $event.target.value)"
                  />
                </div>
              </section>

              <section>
                <p class="mb-2 text-xs font-semibold text-slate-500">{{ t('appointments.filterStatus') }}</p>
                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="rounded-full px-3 py-1.5 text-xs font-semibold"
                    :class="!selectedStatus ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'"
                    @click="emit('status-change', '')"
                  >
                    {{ t('appointments.allStatuses') }}
                  </button>
                  <button
                    v-for="status in statuses"
                    :key="status.value"
                    type="button"
                    class="rounded-full px-3 py-1.5 text-xs font-semibold"
                    :class="selectedStatus === status.value ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'"
                    @click="emit('status-change', status.value)"
                  >
                    {{ status.label }}
                  </button>
                </div>
              </section>

              <section v-if="doctors.length">
                <p class="mb-2 text-xs font-semibold text-slate-500">{{ t('appointments.filterDoctor') }}</p>
                <select
                  :value="String(selectedDoctorId || '')"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                  @change="emit('doctor-change', $event.target.value)"
                >
                  <option value="">{{ t('appointments.allDoctors') }}</option>
                  <option v-for="doctor in doctors" :key="doctor.id" :value="String(doctor.id)">
                    {{ doctor.full_name }}
                  </option>
                </select>
              </section>

              <section>
                <p class="mb-2 text-xs font-semibold text-slate-500">{{ t('appointments.filterService') }}</p>
                <select
                  :value="selectedService"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                  @change="emit('service-change', $event.target.value)"
                >
                  <option value="">{{ t('appointments.allServices') }}</option>
                  <option v-for="service in services" :key="service" :value="service">
                    {{ service }}
                  </option>
                </select>
              </section>

              <section>
                <p class="mb-2 text-xs font-semibold text-slate-500">{{ t('appointments.filterDuration') }}</p>
                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="rounded-full px-3 py-1.5 text-xs font-semibold"
                    :class="!selectedDuration ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'"
                    @click="emit('duration-change', '')"
                  >
                    {{ t('appointments.filterClear') }}
                  </button>
                  <button
                    v-for="min in durationOptions"
                    :key="min"
                    type="button"
                    class="rounded-full px-3 py-1.5 text-xs font-semibold"
                    :class="Number(selectedDuration) === min ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'"
                    @click="emit('duration-change', min)"
                  >
                    {{ t('appointments.filterMinutes', { n: min }) }}
                  </button>
                </div>
              </section>

              <section>
                <p class="mb-2 text-xs font-semibold text-slate-500">{{ t('appointments.filterLayout') }}</p>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    class="rounded-2xl px-3 py-3 text-sm font-semibold"
                    :class="layout === 'list' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'"
                    @click="emit('layout-change', 'list')"
                  >
                    {{ t('appointments.viewList') }}
                  </button>
                  <button
                    type="button"
                    class="rounded-2xl px-3 py-3 text-sm font-semibold"
                    :class="layout === 'schedule' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'"
                    @click="emit('layout-change', 'schedule')"
                  >
                    {{ t('appointments.viewSchedule') }}
                  </button>
                </div>
              </section>
            </div>

            <div class="grid grid-cols-2 gap-2 border-t border-slate-100 p-4">
              <button
                type="button"
                class="rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600"
                @click="clearAllFilters"
              >
                {{ t('appointments.filterClear') }}
              </button>
              <button
                type="button"
                class="rounded-2xl bg-primary-600 py-3 text-sm font-semibold text-white"
                @click="closeFilters"
              >
                {{ t('appointments.filterDone') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'

const { t, locale } = useI18n()

const props = defineProps({
  selectedDate: {
    type: String,
    required: true,
  },
  searchQuery: {
    type: String,
    default: '',
  },
  viewMode: {
    type: String,
    default: 'day',
  },
  layout: {
    type: String,
    default: 'schedule',
  },
  selectedDoctorId: {
    type: [String, Number],
    default: '',
  },
  selectedStatus: {
    type: String,
    default: '',
  },
  selectedService: {
    type: String,
    default: '',
  },
  selectedDuration: {
    type: [String, Number],
    default: '',
  },
  doctors: {
    type: Array,
    default: () => [],
  },
  statuses: {
    type: Array,
    default: () => [],
  },
  services: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  'date-change',
  'search-change',
  'view-change',
  'layout-change',
  'doctor-change',
  'status-change',
  'service-change',
  'duration-change',
  'clear-filters',
])

const isFilterOpen = ref(false)
const filterButtonRef = ref(null)

const periodOptions = computed(() => [
  { value: 'day', label: t('appointments.filterDay') },
  { value: 'week', label: t('appointments.filterWeek') },
  { value: 'month', label: t('appointments.filterMonth') },
])

const openFilters = () => {
  isFilterOpen.value = true
}

const durationOptions = [15, 30, 45, 60, 90, 120]

const activeFilterCount = computed(() => {
  let count = 0
  if (props.searchQuery?.trim()) count += 1
  if (props.selectedStatus) count += 1
  if (props.selectedDoctorId) count += 1
  if (props.selectedService) count += 1
  if (props.selectedDuration) count += 1
  return count
})

const weekDays = computed(() => {
  const current = parseHeaderDate(props.selectedDate)
  if (!current) return []
  const pack = DATE_LOCALE[locale.value] || DATE_LOCALE.uz
  const start = new Date(current)
  if (props.viewMode === 'week') {
    const weekday = (start.getDay() + 6) % 7
    start.setDate(start.getDate() - weekday)
  } else {
    start.setDate(start.getDate() - 3)
  }

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    return {
      date: toDateKey(date),
      dayNum: String(date.getDate()).padStart(2, '0'),
      dayName: pack.days[date.getDay()],
    }
  })
})

const toggleFilters = () => {
  if (isFilterOpen.value) closeFilters()
  else openFilters()
}

const closeFilters = () => {
  isFilterOpen.value = false
}

watch(isFilterOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

const clearAllFilters = () => {
  emit('clear-filters')
}

const isSelectedDate = (date) => date === props.selectedDate

const selectDate = (date) => {
  emit('date-change', date)
}

const shiftPeriod = (dir) => {
  const current = parseHeaderDate(props.selectedDate)
  if (!current) return
  if (props.viewMode === 'week') current.setDate(current.getDate() + dir * 7)
  else if (props.viewMode === 'month') current.setMonth(current.getMonth() + dir)
  else current.setDate(current.getDate() + dir)
  emit('date-change', toDateKey(current))
}

const goToToday = () => {
  emit('date-change', toDateKey(new Date()))
}

const DATE_LOCALE = {
  uz: {
    days: ['Yak', 'Du', 'Se', 'Cho', 'Pay', 'Ju', 'Sha'],
    months: ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'],
    today: 'Bugun',
    yesterday: 'Kecha',
    tomorrow: 'Ertaga',
  },
  ru: {
    days: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    months: ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
    today: 'Сегодня',
    yesterday: 'Вчера',
    tomorrow: 'Завтра',
  },
}

const parseHeaderDate = (dateStr) => {
  if (!dateStr) return null
  const date = new Date(`${dateStr}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

const toDateKey = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const formatDateFull = (dateStr) => {
  const date = parseHeaderDate(dateStr)
  if (!date) return dateStr || ''
  return date.toLocaleDateString(locale.value === 'ru' ? 'ru-RU' : 'uz-UZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const formatDateLabel = (dateStr) => {
  const date = parseHeaderDate(dateStr)
  if (!date) return dateStr || ''

  const pack = DATE_LOCALE[locale.value] || DATE_LOCALE.uz
  const month = pack.months[date.getMonth()]
  const yearSuffix = date.getFullYear() !== new Date().getFullYear() ? ` ${date.getFullYear()}` : ''

  if (props.viewMode === 'month') {
    return `${month}${yearSuffix}`
  }

  if (props.viewMode === 'week') {
    const weekday = (date.getDay() + 6) % 7
    const start = new Date(date)
    start.setDate(date.getDate() - weekday)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return `${start.getDate()}–${end.getDate()} ${month}`
  }

  const short = `${date.getDate()}-${month}`
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const key = toDateKey(date)
  if (key === toDateKey(today)) return `${pack.today}, ${short}`
  if (key === toDateKey(yesterday)) return `${pack.yesterday}, ${short}`
  if (key === toDateKey(tomorrow)) return `${pack.tomorrow}, ${short}`

  return `${pack.days[date.getDay()]}, ${short}${yearSuffix}`
}

const shouldIgnoreHotkey = (event) => {
  const tag = event.target?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (event.target?.isContentEditable) return true
  if (event.ctrlKey || event.metaKey || event.altKey) return true
  return false
}

const handleKeyPress = (event) => {
  if (event.key === 'Escape' && isFilterOpen.value) {
    event.preventDefault()
    closeFilters()
    return
  }

  if (event.key !== 'r' && event.key !== 'R') return
  if (shouldIgnoreHotkey(event)) return

  event.preventDefault()
  if (isFilterOpen.value) {
    closeFilters()
  } else {
    openFilters()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyPress)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.filter-scroll {
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

.filter-scroll::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
</style>
