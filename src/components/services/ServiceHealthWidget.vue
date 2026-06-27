<template>
  <div
    class="rounded-2xl border-2 p-4 sm:p-5 transition-colors"
    :class="issues.length > 0
      ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50'
      : 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50'"
  >
    <div class="flex items-start gap-3">
      <div
        class="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
        :class="issues.length > 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'"
      >
        <ExclamationTriangleIcon v-if="issues.length > 0" class="w-6 h-6" />
        <CheckCircleIcon v-else class="w-6 h-6" />
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="text-base sm:text-lg font-semibold text-gray-900">
            {{ t('services.healthTitle') }}
          </h2>
          <span
            v-if="issues.length > 0"
            class="inline-flex items-center rounded-full bg-amber-600 px-2.5 py-0.5 text-xs font-bold text-white"
          >
            {{ issues.length }}
          </span>
        </div>
        <p class="text-sm text-gray-600 mt-1">
          {{ issues.length > 0 ? t('services.healthDesc') : t('services.healthAllOk') }}
        </p>
        <ul v-if="issues.length > 0" class="mt-3 space-y-1.5 max-h-40 overflow-y-auto">
          <li
            v-for="issue in issues.slice(0, 8)"
            :key="`${issue.type}-${issue.serviceId}`"
            class="flex items-center justify-between gap-2 text-sm rounded-lg bg-white/80 border border-amber-100 px-3 py-2"
          >
            <span class="font-medium text-gray-900 truncate">{{ issue.name }}</span>
            <span class="flex-shrink-0 text-xs font-medium text-amber-700">
              {{ issueLabel(issue) }}
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'

defineProps({
  issues: {
    type: Array,
    default: () => [],
  },
})

const { t } = useI18n()

function issueLabel(issue) {
  if (issue.type === 'zero_price') return t('services.healthZeroPrice')
  if (issue.type === 'low_margin') return t('services.healthLowMargin')
  if (issue.type === 'inactive_popular') return t('services.healthInactivePopular')
  if (issue.type === 'stale_price') return t('services.healthStalePrice')
  return issue.detail || ''
}
</script>
