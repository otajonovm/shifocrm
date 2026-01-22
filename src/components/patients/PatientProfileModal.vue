<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="$emit('close')"
      >
        <div class="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl animate-slide-up flex flex-col overflow-hidden">
          <!-- Modal Header -->
          <div class="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg">
                {{ initials }}
              </div>
              <div>
                <h2 class="text-xl font-semibold text-gray-900">{{ patient.full_name }}</h2>
                <p class="text-sm text-gray-500">{{ t('patientProfile.title') }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="$emit('edit', patient)"
                class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Tahrirlash"
              >
                <PencilIcon class="w-5 h-5" />
              </button>
              <button
                @click="$emit('close')"
                class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Tabs -->
          <div class="flex border-b border-gray-100 px-6 shrink-0">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              class="relative px-4 py-3 text-sm font-medium transition-colors"
              :class="activeTab === tab.id ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'"
            >
              <div class="flex items-center gap-2">
                <component :is="tab.icon" class="w-4 h-4" />
                {{ t(tab.labelKey) }}
              </div>
              <div
                v-if="activeTab === tab.id"
                class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
              ></div>
            </button>
          </div>

          <!-- Tab Content -->
          <div class="flex-1 overflow-y-auto p-6">
            <!-- MED-ID Karta Tab -->
            <div v-if="activeTab === 'medid'" class="animate-fade-in">
              <PatientMedIdCard :patient="patient" :is-admin="isAdmin" />
            </div>

            <!-- Odontogramma Tab -->
            <div v-else-if="activeTab === 'odontogram'" class="animate-fade-in">
              <PatientOdontogram
                :patient="patient"
                :doctor-id="doctorId"
                :doctor-name="doctorName"
              />
            </div>

            <!-- Tashriflar Tab -->
            <div v-else-if="activeTab === 'visits'" class="animate-fade-in">
              <PatientVisits :patient="patient" />
            </div>

            <!-- Davolash rejasi Tab -->
            <div v-else-if="activeTab === 'plans'" class="animate-fade-in">
              <PatientTreatmentPlans :patient-id="patient.id" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  XMarkIcon,
  PencilIcon,
  IdentificationIcon,
  DocumentChartBarIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon
} from '@heroicons/vue/24/outline'
import { getInitials } from '@/lib/patientHelpers'
import PatientMedIdCard from './PatientMedIdCard.vue'
import PatientOdontogram from './PatientOdontogram.vue'
import PatientVisits from './PatientVisits.vue'
import PatientTreatmentPlans from './PatientTreatmentPlans.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  patient: {
    type: Object,
    default: null
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  doctorId: {
    type: [Number, String],
    default: null
  },
  doctorName: {
    type: String,
    default: ''
  }
})

const { t } = useI18n()

defineEmits(['close', 'edit'])

// Tabs configuration
const tabs = [
  { id: 'medid', labelKey: 'patientProfile.tabMedId', icon: IdentificationIcon },
  { id: 'odontogram', labelKey: 'patientProfile.tabOdontogram', icon: DocumentChartBarIcon },
  { id: 'visits', labelKey: 'patientProfile.tabVisits', icon: CalendarDaysIcon },
  { id: 'plans', labelKey: 'patientProfile.tabPlans', icon: ClipboardDocumentListIcon }
]

const activeTab = ref('medid')

// Computed
const initials = computed(() => {
  if (!props.patient) return ''
  return getInitials(props.patient.full_name)
})

// Reset tab when modal opens
watch(() => props.show, (newVal) => {
  if (newVal) {
    activeTab.value = 'medid'
  }
})
</script>
