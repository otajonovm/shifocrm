<template>
  <form @submit.prevent="$emit('submit', profile)" class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="full_name" class="block text-sm font-medium text-gray-700 mb-2">
          {{ t('doctorProfile.fullName') }} *
        </label>
        <input
          id="full_name"
          v-model="profile.full_name"
          type="text"
          required
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      <div>
        <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
          {{ t('doctorProfile.phone') }} *
        </label>
        <input
          id="phone"
          v-model="profile.phone"
          type="tel"
          required
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
          {{ t('doctorProfile.email') }}
        </label>
        <input
          id="email"
          v-model="profile.email"
          type="email"
          disabled
          class="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
        />
        <p class="mt-1 text-xs text-gray-500">{{ t('doctorProfile.emailLocked') }}</p>
      </div>

      <div>
        <label for="specialization" class="block text-sm font-medium text-gray-700 mb-2">
          {{ t('doctorProfile.specialization') }}
        </label>
        <input
          id="specialization"
          v-model="profile.specialization"
          type="text"
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          :placeholder="t('doctorProfile.specializationPlaceholder')"
        />
      </div>
    </div>

    <div class="flex items-center space-x-2">
      <input
        id="is_active"
        v-model="profile.is_active"
        type="checkbox"
        class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      <label for="is_active" class="text-sm font-medium text-gray-700">
        {{ t('doctorProfile.activeStatus') }}
      </label>
    </div>

    <slot name="error" />
    <slot name="success" />

    <button
      type="submit"
      :disabled="isSubmitting"
      class="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {{ isSubmitting ? t('doctorProfile.saving') : t('doctorProfile.saveChanges') }}
    </button>
  </form>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  initialData: {
    type: Object,
    required: true,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['submit'])

const profile = ref({ ...props.initialData })
const { t } = useI18n()

watch(() => props.initialData, (newData) => {
  profile.value = { ...newData }
}, { deep: true })
</script>
