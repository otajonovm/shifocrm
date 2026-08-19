<template>
  <div class="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-white p-5 sm:p-6 space-y-5">
    <div>
      <h3 class="text-md font-semibold text-gray-900">{{ t('soloBilling.settingsTitle') }}</h3>
      <p class="mt-1 text-sm text-gray-500">{{ t('soloBilling.settingsHint') }}</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <button
        v-for="opt in modelOptions"
        :key="opt.value"
        type="button"
        class="rounded-xl border px-4 py-3 text-left transition-all"
        :class="form.model === opt.value
          ? 'border-emerald-400 bg-emerald-50 ring-1 ring-emerald-200'
          : 'border-gray-200 bg-white hover:bg-gray-50'"
        @click="form.model = opt.value"
      >
        <p class="text-sm font-semibold text-gray-900">{{ opt.label }}</p>
        <p class="mt-1 text-xs text-gray-500">{{ opt.hint }}</p>
      </button>
    </div>

    <div v-if="form.model === 'percentage' || form.model === 'hybrid'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('soloBilling.doctorPercentage') }}</label>
        <div class="relative">
          <input
            v-model.number="form.doctor_percentage"
            type="number"
            min="0"
            max="100"
            step="0.1"
            class="w-full rounded-xl border border-gray-300 px-4 py-2.5 pr-10 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
        </div>
        <p class="mt-1 text-xs text-gray-500">{{ t('soloBilling.doctorPercentageHint') }}</p>
      </div>
    </div>

    <div v-if="form.model === 'rent' || form.model === 'hybrid'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('soloBilling.rentType') }}</label>
        <select
          v-model="form.rent_type"
          class="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
        >
          <option value="monthly">{{ t('soloBilling.rentMonthly') }}</option>
          <option value="daily">{{ t('soloBilling.rentDaily') }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('soloBilling.rentAmount') }}</label>
        <input
          v-model.number="form.rent_amount"
          type="number"
          min="0"
          step="1000"
          class="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          :placeholder="t('soloBilling.rentAmountPlaceholder')"
        />
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        :disabled="saving"
        @click="save"
      >
        {{ saving ? t('soloBilling.saving') : t('soloBilling.saveSettings') }}
      </button>
      <p v-if="savedFlash" class="text-sm text-emerald-600">{{ t('soloBilling.saved') }}</p>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  getDoctorBillingSettings,
  upsertDoctorBillingSettings,
} from '@/services/soloBillingService'

const props = defineProps({
  doctorId: {
    type: [Number, String],
    required: true,
  },
})

const emit = defineEmits(['saved'])

const { t } = useI18n()
const saving = ref(false)
const savedFlash = ref(false)
const error = ref('')
const form = reactive({
  model: 'percentage',
  doctor_percentage: 40,
  rent_type: 'monthly',
  rent_amount: 0,
})

const modelOptions = computed(() => [
  {
    value: 'percentage',
    label: t('soloBilling.modelPercentage'),
    hint: t('soloBilling.modelPercentageHint'),
  },
  {
    value: 'rent',
    label: t('soloBilling.modelRent'),
    hint: t('soloBilling.modelRentHint'),
  },
  {
    value: 'hybrid',
    label: t('soloBilling.modelHybrid'),
    hint: t('soloBilling.modelHybridHint'),
  },
])

const load = async () => {
  error.value = ''
  const { data, error: err } = await getDoctorBillingSettings(props.doctorId)
  if (err) {
    error.value = err.message
    return
  }
  if (data) {
    form.model = data.model || 'percentage'
    form.doctor_percentage = Number.isFinite(Number(data.doctor_percentage))
      ? Number(data.doctor_percentage)
      : 40
    form.rent_type = data.rent_type || 'monthly'
    form.rent_amount = Number(data.rent_amount) || 0
  }
}

const save = async () => {
  saving.value = true
  error.value = ''
  savedFlash.value = false
  try {
    const { data, error: err } = await upsertDoctorBillingSettings(props.doctorId, { ...form })
    if (err) {
      error.value = err.message
      return
    }
    savedFlash.value = true
    emit('saved', data)
    setTimeout(() => { savedFlash.value = false }, 2500)
  } finally {
    saving.value = false
  }
}

watch(() => props.doctorId, () => {
  if (props.doctorId) load()
})

onMounted(load)
</script>
