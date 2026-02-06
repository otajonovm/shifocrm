<template>
  <MobileBottomSheet
    :model-value="modelValue"
    :title="t('common.filters')"
    @update:model-value="handleUpdate"
    @close="handleClose"
  >
    <div class="space-y-4">
      <slot />
    </div>

    <template #footer>
      <div class="flex items-center gap-3">
        <button
          @click="handleReset"
          class="flex-1 mobile-btn-secondary touch-target-lg"
        >
          {{ t('common.clearFilters') }}
        </button>
        <button
          @click="handleApply"
          class="flex-1 mobile-btn-primary touch-target-lg"
        >
          {{ t('common.apply') }}
        </button>
      </div>
    </template>
  </MobileBottomSheet>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import MobileBottomSheet from './MobileBottomSheet.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'apply', 'reset', 'close'])
const { t } = useI18n()

const handleUpdate = (value) => {
  emit('update:modelValue', value)
}

const handleClose = () => {
  emit('close')
}

const handleApply = () => {
  emit('apply')
  handleClose()
}

const handleReset = () => {
  emit('reset')
}
</script>
