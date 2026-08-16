<template>
  <div class="rounded-xl border border-amber-100 bg-amber-50/40 p-4 space-y-3">
    <div class="flex items-center justify-between gap-2">
      <div>
        <h4 class="text-sm font-semibold text-gray-900">{{ t('soloBilling.visitExpensesTitle') }}</h4>
        <p class="text-xs text-gray-500">{{ t('soloBilling.visitExpensesHint') }}</p>
      </div>
      <button
        type="button"
        class="text-xs font-medium text-amber-700 hover:text-amber-900"
        @click="load"
      >
        {{ t('soloBilling.refresh') }}
      </button>
    </div>

    <ul v-if="items.length" class="space-y-2">
      <li
        v-for="item in items"
        :key="item.id"
        class="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm border border-amber-100"
      >
        <div class="min-w-0">
          <p class="font-medium text-gray-800 truncate">
            {{ categoryLabel(item.category) }}
            <span class="text-gray-400 font-normal">· {{ formatMoney(item.amount) }}</span>
          </p>
          <p v-if="item.note" class="text-xs text-gray-500 truncate">{{ item.note }}</p>
        </div>
        <button
          type="button"
          class="shrink-0 text-xs text-red-600 hover:text-red-700"
          @click="remove(item)"
        >
          {{ t('soloBilling.delete') }}
        </button>
      </li>
    </ul>
    <p v-else class="text-xs text-gray-500">{{ t('soloBilling.noExpenses') }}</p>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
      <select
        v-model="form.category"
        class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
      >
        <option value="zubotexnik">{{ t('soloBilling.catZubotexnik') }}</option>
        <option value="lab">{{ t('soloBilling.catLab') }}</option>
        <option value="material">{{ t('soloBilling.catMaterial') }}</option>
        <option value="other">{{ t('soloBilling.catOther') }}</option>
      </select>
      <input
        v-model.number="form.amount"
        type="number"
        min="0"
        step="1000"
        class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
        :placeholder="t('soloBilling.amountPlaceholder')"
      />
      <input
        v-model="form.note"
        type="text"
        class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm sm:col-span-1"
        :placeholder="t('soloBilling.notePlaceholder')"
      />
    </div>

    <button
      type="button"
      class="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
      :disabled="saving || !canAdd"
      @click="add"
    >
      {{ saving ? t('soloBilling.saving') : t('soloBilling.addExpense') }}
    </button>
    <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  addVisitExpense,
  deleteVisitExpense,
  listVisitExpenses,
} from '@/services/soloBillingService'

const props = defineProps({
  visitId: { type: [Number, String], required: true },
  doctorId: { type: [Number, String], default: null },
  patientId: { type: [Number, String], default: null },
})

const emit = defineEmits(['changed'])

const { t } = useI18n()
const items = ref([])
const saving = ref(false)
const error = ref('')
const form = reactive({
  category: 'zubotexnik',
  amount: null,
  note: '',
})

const canAdd = computed(() => Number(form.amount) > 0 && props.visitId)

const formatMoney = (n) =>
  new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 }).format(Number(n) || 0) + " so'm"

const categoryLabel = (cat) => {
  const map = {
    zubotexnik: t('soloBilling.catZubotexnik'),
    lab: t('soloBilling.catLab'),
    material: t('soloBilling.catMaterial'),
    other: t('soloBilling.catOther'),
  }
  return map[cat] || cat
}

const load = async () => {
  if (!props.visitId) return
  error.value = ''
  const { data, error: err } = await listVisitExpenses(props.visitId)
  if (err) error.value = err.message
  items.value = data || []
}

const add = async () => {
  if (!canAdd.value) return
  saving.value = true
  error.value = ''
  try {
    const { error: err } = await addVisitExpense({
      visitId: props.visitId,
      amount: form.amount,
      category: form.category,
      note: form.note,
      doctorId: props.doctorId,
      patientId: props.patientId,
    })
    if (err) {
      error.value = err.message
      return
    }
    form.amount = null
    form.note = ''
    await load()
    emit('changed')
  } finally {
    saving.value = false
  }
}

const remove = async (item) => {
  const { error: err } = await deleteVisitExpense(item.id, props.visitId)
  if (err) {
    error.value = err.message
    return
  }
  await load()
  emit('changed')
}

watch(() => props.visitId, load)
onMounted(load)
</script>
