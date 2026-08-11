<template>
  <section class="space-y-4 rounded-xl border border-gray-100 bg-white p-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h4 class="text-base font-semibold text-gray-900">{{ t('odontogram.materialTitle') }}</h4>
        <p v-if="consumptions.length" class="mt-0.5 text-sm text-gray-500">
          {{ t('odontogram.total') }}: {{ formatCurrency(total) }}
        </p>
      </div>
      <button
        v-if="canManage"
        type="button"
        class="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-medium text-white hover:bg-primary-700 sm:w-auto"
        @click="$emit('add')"
      >
        <PlusIcon class="h-5 w-5" />
        {{ t('odontogram.addMaterial') }}
      </button>
    </div>

    <div v-if="loading" class="py-8 text-center text-sm text-slate-500">
      <div class="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-b-2 border-primary-500"></div>
      {{ t('odontogram.loadingMaterials') }}
    </div>
    <div v-else-if="!consumptions.length" class="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center">
      <p class="text-sm text-slate-500">{{ t('odontogram.noMaterials') }}</p>
    </div>

    <template v-else>
      <div class="space-y-2 md:hidden">
        <div
          v-for="entry in consumptions"
          :key="entry.id"
          class="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"
        >
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium text-slate-800">{{ itemLabel(entry.item_id) }}</p>
            <p class="mt-0.5 text-xs text-slate-500">
              {{ formatDate(entry.created_at) }} · {{ entry.quantity }} {{ t('odontogram.materialQty') }}
            </p>
            <p class="mt-1 text-sm font-semibold text-primary-600">{{ formatCurrency(entryTotal(entry)) }}</p>
            <p v-if="entry.note" class="mt-1 truncate text-xs text-slate-600">{{ entry.note }}</p>
          </div>
          <button
            v-if="canManage"
            type="button"
            :aria-label="t('odontogram.deleteMaterialTitle')"
            class="min-h-[44px] min-w-[44px] rounded-xl p-2 text-rose-500 hover:bg-rose-50"
            :disabled="deletingId === entry.id"
            @click="$emit('delete', entry)"
          >
            <TrashIcon class="mx-auto h-5 w-5" />
          </button>
        </div>
      </div>

      <div class="hidden overflow-x-auto rounded-xl border border-slate-100 md:block">
        <table class="min-w-full divide-y divide-gray-100 text-sm">
          <thead class="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th class="px-4 py-3">{{ t('odontogram.materialDate') }}</th>
              <th class="px-4 py-3">{{ t('odontogram.materialItem') }}</th>
              <th class="px-4 py-3">{{ t('odontogram.materialQty') }}</th>
              <th class="px-4 py-3">{{ t('odontogram.materialPrice') }}</th>
              <th class="px-4 py-3">{{ t('odontogram.materialNote') }}</th>
              <th v-if="canManage" class="w-12 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="entry in consumptions" :key="entry.id">
              <td class="px-4 py-3 text-slate-700">{{ formatDate(entry.created_at) }}</td>
              <td class="px-4 py-3 text-slate-700">{{ itemLabel(entry.item_id) }}</td>
              <td class="px-4 py-3 text-slate-700">{{ entry.quantity }}</td>
              <td class="px-4 py-3 font-medium text-primary-600">{{ formatCurrency(entryTotal(entry)) }}</td>
              <td class="px-4 py-3 text-slate-700">{{ entry.note || '-' }}</td>
              <td v-if="canManage" class="px-4 py-3">
                <button
                  type="button"
                  :aria-label="t('odontogram.deleteMaterialTitle')"
                  class="rounded-lg p-2 text-rose-500 hover:bg-rose-50"
                  :disabled="deletingId === entry.id"
                  @click="$emit('delete', entry)"
                >
                  <TrashIcon class="h-4 w-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { formatDate } from '@/lib/date'

defineProps({
  consumptions: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  canManage: {
    type: Boolean,
    default: false,
  },
  deletingId: {
    type: [String, Number],
    default: null,
  },
  total: {
    type: Number,
    default: 0,
  },
  itemLabel: {
    type: Function,
    required: true,
  },
  entryTotal: {
    type: Function,
    required: true,
  },
  formatCurrency: {
    type: Function,
    required: true,
  },
})

defineEmits(['add', 'delete'])
const { t } = useI18n()
</script>
