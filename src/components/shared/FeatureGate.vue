<template>
  <template v-if="allowed">
    <slot />
  </template>

  <template v-else-if="mode === 'hide'">
    <!-- yashirin -->
  </template>

  <template v-else-if="mode === 'block'">
    <div class="rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 p-8 text-center">
      <LockClosedIcon class="w-10 h-10 text-violet-400 mx-auto mb-3" />
      <h3 class="text-base font-semibold text-gray-900">{{ t('subscription.upgradeTitle') }}</h3>
      <p class="mt-1 text-sm text-gray-500">
        {{ t('subscription.upgradeBody', { feature: featureLabel }) }}
      </p>
      <button
        type="button"
        class="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        @click="showModal = true"
      >
        {{ t('subscription.upgradeCta') }}
      </button>
    </div>
    <UpgradeModal :open="showModal" :feature-key="feature" @close="showModal = false" />
  </template>

  <template v-else>
    <slot name="fallback">
      <button
        v-if="showUpgrade"
        type="button"
        class="inline-flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800"
        @click="showModal = true"
      >
        <LockClosedIcon class="w-4 h-4" />
        {{ t('subscription.upgradeCta') }}
      </button>
    </slot>
    <UpgradeModal :open="showModal" :feature-key="feature" @close="showModal = false" />
  </template>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { LockClosedIcon } from '@heroicons/vue/24/outline'
import { useSubscriptionStore } from '@/stores/subscription'
import UpgradeModal from '@/components/shared/UpgradeModal.vue'

const props = defineProps({
  /** feature_key: warehouse | sms_marketing | kpi_finance | shifo_ai | cashback */
  feature: { type: String, required: true },
  /** hide | block | modal */
  mode: { type: String, default: 'block' },
  showUpgrade: { type: Boolean, default: true },
})

const { t, te } = useI18n()
const subscriptionStore = useSubscriptionStore()
const showModal = ref(false)

const allowed = computed(() => subscriptionStore.checkFeature(props.feature))

const featureLabel = computed(() => {
  const key = `subscription.features.${props.feature}`
  return te(key) ? t(key) : props.feature
})
</script>
