<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Welcome Banner -->
    <div class="bg-gradient-to-r from-accent-500 to-purple-600 rounded-2xl p-6 text-white">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">Xush kelibsiz, {{ doctorName }}!</h1>
          <p class="text-purple-100 mt-1">Bugungi jadvalingizni ko'rib chiqing</p>
        </div>
        <div class="hidden sm:block">
          <p class="text-sm text-purple-200">{{ currentDate }}</p>
          <p class="text-2xl font-bold">{{ currentTime }}</p>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
      <!-- Mening Bemorlarim -->
      <div class="bg-white rounded-2xl p-6 shadow-card border border-gray-100 hover:shadow-card-hover transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm font-medium">Mening Bemorlarim</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats.myPatients }}</p>
            <p class="text-sm text-gray-500 mt-2">
              <span class="text-green-600">+{{ stats.newThisWeek }}</span> shu hafta
            </p>
          </div>
          <div class="p-3 bg-blue-100 rounded-xl">
            <UsersIcon class="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      <!-- Bugungi Uchrashuvlarim -->
      <div class="bg-white rounded-2xl p-6 shadow-card border border-gray-100 hover:shadow-card-hover transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm font-medium">Bugungi Uchrashuvlarim</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats.todayAppointments }}</p>
            <p class="text-sm text-gray-500 mt-2">
              <span class="text-purple-600">{{ stats.remaining }}</span> qoldi
            </p>
          </div>
          <div class="p-3 bg-purple-100 rounded-xl">
            <CalendarDaysIcon class="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      <!-- Yakunlangan Ko'riklar -->
      <div class="bg-white rounded-2xl p-6 shadow-card border border-gray-100 hover:shadow-card-hover transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm font-medium">Yakunlangan Ko'riklar</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats.completed }}</p>
            <p class="text-sm text-gray-500 mt-2">
              Shu oy: <span class="text-green-600">{{ stats.completedThisMonth }}</span>
            </p>
          </div>
          <div class="p-3 bg-green-100 rounded-xl">
            <CheckCircleIcon class="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Action -->
    <div>
      <button
        @click="startAppointment"
        class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-500 to-purple-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
      >
        <PlayIcon class="w-5 h-5" />
        Bemor Qabul Qilish
      </button>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Today's Timeline -->
      <div class="bg-white rounded-2xl shadow-card border border-gray-100">
        <div class="p-6 border-b border-gray-100">
          <h2 class="text-lg font-semibold text-gray-900">Bugungi Jadval</h2>
          <p class="text-sm text-gray-500">Vaqt bo'yicha uchrashuvlar</p>
        </div>
        <div class="p-6 space-y-4">
          <div
            v-for="(appointment, index) in todaySchedule"
            :key="appointment.id"
            class="relative flex gap-4"
          >
            <!-- Timeline line -->
            <div class="flex flex-col items-center">
              <div
                class="w-3 h-3 rounded-full"
                :class="getTimelineColor(appointment.status)"
              />
              <div
                v-if="index < todaySchedule.length - 1"
                class="w-0.5 h-full bg-gray-200 mt-1"
              />
            </div>
            <!-- Content -->
            <div class="flex-1 pb-4">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-900">{{ appointment.time }}</span>
                <span
                  class="text-xs px-2 py-0.5 rounded-full"
                  :class="getStatusBadge(appointment.status)"
                >
                  {{ appointment.statusLabel }}
                </span>
              </div>
              <p class="text-sm text-gray-600 mt-1">{{ appointment.patientName }}</p>
              <p class="text-xs text-gray-400">{{ appointment.reason }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Upcoming Appointments -->
      <div class="lg:col-span-2 bg-white rounded-2xl shadow-card border border-gray-100">
        <div class="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Keyingi Uchrashuvlar</h2>
            <p class="text-sm text-gray-500">Kelasi kunlar uchun rejalashtirilgan</p>
          </div>
          <router-link
            to="/my-appointments"
            class="text-sm text-accent-600 hover:text-accent-700 font-medium"
          >
            Barchasini ko'rish →
          </router-link>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sana</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vaqt</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Bemor</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sabab</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amallar</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="appointment in upcomingAppointments"
                :key="appointment.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4">
                  <span class="text-sm font-medium text-gray-900">{{ appointment.date }}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-600">{{ appointment.time }}</span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center text-accent-600 font-semibold text-sm">
                      {{ appointment.patientInitials }}
                    </div>
                    <span class="text-sm text-gray-900">{{ appointment.patientName }}</span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-600">{{ appointment.reason }}</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <button class="p-2 text-gray-400 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors">
                    <EyeIcon class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="upcomingAppointments.length === 0" class="p-12 text-center">
          <CalendarDaysIcon class="w-12 h-12 text-gray-300 mx-auto" />
          <p class="mt-4 text-gray-500">Keyingi uchrashuvlar yo'q</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  UsersIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  PlayIcon,
  EyeIcon,
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()

const doctorName = computed(() => {
  return authStore.userEmail?.split('@')[0] || 'Doktor'
})

const currentDate = ref('')
const currentTime = ref('')

const updateTime = () => {
  const now = new Date()
  currentDate.value = now.toLocaleDateString('uz-UZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  currentTime.value = now.toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

let timeInterval
onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  clearInterval(timeInterval)
})

// Mock data
const stats = ref({
  myPatients: 86,
  newThisWeek: 5,
  todayAppointments: 8,
  remaining: 5,
  completed: 3,
  completedThisMonth: 124,
})

const todaySchedule = ref([
  { id: 1, time: '09:00', patientName: 'Aliyev Sardor', reason: 'Tekshiruv', status: 'completed', statusLabel: 'Yakunlangan' },
  { id: 2, time: '10:00', patientName: 'Karimova Zebo', reason: 'Konsultatsiya', status: 'completed', statusLabel: 'Yakunlangan' },
  { id: 3, time: '11:00', patientName: 'Rahimov Bobur', reason: 'Davolash', status: 'in-progress', statusLabel: 'Jarayonda' },
  { id: 4, time: '14:00', patientName: 'Saidova Dilnoza', reason: 'Tekshiruv', status: 'scheduled', statusLabel: 'Kutilmoqda' },
  { id: 5, time: '15:00', patientName: 'Toshmatov Aziz', reason: 'Takroriy ko\'rik', status: 'scheduled', statusLabel: 'Kutilmoqda' },
])

const upcomingAppointments = ref([
  { id: 1, date: 'Ertaga', time: '09:30', patientName: 'Usmonov Jahongir', patientInitials: 'UJ', reason: 'Tekshiruv' },
  { id: 2, date: 'Ertaga', time: '11:00', patientName: 'Ergasheva Malika', patientInitials: 'EM', reason: 'Konsultatsiya' },
  { id: 3, date: '17-yanvar', time: '10:00', patientName: 'Qodirov Bekzod', patientInitials: 'QB', reason: 'Davolash' },
])

const getTimelineColor = (status) => {
  const colors = {
    completed: 'bg-green-500',
    'in-progress': 'bg-blue-500',
    scheduled: 'bg-gray-300',
  }
  return colors[status] || colors.scheduled
}

const getStatusBadge = (status) => {
  const classes = {
    completed: 'bg-green-100 text-green-700',
    'in-progress': 'bg-blue-100 text-blue-700',
    scheduled: 'bg-gray-100 text-gray-600',
  }
  return classes[status] || classes.scheduled
}

const startAppointment = () => {
  // Navigate to appointment or open modal
  console.log('Starting appointment...')
}
</script>
