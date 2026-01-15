<template>
  <div class="bg-gradient-to-br from-primary-50 to-cyan-50 rounded-2xl p-6 border border-primary-100">
    <!-- Header -->
    <div class="flex items-start justify-between mb-6">
      <div class="flex items-center gap-4">
        <!-- Avatar -->
        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
          {{ initials }}
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-900">{{ patient.full_name }}</h2>
          <div class="flex items-center gap-2 mt-1">
            <!-- Status Badge -->
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="[statusBadge.bgClass, statusBadge.textClass]"
            >
              {{ statusBadge.text }}
            </span>
            <!-- MED-ID -->
            <div class="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
              <span class="text-xs text-gray-500">MED-ID:</span>
              <span class="font-mono font-semibold text-primary-600">{{ medId }}</span>
              <button
                @click="copyMedId"
                class="p-0.5 text-gray-400 hover:text-primary-600 transition-colors"
                title="Nusxalash"
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
            <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">Telefon</p>
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
            title="Nusxalash"
          >
            <ClipboardDocumentIcon class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Tug'ilgan sana + Yosh -->
      <div class="bg-white rounded-xl p-4 border border-gray-100">
        <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">Tug'ilgan sana</p>
        <p class="text-sm font-medium text-gray-900">
          {{ formattedBirthDate }}
          <span v-if="age !== null" class="text-gray-500 ml-1">({{ age }} yosh)</span>
        </p>
      </div>

      <!-- Jinsi -->
      <div class="bg-white rounded-xl p-4 border border-gray-100">
        <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">Jinsi</p>
        <p class="text-sm font-medium text-gray-900">{{ formattedGender }}</p>
      </div>

      <!-- Manzil -->
      <div class="bg-white rounded-xl p-4 border border-gray-100">
        <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">Manzil</p>
        <p class="text-sm font-medium text-gray-900">{{ patient.address || '-' }}</p>
      </div>

      <!-- Doktor (faqat admin uchun) -->
      <div v-if="isAdmin" class="bg-white rounded-xl p-4 border border-gray-100">
        <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">Biriktirilgan Doktor</p>
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

    <!-- Ro'yxatdan o'tgan sana -->
    <div class="mt-4 pt-4 border-t border-gray-200">
      <p class="text-xs text-gray-400 text-center">
        Ro'yxatdan o'tgan: {{ formattedCreatedAt }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ClipboardDocumentIcon } from '@heroicons/vue/24/outline'
import { copyToClipboard } from '@/lib/clipboard'
import { formatDate, formatDateTime, calculateAge } from '@/lib/date'
import { getInitials, formatGender, formatPhone, formatMedId, getStatusBadge } from '@/lib/patientHelpers'

const props = defineProps({
  patient: {
    type: Object,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
})

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

// Actions
const copyMedId = () => {
  copyToClipboard(String(props.patient.id), 'MED-ID nusxalandi!')
}

const copyPhone = () => {
  copyToClipboard(props.patient.phone, 'Telefon raqami nusxalandi!')
}
</script>
