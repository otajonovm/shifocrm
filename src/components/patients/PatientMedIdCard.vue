<template>
  <div class="bg-gradient-to-br from-primary-50 to-cyan-50 rounded-2xl p-6 border border-primary-100">
    <div class="flex items-start justify-between mb-6">
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
          {{ initials }}
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-900">{{ patient.full_name }}</h2>
          <div class="flex items-center gap-2 mt-1">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="[statusBadge.bgClass, statusBadge.textClass]"
            >
              {{ statusBadge.text }}
            </span>
            <div class="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
              <span class="text-xs text-gray-500">{{ t('patientMedId.medId') }}</span>
              <span class="font-mono font-semibold text-primary-600">{{ medId }}</span>
              <button
                @click="copyMedId"
                class="p-0.5 text-gray-400 hover:text-primary-600 transition-colors"
                :title="t('patientMedId.copy')"
              >
                <ClipboardDocumentIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Info Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- Telefon -->
      <div class="bg-white rounded-xl p-4 border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">{{ t('patientMedId.phone') }}</p>
            <a
              :href="`tel:${patient.phone}`"
              class="text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors"
            >
              {{ formattedPhone }}
            </a>
          </div>
          <button
            @click="copyPhone"
            class="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            :title="t('patientMedId.copy')"
          >
            <ClipboardDocumentIcon class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Tug'ilgan sana + Yosh -->
      <div class="bg-white rounded-xl p-4 border border-gray-100">
        <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">{{ t('patientMedId.birthDate') }}</p>
        <p class="text-sm font-medium text-gray-900">
          {{ formattedBirthDate }}
          <span v-if="age !== null" class="text-gray-500 ml-1">({{ age }} {{ t('patientMedId.age') }})</span>
        </p>
      </div>

      <!-- Jinsi -->
      <div class="bg-white rounded-xl p-4 border border-gray-100">
        <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">{{ t('patientMedId.gender') }}</p>
        <p class="text-sm font-medium text-gray-900">{{ formattedGender }}</p>
      </div>

      <!-- Manzil -->
      <div class="bg-white rounded-xl p-4 border border-gray-100">
        <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">{{ t('patientMedId.address') }}</p>
        <p class="text-sm font-medium text-gray-900">{{ patient.address || '-' }}</p>
      </div>

      <!-- Doktor (faqat admin uchun) -->
      <div v-if="isAdmin" class="bg-white rounded-xl p-4 border border-gray-100">
        <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">{{ t('patientMedId.assignedDoctor') }}</p>
        <p class="text-sm font-medium text-gray-900">{{ patient.doctor_name || '-' }}</p>
      </div>

      <!-- Oxirgi tashrif -->
      <div class="bg-white rounded-xl p-4 border border-gray-100">
        <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">Oxirgi Tashrif</p>
        <p class="text-sm font-medium text-gray-900">{{ formattedLastVisit }}</p>
      </div>
    </div>

    <!-- Notes -->
    <div v-if="patient.notes" class="mt-4 bg-white rounded-xl p-4 border border-gray-100">
      <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">Izohlar</p>
      <p class="text-sm text-gray-700">{{ patient.notes }}</p>
    </div>

    <!-- Yakunlash tugmasi - yakka doktor uchun -->
    <div v-if="canComplete" class="mt-4 pt-4 border-t border-gray-200">
      <button
        @click="handleComplete"
        :disabled="completing"
        class="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg v-if="!completing" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <div v-else class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        {{ completing ? 'Yakunlanmoqda...' : 'Yakunlash' }}
      </button>
    </div>

    <!-- Ro'yxatdan o'tgan sana -->
    <div class="mt-4 pt-4 border-t border-gray-200">
      <p class="text-xs text-gray-400 text-center">
        Ro'yxatdan o'tgan: {{ formattedCreatedAt }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ClipboardDocumentIcon } from '@heroicons/vue/24/outline'
import { copyToClipboard } from '@/lib/clipboard'
import { formatDate, formatDateTime, calculateAge } from '@/lib/date'
import { getInitials, formatGender, formatPhone, formatMedId, getStatusBadge } from '@/lib/patientHelpers'
import { completeAllPatientVisits } from '@/lib/completePatientVisits'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { getVisitsByPatientId } from '@/api/visitsApi'
import { getVisitServicesByPatientId } from '@/api/visitServicesApi'

const props = defineProps({
  patient: {
    type: Object,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  doctorId: {
    type: [Number, String],
    default: null
  }
})

const { t } = useI18n()
const authStore = useAuthStore()
const toast = useToast()
const completing = ref(false)
const hasIncompleteVisits = ref(false)

const emit = defineEmits(['completed'])

// Computed
const initials = computed(() => getInitials(props.patient.full_name))
const medId = computed(() => formatMedId(props.patient.id))
const statusBadge = computed(() => getStatusBadge(props.patient.status))
const formattedPhone = computed(() => formatPhone(props.patient.phone))
const formattedBirthDate = computed(() => formatDate(props.patient.birth_date))
const age = computed(() => calculateAge(props.patient.birth_date))
const formattedGender = computed(() => formatGender(props.patient.gender))
const formattedLastVisit = computed(() => formatDate(props.patient.last_visit))
const formattedCreatedAt = computed(() => formatDateTime(props.patient.created_at))

const canComplete = computed(() => {
  const role = authStore.userRole
  if (!['doctor', 'solo', 'admin'].includes(role)) return false
  return hasIncompleteVisits.value
})

// Yakunlanmagan tashriflar bor-yo'qligini tekshirish
const checkIncompleteVisits = async () => {
  try {
    const visits = await getVisitsByPatientId(props.patient.id)
    const services = await getVisitServicesByPatientId(props.patient.id)
    
    hasIncompleteVisits.value = visits.some(v => 
      v.status === 'in_progress' || 
      v.status === 'completed_debt' ||
      (v.status === 'completed_paid' && (Number(v.debt_amount) || 0) > 0)
    ) || services.length > 0
  } catch (error) {
    console.error('Failed to check incomplete visits:', error)
    hasIncompleteVisits.value = false
  }
}

const handleComplete = async () => {
  if (!window.confirm('Barcha tashriflarni yakunlashni tasdiqlaysizmi?')) return
  
  completing.value = true
  try {
    const doctorId = props.doctorId || authStore.user?.id || null
    const result = await completeAllPatientVisits(props.patient.id, doctorId)
    
    if (result.success) {
      toast.success(`Muvaffaqiyatli yakunlandi: ${result.completed} ta tashrif`)
      await checkIncompleteVisits()
      emit('completed')
    } else {
      toast.error(result.error || 'Xatolik yuz berdi')
    }
  } catch (error) {
    console.error('Failed to complete visits:', error)
    toast.error('Xatolik yuz berdi')
  } finally {
    completing.value = false
  }
}

// Komponent yuklanganda tekshirish
onMounted(() => {
  checkIncompleteVisits()
})

// Actions
const copyMedId = () => {
  copyToClipboard(String(props.patient.id), t('patientMedId.copyMedId'))
}

const copyPhone = () => {
  copyToClipboard(props.patient.phone, t('patientMedId.copyPhone'))
}
</script>
