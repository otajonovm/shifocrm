<template>
  <div class="relative z-30 flex-shrink-0 bg-white border-b border-gray-100">
    <!-- Ixcham navigatsiya qatori -->
    <div class="px-3 py-2 sm:px-4 sm:py-2.5 flex items-center gap-2 sm:gap-3 min-h-[44px]">
      <div class="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5 flex-shrink-0">
        <button
          type="button"
          class="p-1.5 rounded-md text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
          title="Kecha"
          aria-label="Kecha"
          @click="goYesterday"
        >
          <ChevronLeftIcon class="w-4 h-4" />
        </button>
        <button
          type="button"
          class="px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-white rounded-md transition-colors whitespace-nowrap hidden xs:inline"
          @click="goYesterday"
        >
          Kecha
        </button>
        <button
          type="button"
          class="px-2 py-1 text-xs font-bold text-primary-700 bg-white rounded-md shadow-sm border border-primary-100 whitespace-nowrap"
          @click="goToToday"
        >
          Bugun
        </button>
        <button
          type="button"
          class="px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-white rounded-md transition-colors whitespace-nowrap hidden xs:inline"
          @click="goTomorrow"
        >
          Erta
        </button>
        <button
          type="button"
          class="p-1.5 rounded-md text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
          title="Ertaga"
          aria-label="Ertaga"
          @click="goTomorrow"
        >
          <ChevronRightIcon class="w-4 h-4" />
        </button>
      </div>

      <p class="text-sm font-semibold text-slate-900 truncate min-w-0 flex-1">
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
        <span class="whitespace-nowrap">Filtrlar</span>
        <kbd
          class="hidden sm:inline-flex items-center justify-center min-w-[1.25rem] px-1 py-0.5 text-[10px] font-bold rounded border leading-none"
          :class="isFilterOpen ? 'bg-primary-500 border-primary-400 text-white' : 'bg-slate-100 border-slate-200 text-slate-500'"
        >
          R
        </kbd>
        <span
          v-if="activeFilterCount > 0 && !isFilterOpen"
          class="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white"
        >
          {{ activeFilterCount }}
        </span>
      </button>
    </div>

    <Teleport to="body">
      <!-- Fon qoplami (mobil) -->
      <Transition
        enter-active-class="transition-opacity duration-300 ease-in-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-300 ease-in-out"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isFilterOpen"
          class="fixed inset-0 z-[200] bg-slate-900/20 backdrop-blur-[1px] sm:hidden"
          aria-hidden="true"
          @click="closeFilters"
        />
      </Transition>

      <!-- Suzuvchi filtr paneli (body — overflow kesilishini oldini oladi) -->
      <Transition
        enter-active-class="transition-all duration-300 ease-in-out"
        enter-from-class="opacity-0 -translate-y-2 scale-[0.98]"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition-all duration-300 ease-in-out"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 -translate-y-2 scale-[0.98]"
      >
        <div
          v-if="isFilterOpen"
          id="calendar-filter-panel"
          class="fixed z-[201] w-[min(calc(100vw-1rem),22rem)] origin-top-right rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 ring-1 ring-black/5 overflow-hidden"
          :style="filterPanelStyle"
          @click.stop
        >
        <div class="px-3 py-2.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <p class="text-xs font-semibold text-slate-600 uppercase tracking-wide">Filtrlar</p>
          <p class="text-[10px] text-slate-400">Yopish: <kbd class="font-mono">R</kbd> yoki <kbd class="font-mono">Esc</kbd></p>
        </div>

        <div class="overflow-y-auto overscroll-contain px-3 py-3 space-y-3 filter-scroll" :style="filterScrollStyle">
          <!-- Qidiruv -->
          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              :value="searchQuery"
              type="text"
              placeholder="Bemor ismi, telefon..."
              class="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
              @input="emit('search-change', $event.target.value)"
            />
          </div>

          <!-- Status -->
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Status</label>
            <select
              :value="selectedStatus"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 outline-none"
              @change="emit('status-change', $event.target.value)"
            >
              <option value="">Barcha statuslar</option>
              <option v-for="status in statuses" :key="status.value" :value="status.value">
                {{ status.label }}
              </option>
            </select>
          </div>

          <!-- Shifokor -->
          <div v-if="doctors.length">
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Shifokor</label>
            <select
              :value="String(selectedDoctorId || '')"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 outline-none"
              @change="emit('doctor-change', $event.target.value)"
            >
              <option value="">Barcha shifokorlar</option>
              <option v-for="doctor in doctors" :key="doctor.id" :value="String(doctor.id)">
                {{ doctor.full_name }}
              </option>
            </select>
          </div>

          <!-- Xizmat turi -->
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Xizmat turi</label>
            <select
              :value="selectedService"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 outline-none"
              @change="emit('service-change', $event.target.value)"
            >
              <option value="">Barcha xizmatlar</option>
              <option v-for="service in services" :key="service" :value="service">
                {{ service }}
              </option>
            </select>
          </div>

          <!-- Daqiqa ko'rsatkichi -->
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Qabul davomiyligi (daqiqa)</label>
            <select
              :value="String(selectedDuration || '')"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 outline-none"
              @change="emit('duration-change', $event.target.value ? Number($event.target.value) : '')"
            >
              <option value="">Barcha davomiyliklar</option>
              <option v-for="min in durationOptions" :key="min" :value="String(min)">
                {{ min }} daqiqa
              </option>
            </select>
          </div>

          <!-- Hafta stripi -->
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Kun tanlash</label>
            <div class="overflow-x-auto filter-scroll -mx-0.5 px-0.5">
              <div class="flex gap-1.5 pb-0.5">
                <button
                  v-for="(day, idx) in weekDays"
                  :key="idx"
                  type="button"
                  class="flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg min-w-[3rem] transition-all duration-200 flex-shrink-0"
                  :class="isSelectedDate(day.date)
                    ? 'bg-primary-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-300'"
                  @click="selectDate(day.date)"
                >
                  <span class="text-[10px] font-medium leading-none">{{ day.dayName }}</span>
                  <span class="text-sm font-bold leading-tight">{{ day.dayNum }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Ko'rinish -->
          <div class="pt-1 border-t border-slate-100">
            <p class="text-xs font-semibold text-slate-500 mb-1.5">Ko'rinish</p>
            <div class="inline-flex gap-0.5 bg-slate-50 border border-slate-200 rounded-lg p-0.5 w-full">
              <button
                type="button"
                class="flex-1 px-1.5 py-1.5 text-[11px] font-semibold rounded-md transition-all duration-200"
                :class="layout === 'list' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'"
                @click="switchLayout('list')"
              >
                Ro'yxat
              </button>
              <button
                type="button"
                class="flex-1 px-1.5 py-1.5 text-[11px] font-semibold rounded-md transition-all duration-200"
                :class="layout === 'schedule' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'"
                @click="switchLayout('schedule')"
              >
                Jadval
              </button>
            </div>
          </div>

          <button
            v-if="activeFilterCount > 0"
            type="button"
            class="w-full py-2 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-dashed border-slate-200 transition-colors duration-200"
            @click="clearAllFilters"
          >
            Filtrlarni tozalash
          </button>
        </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/vue/24/outline'

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
const filterPanelStyle = ref({ top: '0px', left: '0px', visibility: 'hidden' })
const filterScrollStyle = ref({ maxHeight: '28rem' })

const FILTER_PANEL_WIDTH = 352 // 22rem

const updateFilterPanelPosition = () => {
  const btn = filterButtonRef.value
  if (!btn) return

  const rect = btn.getBoundingClientRect()
  const viewportPadding = 8
  const panelWidth = Math.min(window.innerWidth - viewportPadding * 2, FILTER_PANEL_WIDTH)
  const gap = 6
  let left = rect.right - panelWidth
  left = Math.max(viewportPadding, Math.min(left, window.innerWidth - panelWidth - viewportPadding))

  const top = rect.bottom + gap
  const maxPanelHeight = Math.max(160, window.innerHeight - top - viewportPadding)

  filterPanelStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
    width: `${panelWidth}px`,
    visibility: 'visible',
  }
  filterScrollStyle.value = {
    maxHeight: `${Math.min(maxPanelHeight, 448)}px`,
  }
}

const onFilterViewportChange = () => {
  if (isFilterOpen.value) updateFilterPanelPosition()
}

const openFilters = () => {
  isFilterOpen.value = true
  nextTick(() => {
    updateFilterPanelPosition()
    requestAnimationFrame(updateFilterPanelPosition)
  })
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
  const current = new Date(props.selectedDate)
  if (Number.isNaN(current.getTime())) return []

  const days = []
  for (let i = -2; i <= 4; i++) {
    const date = new Date(current)
    date.setDate(date.getDate() + i)
    days.push({
      date: date.toISOString().split('T')[0],
      dayNum: String(date.getDate()).padStart(2, '0'),
      dayName: ['YAK', 'DSH', 'SSH', 'CHSH', 'PYH', 'JMH', 'SHH'][date.getDay()],
    })
  }
  return days
})

const toggleFilters = () => {
  if (isFilterOpen.value) {
    closeFilters()
  } else {
    openFilters()
  }
}

const closeFilters = () => {
  isFilterOpen.value = false
  filterPanelStyle.value = { top: '0px', left: '0px', visibility: 'hidden' }
}

const switchLayout = (mode) => {
  if (mode === props.layout) return
  closeFilters()
  emit('layout-change', mode)
}

watch(() => props.layout, () => {
  closeFilters()
})

watch(isFilterOpen, (open) => {
  if (open) {
    nextTick(updateFilterPanelPosition)
  }
})

const clearAllFilters = () => {
  emit('clear-filters')
}

const isSelectedDate = (date) => date === props.selectedDate

const selectDate = (date) => {
  emit('date-change', date)
}

const shiftDate = (days) => {
  const current = new Date(props.selectedDate)
  if (Number.isNaN(current.getTime())) return
  current.setDate(current.getDate() + days)
  emit('date-change', current.toISOString().split('T')[0])
}

const goYesterday = () => shiftDate(-1)
const goTomorrow = () => shiftDate(1)

const goToToday = () => {
  emit('date-change', new Date().toISOString().split('T')[0])
}

const formatDateLabel = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(`${dateStr}T12:00:00`)
  if (Number.isNaN(date.getTime())) return dateStr

  const dayNames = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
  const monthNames = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
  return `${date.getDate()}-${monthNames[date.getMonth()]} ${date.getFullYear()}, ${dayNames[date.getDay()]}`
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
  window.addEventListener('resize', onFilterViewportChange)
  window.addEventListener('scroll', onFilterViewportChange, true)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
  window.removeEventListener('resize', onFilterViewportChange)
  window.removeEventListener('scroll', onFilterViewportChange, true)
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
