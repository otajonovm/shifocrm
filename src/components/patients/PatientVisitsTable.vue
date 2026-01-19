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

    <!-- Visits Table -->
    <div v-else class="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Sana
            </th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Doktor
            </th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Xizmat
            </th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Izoh
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="visit in visits"
            :key="visit.id"
            class="hover:bg-gray-50 transition-colors"
          >
            <td class="px-6 py-4">
              <span class="text-sm font-medium text-gray-900">{{ formatDate(visit.date) }}</span>
              <p class="text-xs text-gray-500">{{ formatTime(visit.date) }}</p>
            </td>
            <td class="px-6 py-4">
              <span class="text-sm text-gray-600">{{ visit.doctor_name || 'Doktor belgilanmagan' }}</span>
            </td>
            <td class="px-6 py-4">
              <span class="text-sm text-gray-600">{{ visit.service_name || '-' }}</span>
            </td>
            <td class="px-6 py-4">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="getStatusClasses(visit.status)"
              >
                {{ getStatusText(visit.status) }}
              </span>
            </td>
            <td class="px-6 py-4">
              <span class="text-sm text-gray-600">{{ visit.notes || '-' }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { CalendarDaysIcon } from '@heroicons/vue/24/outline'
import * as visitsApi from '@/api/visitsApi'

const props = defineProps({
  patientId: {
    type: [String, Number],
    required: true,
  },
})

const loading = ref(false)
const visits = ref([])

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
}

const getStatusClasses = (status) => {
  const statusMap = {
    completed: ['bg-green-100', 'text-green-700'],
    pending: ['bg-yellow-100', 'text-yellow-700'],
    cancelled: ['bg-red-100', 'text-red-700'],
  }
  return statusMap[status] || ['bg-gray-100', 'text-gray-700']
}

const getStatusText = (status) => {
  const statusMap = {
    completed: 'Yakunlangan',
    pending: 'Kutilmoqda',
    cancelled: 'Bekor qilingan',
  }
  return statusMap[status] || status
}

const loadVisits = async () => {
  loading.value = true
  try {
    visits.value = await visitsApi.getVisitsByPatientId(props.patientId)
  } catch (error) {
    console.error('Failed to load visits:', error)
    // Fallback: empty array if API doesn't exist yet
    visits.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadVisits)
watch(() => props.patientId, loadVisits)
</script>
