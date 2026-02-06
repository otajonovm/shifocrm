<template>
  <div class="space-y-4 sm:space-y-6 animate-fade-in pb-6 pb-safe">
    <!-- Welcome Banner - Mobile Optimized -->
    <div class="bg-gradient-to-r from-accent-500 to-purple-600 rounded-2xl p-4 sm:p-6 text-white mobile-card">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex-1">
          <h1 class="text-xl sm:text-2xl font-bold">{{ t('doctorDashboard.welcome', { name: doctorName }) }}</h1>
          <p class="text-purple-100 mt-1 text-sm sm:text-base">{{ t('doctorDashboard.welcomeSubtitle') }}</p>
        </div>
        <div class="flex items-center justify-between sm:block sm:text-right">
          <div class="sm:hidden">
            <p class="text-xs text-purple-200">{{ currentDate.split(',')[0] }}</p>
            <p class="text-lg font-bold">{{ currentTime }}</p>
          </div>
          <div class="hidden sm:block">
            <p class="text-sm text-purple-200">{{ currentDate }}</p>
            <p class="text-2xl font-bold">{{ currentTime }}</p>
          </div>
        </div>
      </div>
      
      <!-- Quick Action Buttons - Mobile First -->
      <div class="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        <button
          @click="goToAppointments"
          class="mobile-btn-secondary touch-target-lg text-white border-white/30 hover:bg-white/10 active:scale-95"
        >
          <CalendarDaysIcon class="w-5 h-5 mx-auto mb-1 sm:hidden" />
          <span class="text-xs sm:text-sm">{{ t('doctorDashboard.addAppointment') }}</span>
        </button>
        <button
          @click="goToPlans"
          class="mobile-btn-secondary touch-target-lg text-white border-white/30 hover:bg-white/10 active:scale-95"
        >
          <CheckCircleIcon class="w-5 h-5 mx-auto mb-1 sm:hidden" />
          <span class="text-xs sm:text-sm">{{ t('doctorDashboard.writePlan') }}</span>
        </button>
        <button
          v-if="nextAppointment"
          @click="startAppointment"
          class="col-span-2 sm:col-span-1 mobile-btn-primary touch-target-lg bg-white/20 border-white/30 hover:bg-white/30 active:scale-95"
        >
          <PlayIcon class="w-5 h-5 mx-auto mb-1 sm:hidden" />
          <span class="text-xs sm:text-sm font-semibold">{{ t('doctorDashboard.startAppointment') }}</span>
        </button>
      </div>
    </div>

    <!-- Next Patient Card - Mobile Optimized -->
    <div v-if="nextAppointment" class="mobile-card">
      <div class="flex items-start gap-3 sm:gap-4">
        <div class="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-accent-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl">
          {{ nextAppointment.patientInitials }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs sm:text-sm text-gray-500">{{ nextAppointment.time }} · {{ nextAppointment.date }}</p>
          <p class="text-base sm:text-lg font-semibold text-gray-900 mt-1 truncate">{{ nextAppointment.patientName }}</p>
          <p class="text-xs sm:text-sm text-gray-400 mt-1 line-clamp-2">{{ nextAppointment.reason }}</p>
          <button
            @click="startAppointment"
            class="mt-3 w-full sm:w-auto mobile-btn-primary touch-target-lg"
          >
            <PlayIcon class="w-5 h-5 inline-block mr-2" />
            {{ t('doctorDashboard.startAppointment') }}
          </button>
        </div>
      </div>
    </div>
    <div v-else class="mobile-card text-center py-8">
      <p class="text-sm text-gray-500">{{ t('doctorDashboard.nextPatientEmpty') }}</p>
    </div>

    <!-- Today's Timeline - Mobile Optimized -->
    <div class="mobile-card">
      <div class="pb-4 border-b border-gray-100 mb-4">
        <h2 class="text-base sm:text-lg font-semibold text-gray-900">{{ t('doctorDashboard.todayScheduleTitle') }}</h2>
        <p class="text-xs sm:text-sm text-gray-500 mt-0.5">{{ t('doctorDashboard.todayScheduleSubtitle') }}</p>
      </div>
      <div v-if="todaySchedule.length === 0" class="mobile-empty py-8">
        <p class="text-sm text-gray-500">{{ t('doctorDashboard.todayScheduleEmpty') }}</p>
      </div>
      <div v-else class="space-y-3 sm:space-y-4">
        <div
          v-for="(appointment, index) in todaySchedule"
          :key="appointment.id"
          class="relative flex gap-3 sm:gap-4 pb-3 sm:pb-4 last:pb-0"
        >
          <!-- Timeline line -->
          <div class="flex flex-col items-center flex-shrink-0">
            <div
              class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
              :class="getTimelineColor(appointment.status)"
            />
            <div
              v-if="index < todaySchedule.length - 1"
              class="w-0.5 h-full bg-gray-200 mt-1"
            />
          </div>
          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
              <span class="text-xs sm:text-sm font-medium text-gray-900">{{ appointment.time }}</span>
              <span
                class="mobile-badge text-xs"
                :class="getStatusBadge(appointment.status)"
              >
                {{ appointment.statusLabel }}
              </span>
            </div>
            <p class="text-sm sm:text-base text-gray-900 font-medium mt-1 truncate">{{ appointment.patientName }}</p>
            <p class="text-xs sm:text-sm text-gray-500 mt-0.5 line-clamp-2">{{ appointment.reason }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Card - Mobile First -->
    <div class="mobile-card">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base sm:text-lg font-semibold text-gray-900">{{ t('doctorDashboard.myPatientsTitle') }}</h2>
          <p class="text-xs sm:text-sm text-gray-500 mt-0.5">{{ t('doctorDashboard.myPatientsSubtitle') }}</p>
        </div>
        <div class="text-right">
          <p class="text-2xl sm:text-3xl font-bold text-gray-900">{{ stats.myPatients }}</p>
          <p class="text-xs sm:text-sm text-gray-500 mt-1">
            <span class="text-green-600 font-medium">+{{ stats.newThisWeek }}</span> {{ t('doctorDashboard.thisWeek') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Plans - Mobile Optimized -->
    <div class="mobile-card">
      <div class="pb-4 border-b border-gray-100 mb-4">
        <h2 class="text-base sm:text-lg font-semibold text-gray-900">{{ t('doctorDashboard.todayPlansTitle') }}</h2>
        <p class="text-xs sm:text-sm text-gray-500 mt-0.5">{{ t('doctorDashboard.todayPlansSubtitle') }}</p>
      </div>
      <div v-if="todayPlans.length === 0" class="mobile-empty py-8">
        <p class="text-sm text-gray-500">{{ t('doctorDashboard.noPlans') }}</p>
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="plan in todayPlans"
          :key="plan.id"
          class="rounded-xl border border-gray-100 p-3 sm:p-4 active:bg-gray-50 transition-colors"
        >
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div class="flex-1 min-w-0">
              <p class="text-sm sm:text-base font-semibold text-gray-900 truncate">{{ plan.title }}</p>
              <p class="text-xs sm:text-sm text-gray-600 mt-1">{{ plan.patientName }}</p>
              <p v-if="plan.notes" class="text-xs text-gray-400 mt-1 line-clamp-2">{{ plan.notes }}</p>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <button
                v-if="!plan.visit_id"
                @click="convertPlanToVisit(plan)"
                class="mobile-action-btn text-xs sm:text-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg touch-manipulation"
              >
                {{ t('doctorDashboard.planToVisit') }}
              </button>
              <button
                v-if="plan.status !== 'done'"
                @click="markPlanDone(plan)"
                class="mobile-action-btn text-xs sm:text-sm text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-lg touch-manipulation"
              >
                {{ t('doctorDashboard.planDone') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePatientsStore } from '@/stores/patients'
import { useDoctorsStore } from '@/stores/doctors'
import { getVisitsByDate, getVisitsByDoctorAndDate, getVisitsByDoctorId } from '@/api/visitsApi'
import { getVisitStatusLabel, getVisitStatusColors, getActiveVisitStatuses } from '@/constants/visitStatus'
import { getTodayISO, formatDate } from '@/lib/date'
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  PlayIcon,
} from '@heroicons/vue/24/outline'
import { getPlansByDoctorAndDateRange, updatePlan, updatePlanStatus } from '@/api/treatmentPlansApi'
import { createVisit } from '@/api/visitsApi'

const authStore = useAuthStore()
const router = useRouter()
const patientsStore = usePatientsStore()
const doctorsStore = useDoctorsStore()
const { t } = useI18n()

const doctorName = computed(() => {
  return authStore.user?.full_name || authStore.userEmail?.split('@')[0] || 'Doktor'
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
onUnmounted(() => {
  clearInterval(timeInterval)
})

const stats = ref({
  myPatients: 0,
  newThisWeek: 0,
})

const todaySchedule = ref([])
const upcomingAppointments = ref([])
const todayPlans = ref([])
const nextAppointment = computed(() => upcomingAppointments.value[0] || null)

const toISODate = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().split('T')[0]
}

const formatTime = (value) => {
  if (!value) return '--:--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--:--'
  return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
}

const getInitials = (name) => {
  if (!name) return '--'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('')
}

const getDoctorId = () => {
  if (authStore.user?.id) return authStore.user.id
  if (!authStore.userEmail) return null
  const doctor = doctorsStore.items.find(item => item.email === authStore.userEmail)
  return doctor?.id || null
}

const loadDoctorDashboard = async () => {
  const today = getTodayISO()

  await doctorsStore.fetchAll()
  const doctorId = getDoctorId()

  if (doctorId) {
    await patientsStore.fetchPatientsByDoctor(doctorId)
  } else {
    await patientsStore.fetchPatients()
  }

  let todayVisits = []
  let allVisits = []
  try {
    todayVisits = doctorId
      ? await getVisitsByDoctorAndDate(doctorId, today)
      : await getVisitsByDate(today)
  } catch {
    todayVisits = []
  }

  try {
    allVisits = doctorId
      ? await getVisitsByDoctorId(doctorId)
      : []
  } catch {
    allVisits = []
  }

  const patientMap = new Map(
    patientsStore.items.map(patient => [Number(patient.id), patient])
  )
  const activeStatuses = getActiveVisitStatuses()

  const now = new Date()
  const weekAgo = new Date()
  weekAgo.setDate(now.getDate() - 7)

  stats.value = {
    myPatients: patientsStore.items.length,
    newThisWeek: patientsStore.items.filter(patient => {
      const created = new Date(patient.created_at)
      return !Number.isNaN(created.getTime()) && created >= weekAgo
    }).length,
  }

  todaySchedule.value = todayVisits.map(visit => {
    const patient = patientMap.get(Number(visit.patient_id))
    return {
      id: visit.id,
      time: formatTime(visit.created_at),
      patientName: patient?.full_name || `#${visit.patient_id}`,
      reason: visit.service_name || visit.notes || 'Ko\'rik',
      status: visit.status,
      statusLabel: getVisitStatusLabel(visit.status),
    }
  })

  const upcoming = allVisits
    .filter(visit => {
      const visitDate = visit.date || toISODate(visit.created_at)
      return visitDate && visitDate >= today && activeStatuses.includes(visit.status)
    })
    .sort((a, b) => {
      const aDate = new Date(a.date || a.created_at)
      const bDate = new Date(b.date || b.created_at)
      return aDate - bDate
    })
    .slice(0, 5)

  upcomingAppointments.value = upcoming.map(visit => {
    const patient = patientMap.get(Number(visit.patient_id))
    return {
      id: visit.id,
      patientId: visit.patient_id,
      date: formatDate(visit.date || visit.created_at),
      time: formatTime(visit.created_at),
      patientName: patient?.full_name || `#${visit.patient_id}`,
      patientInitials: getInitials(patient?.full_name),
      reason: visit.service_name || visit.notes || 'Ko\'rik',
    }
  })

  await loadDoctorPlans(doctorId, today, patientMap)
}

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
  loadDoctorDashboard()
})

const getTimelineColor = (status) => {
  const colors = getVisitStatusColors(status)
  return colors.bgClass || 'bg-gray-300'
}

const getStatusBadge = (status) => {
  const colors = getVisitStatusColors(status)
  return `${colors.bgClass} ${colors.textClass}`
}

const loadDoctorPlans = async (doctorId, today, patientMap) => {
  if (!doctorId) {
    todayPlans.value = []
    return
  }
  try {
    const plans = await getPlansByDoctorAndDateRange(doctorId, today, today)
    todayPlans.value = plans.map(plan => ({
      ...plan,
      patientName: patientMap.get(Number(plan.patient_id))?.full_name || `#${plan.patient_id}`
    }))
  } catch (error) {
    console.error('Failed to load doctor plans:', error)
    todayPlans.value = []
  }
}

const convertPlanToVisit = async (plan) => {
  try {
    if (plan.visit_id) {
      return
    }
    const visit = await createVisit({
      patient_id: plan.patient_id,
      doctor_id: plan.doctor_id,
      status: 'pending',
      price: plan.estimated_cost,
      service_name: plan.title,
      notes: plan.notes || 'Davolash rejasidan yaratildi',
      date: plan.planned_date,
      updated_by: plan.doctor_id ? `doctor:${plan.doctor_id}` : 'doctor'
    })
    const updated = await updatePlan(plan.id, { visit_id: visit.id })
    const idx = todayPlans.value.findIndex(item => item.id === plan.id)
    if (idx !== -1) {
      todayPlans.value[idx] = { ...todayPlans.value[idx], ...updated }
    }
  } catch (error) {
    console.error('Failed to convert plan to visit:', error)
  }
}

const markPlanDone = async (plan) => {
  try {
    const updated = await updatePlanStatus(plan.id, 'done')
    const idx = todayPlans.value.findIndex(item => item.id === plan.id)
    if (idx !== -1) {
      todayPlans.value[idx] = { ...todayPlans.value[idx], ...updated }
    }
  } catch (error) {
    console.error('Failed to update plan status:', error)
  }
}

const startAppointment = () => {
  if (nextAppointment.value?.patientId) {
    router.push(`/patients/${nextAppointment.value.patientId}`)
    return
  }
  router.push('/my-appointments')
}

const goToAppointments = () => {
  router.push('/my-appointments')
}

const goToPlans = () => {
  router.push('/treatment-plans')
}
</script>
