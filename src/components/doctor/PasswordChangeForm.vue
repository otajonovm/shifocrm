<template>
  <form @submit.prevent="$emit('submit', passwordForm)" class="space-y-4">
    <div>
      <label for="old_password" class="block text-sm font-medium text-gray-700 mb-2">
        {{ t('doctorProfile.currentPassword') }}
      </label>
      <input
        id="old_password"
        v-model="passwordForm.oldPassword"
        type="password"
        required
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
      />
    </div>

    <div>
      <label for="new_password" class="block text-sm font-medium text-gray-700 mb-2">
        {{ t('doctorProfile.newPassword') }}
      </label>
      <input
        id="new_password"
        v-model="passwordForm.newPassword"
        type="password"
        required
        minlength="6"
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
      />
    </div>

    <div>
      <label for="confirm_password" class="block text-sm font-medium text-gray-700 mb-2">
        {{ t('doctorProfile.confirmPassword') }}
      </label>
      <input
        id="confirm_password"
        v-model="passwordForm.confirmPassword"
        type="password"
        required
        minlength="6"
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
      />
    </div>

    <slot name="error" />
    <slot name="success" />

    <button
      type="submit"
      :disabled="isChangingPassword"
      class="px-6 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {{ isChangingPassword ? t('doctorProfile.changing') : t('doctorProfile.changePasswordAction') }}
    </button>
  </form>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  isChangingPassword: {
    type: Boolean,
    default: false,
  },
  resetTrigger: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['submit'])
const { t } = useI18n()

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const resetForm = () => {
  passwordForm.value = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
}

watch(() => props.resetTrigger, () => {
  if (props.resetTrigger > 0) {
    resetForm()
  }
})

defineExpose({
  resetForm,
})
</script>
