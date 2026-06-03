<template>
  <!-- Sticky Header Container -->
  <div class="sticky top-0 z-30 bg-white border-b border-slate-200">
    <div class="px-4 py-4 sm:px-6">
      <!-- DESKTOP: Single Row Layout -->
      <div class="hidden lg:flex items-center justify-between gap-4 flex-wrap">
        <!-- 1. WEEKLY CALENDAR STRIP (Left) -->
        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 min-w-0">
          <button
            v-for="(day, idx) in weekDays"
            :key="idx"
            @click="selectDate(day.date)"
            :class="[
              'flex flex-col items-center justify-center px-3 py-2 rounded-lg min-w-max transition-all duration-200 flex-shrink-0',
              isSelectedDate(day.date)
                ? 'bg-blue-600 text-white font-semibold scale-105 shadow-md'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            ]"
          >
            <span class="text-xs font-medium">{{ day.dayName }}</span>
            <span class="text-sm font-semibold">{{ day.dayNum }}</span>
          </button>
        </div>

        <!-- 2. SEARCH & FILTERS (Center) -->
        <div class="flex items-center gap-2 flex-1 max-w-2xl">
          <!-- Search Input -->
          <div class="relative flex-1">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              :value="searchQuery"
              @input="emit('search-change', $event.target.value)"
              type="text"
              placeholder="Bemor ismi, telefon..."
              class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <!-- Status Filter -->
          <select
            :value="selectedStatus"
            @change="emit('status-change', $event.target.value)"
            class="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
          >
            <option value="">Barcha</option>
            <option v-for="status in statuses" :key="status.value" :value="status.value">
              {{ status.label }}
            </option>
          </select>
        </div>

        <!-- 3. CONTROLS BLOCK (Right) -->
        <div class="flex items-center gap-3 flex-shrink-0">
          <!-- Navigation + View Mode Segmented Control -->
          <div class="inline-flex items-center gap-2 bg-slate-100 rounded-lg p-1">
            <button
              @click="navigateDate(-1)"
              class="p-1.5 hover:bg-slate-200 rounded transition-colors"
              title="Oldingi"
            >
              <svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              @click="goToToday"
              class="px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded transition-colors"
            >
              Bugun
            </button>
            <button
              @click="navigateDate(1)"
              class="p-1.5 hover:bg-slate-200 rounded transition-colors"
              title="Keyingi"
            >
              <svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <!-- View Mode Toggle: Day/Week/Month -->
          <div class="inline-flex gap-1.5 bg-slate-100 rounded-lg p-1">
            <button
              @click="emit('view-change', 'day')"
              :class="[
                'px-2 py-1 text-xs font-semibold rounded transition-all',
                viewMode === 'day'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-white hover:bg-opacity-50'
              ]"
            >
              Kun
            </button>
            <button
              @click="emit('view-change', 'week')"
              :class="[
                'px-2 py-1 text-xs font-semibold rounded transition-all',
                viewMode === 'week'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-white hover:bg-opacity-50'
              ]"
            >
              Hafta
            </button>
            <button
              @click="emit('view-change', 'month')"
              :class="[
                'px-2 py-1 text-xs font-semibold rounded transition-all',
                viewMode === 'month'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-white hover:bg-opacity-50'
              ]"
            >
              Oy
            </button>
          </div>

          <!-- Layout Toggle: List/Schedule -->
          <div class="inline-flex gap-1.5 bg-slate-100 rounded-lg p-1">
            <button
              @click="emit('layout-change', 'list')"
              :class="[
                'px-2 py-1 text-xs font-semibold rounded transition-all',
                layout === 'list'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-white hover:bg-opacity-50'
              ]"
            >
              Ro'yxat
            </button>
            <button
              @click="emit('layout-change', 'schedule')"
              :class="[
                'px-2 py-1 text-xs font-semibold rounded transition-all',
                layout === 'schedule'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-white hover:bg-opacity-50'
              ]"
            >
              Jadval
            </button>
          </div>

          <!-- Doctors Filter Chips (small) -->
          <div class="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-xs">
            <button
              @click="emit('doctor-change', '')"
              :class="[
                'px-2 py-1 text-xs font-medium rounded-full transition-all flex-shrink-0',
                selectedDoctorId === ''
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              ]"
            >
              Barcha
            </button>
            <button
              v-for="doctor in doctors"
              :key="doctor.id"
              @click="emit('doctor-change', doctor.id)"
              :class="[
                'px-2 py-1 text-xs font-medium rounded-full transition-all whitespace-nowrap flex-shrink-0',
                selectedDoctorId === doctor.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              ]"
            >
              {{ doctor.full_name?.split(' ')[0] || 'Dr.' }}
            </button>
          </div>
        </div>
      </div>

      <!-- MOBILE: Collapsible Filters -->
      <div class="lg:hidden space-y-3">
        <!-- Mobile Top Bar -->
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <p class="text-sm font-semibold text-slate-900">
              {{ formatDateMobile(selectedDate) }}
            </p>
          </div>
          <button
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            class="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium text-slate-700"
          >
            <svg v-if="!isMobileMenuOpen" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>{{ isMobileMenuOpen ? 'Yopish' : 'Filtrlash' }}</span>
          </button>
        </div>

        <!-- Mobile Expanded Filters -->
        <transition name="slide-down">
          <div v-if="isMobileMenuOpen" class="space-y-3 pt-2">
            <!-- Search Input -->
            <div class="relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                :value="searchQuery"
                @input="emit('search-change', $event.target.value)"
                type="text"
                placeholder="Bemor ismi, telefon..."
                class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <!-- Status Filter -->
            <select
              :value="selectedStatus"
              @change="emit('status-change', $event.target.value)"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
            >
              <option value="">Barcha statuslar</option>
              <option v-for="status in statuses" :key="status.value" :value="status.value">
                {{ status.label }}
              </option>
            </select>

            <!-- Weekly Calendar Strip (Horizontal Scroll) -->
            <div class="overflow-x-auto no-scrollbar -mx-4 px-4">
              <div class="flex gap-2 pb-2">
                <button
                  v-for="(day, idx) in weekDays"
                  :key="idx"
                  @click="selectDate(day.date)"
                  :class="[
                    'flex flex-col items-center justify-center px-3 py-2 rounded-lg min-w-max transition-all duration-200 flex-shrink-0',
                    isSelectedDate(day.date)
                      ? 'bg-blue-600 text-white font-semibold scale-105 shadow-md'
                      : 'bg-slate-50 text-slate-600'
                  ]"
                >
                  <span class="text-xs font-medium">{{ day.dayName }}</span>
                  <span class="text-sm font-semibold">{{ day.dayNum }}</span>
                </button>
              </div>
            </div>

            <!-- Navigation Buttons -->
            <div class="flex items-center justify-center gap-2 bg-slate-100 rounded-lg p-2">
              <button
                @click="navigateDate(-1)"
                class="p-1.5 hover:bg-slate-200 rounded transition-colors"
              >
                <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button @click="goToToday" class="px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded transition-colors">
                Bugun
              </button>
              <button
                @click="navigateDate(1)"
                class="p-1.5 hover:bg-slate-200 rounded transition-colors"
              >
                <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <!-- View Mode Toggles -->
            <div class="space-y-2">
              <div class="text-xs font-semibold text-slate-600 px-1">Kun tanlang</div>
              <div class="grid grid-cols-3 gap-2">
                <button
                  @click="emit('view-change', 'day')"
                  :class="[
                    'px-2 py-2 text-xs font-semibold rounded transition-all',
                    viewMode === 'day'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-slate-100 text-slate-600'
                  ]"
                >
                  Kun
                </button>
                <button
                  @click="emit('view-change', 'week')"
                  :class="[
                    'px-2 py-2 text-xs font-semibold rounded transition-all',
                    viewMode === 'week'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-slate-100 text-slate-600'
                  ]"
                >
                  Hafta
                </button>
                <button
                  @click="emit('view-change', 'month')"
                  :class="[
                    'px-2 py-2 text-xs font-semibold rounded transition-all',
                    viewMode === 'month'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-slate-100 text-slate-600'
                  ]"
                >
                  Oy
                </button>
              </div>
            </div>

            <!-- Layout Toggles -->
            <div class="space-y-2">
              <div class="text-xs font-semibold text-slate-600 px-1">Ko'rinish</div>
              <div class="grid grid-cols-2 gap-2">
                <button
                  @click="emit('layout-change', 'list')"
                  :class="[
                    'px-2 py-2 text-xs font-semibold rounded transition-all',
                    layout === 'list'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-slate-100 text-slate-600'
                  ]"
                >
                  Ro'yxat
                </button>
                <button
                  @click="emit('layout-change', 'schedule')"
                  :class="[
                    'px-2 py-2 text-xs font-semibold rounded transition-all',
                    layout === 'schedule'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-slate-100 text-slate-600'
                  ]"
                >
                  Jadval
                </button>
              </div>
            </div>

            <!-- Doctors Filter -->
            <div class="space-y-2">
              <div class="text-xs font-semibold text-slate-600 px-1">Shifokor</div>
              <div class="flex flex-wrap gap-2">
                <button
                  @click="emit('doctor-change', '')"
                  :class="[
                    'px-2.5 py-1 text-xs font-medium rounded-full transition-all',
                    selectedDoctorId === ''
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-slate-100 text-slate-600'
                  ]"
                >
                  Hammasi
                </button>
                <button
                  v-for="doctor in doctors"
                  :key="doctor.id"
                  @click="emit('doctor-change', doctor.id)"
                  :class="[
                    'px-2.5 py-1 text-xs font-medium rounded-full transition-all',
                    selectedDoctorId === doctor.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-slate-100 text-slate-600'
                  ]"
                >
                  {{ doctor.full_name?.split(' ')[0] || 'Dr.' }}
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  selectedDate: {
    type: String,
    required: true
  },
  searchQuery: {
    type: String,
    default: ''
  },
  viewMode: {
    type: String,
    enum: ['day', 'week', 'month'],
    default: 'week'
  },
  layout: {
    type: String,
    enum: ['list', 'schedule'],
    default: 'list'
  },
  selectedDoctorId: {
    type: [String, Number],
    default: ''
  },
  selectedStatus: {
    type: String,
    default: ''
  },
  doctors: {
    type: Array,
    default: () => []
  },
  statuses: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'date-change',
  'search-change',
  'view-change',
  'layout-change',
  'doctor-change',
  'status-change'
])

const isMobileMenuOpen = ref(false)

// Generate weekly calendar strip
const weekDays = computed(() => {
  const current = new Date(props.selectedDate)
  if (isNaN(current.getTime())) return []

  const days = []
  for (let i = -2; i <= 4; i++) {
    const date = new Date(current)
    date.setDate(date.getDate() + i)

    const dayNum = String(date.getDate()).padStart(2, '0')
    const dayName = ['DSH', 'SSH', 'CHSH', 'PYH', 'JMH', 'SHH', 'YAK'][date.getDay()]
    const isoDate = date.toISOString().split('T')[0]

    days.push({
      date: isoDate,
      dayNum,
      dayName
    })
  }
  return days
})

// Check if date is selected
const isSelectedDate = (date) => {
  return date === props.selectedDate
}

// Select specific date
const selectDate = (date) => {
  emit('date-change', date)
  isMobileMenuOpen.value = false
}

// Navigate dates
const navigateDate = (direction) => {
  const current = new Date(props.selectedDate)
  if (isNaN(current.getTime())) return

  const shift = direction * (props.viewMode === 'month' ? 30 : 1)
  current.setDate(current.getDate() + shift)

  const isoDate = current.toISOString().split('T')[0]
  emit('date-change', isoDate)
}

// Go to today
const goToToday = () => {
  const today = new Date().toISOString().split('T')[0]
  emit('date-change', today)
}

// Format date for mobile header
const formatDateMobile = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr

  const dayNames = ['Yak', 'DSH', 'SSH', 'CHSH', 'PYH', 'JMH', 'SHH']
  const monthNames = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']

  const day = String(date.getDate()).padStart(2, '0')
  const month = monthNames[date.getMonth()]
  const year = date.getFullYear()
  const dayName = dayNames[date.getDay()]

  return `${year}-yil ${day}-${month}, ${dayName}`
}
</script>

<style scoped>
/* Hide scrollbar but keep functionality */
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

/* Transition animations */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Focus styles */
input:focus {
  outline: none;
}

/* Smooth transitions */
button {
  transition: all 0.2s ease;
}
</style>
