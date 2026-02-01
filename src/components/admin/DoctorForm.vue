<template>
  <form @submit.prevent="$emit('submit', form)" class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <label for="full_name" class="block text-sm font-medium text-gray-700 mb-2">
          {{ t('doctors.fullName') }} *
        </label>
        <input
          id="full_name"
          v-model="form.full_name"
          type="text"
          required
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          :placeholder="t('doctors.fullNamePlaceholder')"
        />
      </div>

      <div>
        <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
          {{ t('doctors.phone') }} *
        </label>
        <input
          id="phone"
          v-model="form.phone"
          type="tel"
          required
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          :placeholder="t('doctors.phonePlaceholder')"
        />
      </div>

      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
          {{ t('doctors.email') }}
        </label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          placeholder="doctor@example.com"
        />
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
          {{ t('doctors.initialPassword') }} *
        </label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          required
          minlength="6"
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          :placeholder="t('doctors.passwordPlaceholder')"
        />
      </div>

      <div>
        <label for="specialization" class="block text-sm font-medium text-gray-700 mb-2">
          {{ t('doctors.specialization') }}
        </label>
        <input
          id="specialization"
          v-model="form.specialization"
          type="text"
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          :placeholder="t('doctors.specializationPlaceholder')"
        />
      </div>

      <div class="flex items-end">
        <label class="flex items-center space-x-2 cursor-pointer">
          <input
            v-model="form.is_active"
            type="checkbox"
            class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span class="text-sm font-medium text-gray-700">{{ t('doctors.active') }}</span>
        </label>
      </div>
    </div>

    <slot name="error" />

    <button
      type="submit"
      :disabled="isSubmitting || disabled"
      class="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {{ isSubmitting ? t('doctors.saving') : resolvedButtonText }}
    </button>
  </form>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({
      full_name: '',
      phone: '',
      email: '',
      password: '',
      specialization: '',
      is_active: true,
    }),
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  buttonText: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['submit'])
const { t } = useI18n()
const resolvedButtonText = computed(() => props.buttonText || t('doctors.addButton'))

const form = ref({ ...props.initialData })

watch(() => props.initialData, (newData) => {
  form.value = { ...newData }
}, { deep: true })
</script>
