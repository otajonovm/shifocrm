<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      <!-- Jami Bemorlar -->
      <div class="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-blue-100 text-sm font-medium">Jami Bemorlar</p>
            <p class="text-3xl font-bold mt-1">{{ stats.totalPatients }}</p>
            <p class="text-blue-100 text-sm mt-2">
              <span class="text-green-300">+{{ stats.newPatientsToday }}</span> bugun
            </p>
          </div>
          <div class="p-3 bg-white/20 rounded-xl">
            <UsersIcon class="w-8 h-8" />
          </div>
        </div>
        <div class="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
      </div>

      <!-- Jami Doktorlar -->
      <div class="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-emerald-100 text-sm font-medium">Jami Doktorlar</p>
            <p class="text-3xl font-bold mt-1">{{ stats.totalDoctors }}</p>
            <p class="text-emerald-100 text-sm mt-2">
              <span class="text-green-300">{{ stats.activeDoctors }}</span> faol
            </p>
          </div>
          <div class="p-3 bg-white/20 rounded-xl">
            <UserGroupIcon class="w-8 h-8" />
          </div>
        </div>
        <div class="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
      </div>

      <!-- Bugungi Uchrashuvlar -->
      <div class="relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-purple-100 text-sm font-medium">Bugungi Uchrashuvlar</p>
            <p class="text-3xl font-bold mt-1">{{ stats.todayAppointments }}</p>
            <p class="text-purple-100 text-sm mt-2">
              <span class="text-green-300">{{ stats.completedToday }}</span> yakunlangan
            </p>
          </div>
          <div class="p-3 bg-white/20 rounded-xl">
            <CalendarDaysIcon class="w-8 h-8" />
          </div>
        </div>
        <div class="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
      </div>

      <!-- Kunlik Daromad -->
      <div class="relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-orange-100 text-sm font-medium">Kunlik Daromad</p>
            <p class="text-3xl font-bold mt-1">{{ formatCurrency(stats.dailyRevenue) }}</p>
            <p class="text-orange-100 text-sm mt-2">
              <span class="text-green-300">+12%</span> o'tgan haftaga nisbatan
            </p>
          </div>
          <div class="p-3 bg-white/20 rounded-xl">
            <CurrencyDollarIcon class="w-8 h-8" />
          </div>
        </div>
        <div class="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="flex flex-wrap gap-3">
      <button
        @click="showNewPatientModal = true"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-cyan-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
      >
        <PlusIcon class="w-5 h-5" />
        Yangi Bemor
      </button>
      <button
        @click="showNewAppointmentModal = true"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 hover:scale-[1.02] transition-all"
      >
        <CalendarDaysIcon class="w-5 h-5 text-primary-500" />
        Uchrashuvni Belgilash
      </button>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Today's Appointments Table -->
      <div class="lg:col-span-2 bg-white rounded-2xl shadow-card border border-gray-100">
        <div class="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Bugungi Uchrashuvlar</h2>
            <p class="text-sm text-gray-500">Joriy kun uchun rejalashtirilgan qabullar</p>
          </div>
          <router-link
            to="/appointments"
            class="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Barchasini ko'rish →
          </router-link>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vaqt</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bemor</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Doktor</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amallar</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="appointment in todayAppointments"
                :key="appointment.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4">
                  <span class="text-sm font-medium text-gray-900">{{ appointment.time }}</span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
                      {{ appointment.patientInitials }}
                    </div>
                    <span class="text-sm text-gray-900">{{ appointment.patientName }}</span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-600">{{ appointment.doctorName }}</span>
                </td>
                <td class="px-6 py-4">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getStatusClass(appointment.status)"
                  >
                    {{ appointment.statusLabel }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <button class="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                    <EyeIcon class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="todayAppointments.length === 0" class="p-12 text-center">
          <CalendarDaysIcon class="w-12 h-12 text-gray-300 mx-auto" />
          <p class="mt-4 text-gray-500">Bugun uchun uchrashuvlar yo'q</p>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="bg-white rounded-2xl shadow-card border border-gray-100">
        <div class="p-6 border-b border-gray-100">
          <h2 class="text-lg font-semibold text-gray-900">So'nggi Faoliyat</h2>
          <p class="text-sm text-gray-500">Oxirgi o'zgarishlar</p>
        </div>
        <div class="p-6 space-y-4">
          <div
            v-for="activity in recentActivities"
            :key="activity.id"
            class="flex items-start gap-3"
          >
            <div
              class="p-2 rounded-lg"
              :class="activity.iconBg"
            >
              <component :is="activity.icon" class="w-4 h-4" :class="activity.iconColor" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-900">{{ activity.title }}</p>
              <p class="text-xs text-gray-500">{{ activity.time }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {
  UsersIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  PlusIcon,
  EyeIcon,
  UserPlusIcon,
  CheckCircleIcon,
} from '@heroicons/vue/24/outline'

const showNewPatientModal = ref(false)
const showNewAppointmentModal = ref(false)

// Mock data - replace with actual store data
const stats = ref({
  totalPatients: 1248,
  newPatientsToday: 12,
  totalDoctors: 24,
  activeDoctors: 18,
  todayAppointments: 45,
  completedToday: 28,
  dailyRevenue: 15500000,
})

const todayAppointments = ref([
  {
    id: 1,
    time: '09:00',
    patientName: 'Abdullayev Jasur',
    patientInitials: 'AJ',
    doctorName: 'Dr. Karimov',
    status: 'completed',
    statusLabel: 'Yakunlangan',
  },
  {
    id: 2,
    time: '10:30',
    patientName: 'Rahimova Nilufar',
    patientInitials: 'RN',
    doctorName: 'Dr. Usmonov',
    status: 'in-progress',
    statusLabel: 'Jarayonda',
  },
  {
    id: 3,
    time: '11:00',
    patientName: 'Toshmatov Bekzod',
    patientInitials: 'TB',
    doctorName: 'Dr. Karimov',
    status: 'scheduled',
    statusLabel: 'Rejalashtirilgan',
  },
  {
    id: 4,
    time: '14:00',
    patientName: 'Saidova Madina',
    patientInitials: 'SM',
    doctorName: 'Dr. Aliyeva',
    status: 'scheduled',
    statusLabel: 'Rejalashtirilgan',
  },
])

const recentActivities = ref([
  {
    id: 1,
    title: 'Yangi bemor ro\'yxatdan o\'tdi',
    time: '5 daqiqa oldin',
    icon: UserPlusIcon,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 2,
    title: 'Uchrashuv yakunlandi',
    time: '15 daqiqa oldin',
    icon: CheckCircleIcon,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    id: 3,
    title: 'To\'lov qabul qilindi',
    time: '1 soat oldin',
    icon: CurrencyDollarIcon,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
])

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m'
}

const getStatusClass = (status) => {
  const classes = {
    completed: 'bg-green-100 text-green-700',
    'in-progress': 'bg-blue-100 text-blue-700',
    scheduled: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  return classes[status] || classes.scheduled
}
</script>
