<template>
  <header class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div class="min-w-0 flex-1">
        <div class="mb-2 flex items-center justify-between gap-3">
          <label for="odontogram-visit" class="text-sm font-semibold text-slate-800">
            {{ t('odontogram.visit') }}
          </label>
          <VisitStatusBadge
            v-if="currentVisit"
            :status="currentVisit.status"
            :visit="currentVisit"
            :show-icon="false"
          />
        </div>
        <select
          id="odontogram-visit"
          :value="modelValue"
          class="min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 lg:max-w-xl"
          :disabled="loading"
          @change="handleChange"
        >
          <option value="">{{ t('odontogram.select') }}</option>
          <option v-for="visit in visits" :key="visit.id" :value="visit.id">
            {{ formatDate(visit.date || visit.created_at) }} — {{ getVisitStatusLabel(visit.status) }}
          </option>
        </select>
      </div>

      <div class="grid grid-cols-2 gap-2 lg:flex">
        <button
          v-if="!hasActiveVisit"
          type="button"
          :disabled="loading"
          class="col-span-2 inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 lg:col-span-1"
          @click="$emit('new-visit')"
        >
          <PlusIcon class="h-5 w-5" />
          {{ t('odontogram.newVisit') }}
        </button>
        <button
          v-if="canEdit"
          type="button"
          :disabled="loading"
          class="col-span-2 inline-flex min-h-[46px] items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 lg:col-span-1"
          @click="$emit('complete')"
        >
          {{ t('odontogram.completeVisit') }}
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { PlusIcon } from '@heroicons/vue/24/outline'
import VisitStatusBadge from '@/components/ui/VisitStatusBadge.vue'
import { formatDate } from '@/lib/date'
import { getVisitStatusLabel } from '@/constants/visitStatus'

defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  visits: {
    type: Array,
    default: () => [],
  },
  currentVisit: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  hasActiveVisit: {
    type: Boolean,
    default: false,
  },
  canEdit: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'change', 'new-visit', 'complete'])
const { t } = useI18n()

const handleChange = (event) => {
  emit('update:modelValue', event.target.value)
  emit('change', event.target.value)
}
</script>
