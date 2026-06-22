<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        @click.self="$emit('close')"
      >
        <div
          class="w-full sm:max-w-3xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh] animate-slide-up"
        >
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-slate-100 px-5 sm:px-6 py-4 flex-shrink-0">
            <div>
              <h2 class="text-lg font-bold text-slate-900">
                {{ isEdit ? t('staffWizard.titleEdit') : t('staffWizard.titleCreate') }}
              </h2>
              <p class="text-xs text-slate-500 mt-0.5">
                {{ stepCounterLabel }}
              </p>
            </div>
            <button
              type="button"
              class="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              @click="$emit('close')"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-5 sm:px-6 py-5">
            <StaffWizardSteps :active-step="activeStep" :total-steps="totalSteps" />

            <StaffWizardStepPersonal
              v-if="activeStep === 1"
              :form="form"
            />
            <StaffWizardStepWork
              v-else-if="activeStep === 2"
              :form="form"
              :clinic-name="clinicName"
              :is-edit="isEdit"
            />
            <StaffWizardStepFinance
              v-else-if="activeStep === 3"
              :form="form"
              :cash-registers="cashRegisters"
            />
            <StaffWizardStepPermissions
              v-else-if="activeStep === 4"
              :permissions="permissions"
            />

            <div
              v-if="formError"
              class="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              {{ formError }}
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between gap-3 border-t border-slate-100 px-5 sm:px-6 py-4 flex-shrink-0 bg-slate-50/50">
            <button
              v-if="activeStep > 1"
              type="button"
              class="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              :disabled="isSubmitting"
              @click="$emit('back')"
            >
              {{ t('staffWizard.back') }}
            </button>
            <div v-else />

            <div class="flex items-center gap-2 ml-auto">
              <button
                type="button"
                class="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                :disabled="isSubmitting"
                @click="$emit('close')"
              >
                {{ t('staffWizard.cancel') }}
              </button>
              <button
                v-if="activeStep < totalSteps"
                type="button"
                class="rounded-xl bg-gradient-to-r from-primary-500 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                :disabled="isSubmitting"
                @click="$emit('next')"
              >
                {{ t('staffWizard.next') }}
              </button>
              <button
                v-else
                type="button"
                class="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                :disabled="isSubmitting"
                @click="$emit('submit')"
              >
                {{ isSubmitting ? t('staffWizard.saving') : t('staffWizard.save') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import StaffWizardSteps from './StaffWizardSteps.vue'
import StaffWizardStepPersonal from './StaffWizardStepPersonal.vue'
import StaffWizardStepWork from './StaffWizardStepWork.vue'
import StaffWizardStepFinance from './StaffWizardStepFinance.vue'
import StaffWizardStepPermissions from './StaffWizardStepPermissions.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  isEdit: { type: Boolean, default: false },
  activeStep: { type: Number, default: 1 },
  totalSteps: { type: Number, default: 4 },
  form: { type: Object, required: true },
  permissions: { type: Object, required: true },
  formError: { type: String, default: '' },
  isSubmitting: { type: Boolean, default: false },
  cashRegisters: { type: Array, default: () => [] },
  clinicName: { type: String, default: '' },
})

defineEmits(['close', 'next', 'back', 'submit'])

const { t } = useI18n()

const stepCounterLabel = computed(() =>
  t('staffWizard.stepCounter', {
    current: props.activeStep,
    total: props.totalSteps,
  })
)
</script>
