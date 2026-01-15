<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900">Tashriflar Tarixi</h3>
      <span class="text-sm text-gray-500">Jami: {{ visits.length }}</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="visits.length === 0" class="bg-gray-50 rounded-xl p-8 text-center">
      <CalendarDaysIcon class="w-12 h-12 text-gray-300 mx-auto" />
      <p class="mt-4 text-gray-500">Hozircha tashriflar yo'q</p>
    </div>

    <!-- Visits List -->
    <div v-else class="space-y-3">
      <div
        v-for="visit in visits"
        :key="visit.id"
        class="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center"
              :class="visit.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'"
            >
              <CheckCircleIcon v-if="visit.status === 'completed'" class="w-5 h-5 text-green-600" />
              <ClockIcon v-else class="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p class="font-medium text-gray-900">{{ formatDate(visit.date) }}</p>
              <p class="text-sm text-gray-500">{{ visit.doctor_name || 'Doktor belgilanmagan' }}</p>
            </div>
          </div>
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            :class="getStatusClasses(visit.status)"
          >
            {{ getStatusText(visit.status) }}
          </span>
        </div>

        <div v-if="visit.notes" class="mt-3 pt-3 border-t border-gray-100">
          <p class="text-sm text-gray-600">{{ visit.notes }}</p>
        </div>

        <div class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>ID: #{{ visit.id }}</span>
          <span>{{ formatDateTime(visit.created_at) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { CalendarDaysIcon, CheckCircleIcon, ClockIcon } from '@heroicons/vue/24/outline'
import { formatDate, formatDateTime } from '@/lib/date'
import { getVisitStatusBadge } from '@/lib/patientHelpers'
import * as visitsApi from '@/api/visitsApi'

const props = defineProps({
  patient: {
    type: Object,
    required: true
  }
})

const loading = ref(false)
const visits = ref([])

const getStatusClasses = (status) => {
  const badge = getVisitStatusBadge(status)
  return [badge.bgClass, badge.textClass]
}

const getStatusText = (status) => getVisitStatusBadge(status).text

const loadVisits = async () => {
  loading.value = true
  try {
    visits.value = await visitsApi.getVisitsByPatientId(props.patient.id)
  } catch (error) {
    console.error('Failed to load visits:', error)
  } finally {
    loading.value = false
  }
}

onMounted(loadVisits)

watch(() => props.patient.id, loadVisits)
</script>
