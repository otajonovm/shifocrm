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

      <!-- Keshbek karta: balans + QR — bemor tashrifda ko'rsatadi -->
      <div
        v-if="cashbackConfigured"
        class="bg-white rounded-xl p-4 border border-amber-100 sm:col-span-2"
      >
        <div class="flex flex-col sm:flex-row sm:items-start gap-4">
          <div class="flex-1 min-w-0">
            <p class="text-xs text-amber-700 uppercase tracking-wider mb-1">{{ t('patientMedId.cashback') }}</p>
            <p v-if="cashbackLoading" class="text-sm text-gray-400">{{ t('patientMedId.cashbackLoading') }}</p>
            <p v-else-if="cashbackError" class="text-sm text-gray-400">
              {{ t(cashbackErrorCode === 'UNAUTHORIZED' ? 'patientMedId.cashbackUnauthorized' : 'patientMedId.cashbackUnavailable') }}
            </p>
            <p
              v-else
              class="text-lg font-semibold"
              :class="cashbackBalance > 0 ? 'text-amber-700' : 'text-gray-500'"
            >
              {{ formatCurrency(cashbackBalance) }}
              <span v-if="cashbackBalance <= 0" class="ml-1 text-sm font-normal text-gray-400">
                ({{ t('patientMedId.cashbackNone') }})
              </span>
            </p>
            <p class="mt-2 text-xs text-gray-500 leading-relaxed">
              {{ t('patientMedId.cashbackHint') }}
            </p>
            <button
              type="button"
              class="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
              @click="printCashbackCard"
            >
              <PrinterIcon class="w-4 h-4" />
              {{ t('patientMedId.cashbackPrint') }}
            </button>
          </div>
          <div v-if="qrDataUrl" class="shrink-0 self-center sm:self-start">
            <img
              :src="qrDataUrl"
              alt="MED-ID QR"
              class="w-28 h-28 rounded-lg border border-gray-100 bg-white p-1"
            />
            <p class="mt-1 text-center font-mono text-xs font-semibold text-primary-600">{{ medId }}</p>
          </div>
        </div>
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
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ClipboardDocumentIcon, PrinterIcon } from '@heroicons/vue/24/outline'
import { copyToClipboard } from '@/lib/clipboard'
import { formatDate, formatDateTime, calculateAge } from '@/lib/date'
import { getInitials, formatGender, formatPhone, formatMedId, getStatusBadge } from '@/lib/patientHelpers'
import { useCashbackBalance } from '@/composables/useCashbackBalance'
import { cashbackQrDataUrl, openCashbackCardPrint } from '@/lib/patientCashbackCardPrint'
import { useClinicStore } from '@/stores/clinic'
import { useToast } from '@/composables/useToast'

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
const toast = useToast()
const clinicStore = useClinicStore()
const qrDataUrl = ref('')

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

const {
  balance: cashbackBalance,
  loading: cashbackLoading,
  error: cashbackError,
  errorCode: cashbackErrorCode,
  configured: cashbackConfigured,
} = useCashbackBalance(() => props.patient?.id)

const formatCurrency = (amount) => {
  const numeric = Number(amount)
  const safe = Number.isFinite(numeric) ? numeric : 0
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safe).replace('UZS', t('common.currencySuffix'))
}

watch(
  () => [props.patient?.id, cashbackConfigured.value],
  async ([patientId, configured]) => {
    if (!configured || patientId == null || patientId === '') {
      qrDataUrl.value = ''
      return
    }
    try {
      qrDataUrl.value = await cashbackQrDataUrl(patientId)
    } catch {
      qrDataUrl.value = ''
    }
  },
  { immediate: true },
)

const printCashbackCard = async () => {
  let qr = qrDataUrl.value
  if (!qr && props.patient?.id) {
    qr = await cashbackQrDataUrl(props.patient.id).catch(() => '')
  }
  const result = openCashbackCardPrint({
    clinicName: clinicStore.displayName || 'SHIFOCRM',
    patientName: props.patient?.full_name || '-',
    medId: medId.value,
    phone: formattedPhone.value === '-' ? '' : formattedPhone.value,
    cashbackLabel: t('patientMedId.cashbackCardLabel', { amount: formatCurrency(cashbackBalance.value) }),
    hint: t('patientMedId.cashbackHint'),
    qrDataUrl: qr,
  })
  if (!result.ok) {
    toast.error(t('patientMedId.cashbackPrintError'))
  }
}

// Actions
const copyMedId = () => {
  copyToClipboard(String(props.patient.id), t('patientMedId.copyMedId'))
}

const copyPhone = () => {
  copyToClipboard(props.patient.phone, t('patientMedId.copyPhone'))
}
</script>
