<template>
  <div class="space-y-4 animate-fade-in">
    <p class="text-sm text-slate-600">{{ t('staffWizard.permissionsIntro') }}</p>
    <StaffPermissionsMatrix
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import StaffPermissionsMatrix from './StaffPermissionsMatrix.vue'

defineProps({
  modelValue: { type: Object, required: true },
})

defineEmits(['update:modelValue'])

const { t } = useI18n()
</script>
