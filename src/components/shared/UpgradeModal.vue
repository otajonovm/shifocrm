<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-100 p-6">
        <div class="flex items-start gap-3">
          <div class="shrink-0 w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
            <SparklesIcon class="w-6 h-6 text-violet-600" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-gray-900">{{ t('subscription.upgradeTitle') }}</h3>
            <p class="mt-1 text-sm text-gray-500">
              {{ t('subscription.upgradeBody', { feature: featureLabel }) }}
            </p>
            <p v-if="featureDescription" class="mt-2 text-xs text-gray-400">{{ featureDescription }}</p>
          </div>
        </div>

        <div class="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            class="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            @click="emit('close')"
          >
            {{ t('subscription.later') }}
          </button>
          <a
            href="https://t.me/shifocrm"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex justify-center rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            {{ t('subscription.contactUpgrade') }}
          </a>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { SparklesIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  open: { type: Boolean, default: false },
  featureKey: { type: String, default: '' },
})

const emit = defineEmits(['close'])

const { t, te } = useI18n()

const featureLabel = computed(() => {
  const key = `subscription.features.${props.featureKey}`
  return te(key) ? t(key) : props.featureKey
})

const featureDescription = computed(() => {
  const key = `subscription.featureDesc.${props.featureKey}`
  return te(key) ? t(key) : ''
})
</script>
