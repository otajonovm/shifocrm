<template>
  <div class="flex flex-col items-center gap-3">
    <div
      class="relative h-24 w-24 rounded-2xl overflow-hidden border-2 border-dashed border-primary-200 bg-gradient-to-br from-primary-50 to-cyan-50 flex items-center justify-center"
    >
      <img
        v-if="previewUrl"
        :src="previewUrl"
        alt="Avatar"
        class="h-full w-full object-cover"
      />
      <UserCircleIcon v-else class="h-12 w-12 text-primary-300" />
      <label
        class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
      >
        <CameraIcon class="h-6 w-6 text-white" />
        <input type="file" accept="image/*" class="sr-only" @change="onFileChange" />
      </label>
    </div>
    <p class="text-xs text-slate-500 text-center">{{ t('staffWizard.avatarHint') }}</p>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { UserCircleIcon, CameraIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  modelValue: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'file-selected'])

const { t } = useI18n()
const previewUrl = ref(props.modelValue || '')

watch(() => props.modelValue, (val) => {
  if (val && !previewUrl.value?.startsWith('blob:')) {
    previewUrl.value = val
  }
})

const onFileChange = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  if (previewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = URL.createObjectURL(file)
  emit('file-selected', file)
}
</script>
