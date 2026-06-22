<template>
  <nav aria-label="Progress" class="mb-6">
    <ol class="flex items-center justify-between gap-2">
      <li
        v-for="(step, index) in steps"
        :key="step.id"
        class="flex-1 min-w-0 relative"
      >
        <div class="flex flex-col items-center gap-1.5">
          <div
            class="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300"
            :class="stepCircleClass(step.id)"
          >
            <CheckIcon v-if="activeStep > step.id" class="h-5 w-5" />
            <span v-else>{{ step.id }}</span>
          </div>
          <span
            class="hidden sm:block text-xs font-medium text-center truncate w-full px-1"
            :class="activeStep >= step.id ? 'text-primary-700' : 'text-slate-400'"
          >
            {{ t(step.labelKey) }}
          </span>
        </div>
      </li>
    </ol>
    <div class="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
      <div
        class="h-full rounded-full bg-gradient-to-r from-primary-500 to-cyan-500 transition-all duration-500"
        :style="{ width: `${(activeStep / totalSteps) * 100}%` }"
      />
    </div>
  </nav>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { CheckIcon } from '@heroicons/vue/24/solid'

const props = defineProps({
  activeStep: { type: Number, required: true },
  totalSteps: { type: Number, required: true },
})

const { t } = useI18n()

const steps = [
  { id: 1, labelKey: 'staffWizard.steps.personal' },
  { id: 2, labelKey: 'staffWizard.steps.work' },
  { id: 3, labelKey: 'staffWizard.steps.finance' },
  { id: 4, labelKey: 'staffWizard.steps.permissions' },
]

const stepCircleClass = (stepId) => {
  if (props.activeStep > stepId) {
    return 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
  }
  if (props.activeStep === stepId) {
    return 'bg-gradient-to-br from-primary-500 to-cyan-600 text-white shadow-lg shadow-primary-200 scale-110'
  }
  return 'bg-white border-2 border-slate-200 text-slate-400'
}
</script>
