<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900">{{ t('patientVisits.title') }}</h3>
      <span class="text-sm text-gray-500">{{ t('patientVisits.total') }}: {{ visits.length }}</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="visits.length === 0" class="bg-gray-50 rounded-xl p-8 text-center">
      <CalendarDaysIcon class="w-12 h-12 text-gray-300 mx-auto" />
      <p class="mt-4 text-gray-500">{{ t('patientVisits.noVisits') }}</p>
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
              <p class="font-medium text-gray-900">{{ formatDate(visit.date || visit.created_at) }}</p>
              <p class="text-sm text-gray-500">{{ visit.doctor_name || t('patientVisits.noDoctor') }}</p>
            </div>
          </div>
          <VisitStatusBadge :status="visit.status" :visit="visit" />
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
import { useI18n } from 'vue-i18n'
import { CalendarDaysIcon } from '@heroicons/vue/24/outline'
import { formatDate, formatDateTime } from '@/lib/date'

const { t } = useI18n()
import VisitStatusBadge from '@/components/ui/VisitStatusBadge.vue'
import * as visitsApi from '@/api/visitsApi'

const props = defineProps({
  patientId: {
    type: [String, Number],
    required: true,
  },
  patient: {
    type: Object,
    default: null,
  },
})

const loading = ref(false)
const visits = ref([])

const loadVisits = async () => {
  loading.value = true
  try {
    const patientId = props.patientId || props.patient?.id
    if (patientId) {
      visits.value = await visitsApi.getVisitsByPatientId(patientId)
    }
  } catch (error) {
    console.error('Failed to load visits:', error)
  } finally {
    loading.value = false
  }
}

onMounted(loadVisits)

watch(() => props.patientId || props.patient?.id, loadVisits)
</script>
