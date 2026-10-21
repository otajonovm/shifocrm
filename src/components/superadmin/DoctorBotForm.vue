<template>
  <form class="bg-white rounded-2xl shadow-card border border-gray-100 p-6 space-y-5" @submit.prevent="submit">
    <DoctorSearchSelect
      v-model="form.doctor_id"
      :doctors="doctors"
      :disabled="Boolean(botId)"
      @select="onDoctorSelect"
    />

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('doctorBots.botTitle') }}</label>
      <input
        v-model="form.bot_title"
        type="text"
        class="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        :placeholder="t('doctorBots.botTitlePlaceholder')"
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('doctorBots.botUsername') }} *</label>
      <input
        v-model="form.bot_username"
        type="text"
        required
        class="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono"
        :placeholder="t('doctorBots.botUsernamePlaceholder')"
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        {{ t('doctorBots.botToken') }}
        <span v-if="!botId">*</span>
      </label>
      <div class="relative">
        <input
          v-model="form.bot_token"
          :type="showToken ? 'text' : 'password'"
          :required="!botId"
          autocomplete="off"
          class="w-full px-3 py-2.5 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono"
          :placeholder="botId ? t('doctorBots.botTokenKeepHint') : t('doctorBots.botTokenPlaceholder')"
        />
        <button
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-800"
          :aria-label="showToken ? t('doctorBots.hideToken') : t('doctorBots.showToken')"
          @click="showToken = !showToken"
        >
          <EyeSlashIcon v-if="showToken" class="w-5 h-5" />
          <EyeIcon v-else class="w-5 h-5" />
        </button>
      </div>
      <p v-if="botId && tokenLast4" class="mt-1 text-xs text-gray-500">
        {{ t('doctorBots.currentToken') }}: {{ maskBotToken(tokenLast4) }}
      </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('doctorBots.cashbackPercent') }}</label>
        <input
          v-model.number="form.cashback_percent"
          type="number"
          min="0"
          max="100"
          step="0.01"
          class="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('doctorBots.maxSpendPercent') }}</label>
        <input
          v-model.number="form.max_spend_percent"
          type="number"
          min="0"
          max="100"
          step="0.01"
          class="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('doctorBots.referralBonus') }}</label>
      <input
        v-model.number="form.referral_bonus"
        type="number"
        min="0"
        step="1000"
        class="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('doctorBots.welcomeMessage') }}</label>
      <textarea
        v-model="form.welcome_message"
        rows="4"
        class="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        :placeholder="t('doctorBots.welcomePlaceholder')"
      />
    </div>

    <p v-if="error" class="text-sm text-rose-600">{{ error }}</p>

    <div class="flex flex-wrap items-center gap-3 pt-2">
      <button
        type="submit"
        :disabled="saving"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-cyan-600 text-white font-medium rounded-lg shadow hover:shadow-lg disabled:opacity-60"
      >
        {{ saving ? t('doctorBots.saving') : t('doctorBots.activate') }}
      </button>
      <router-link
        :to="{ name: 'admin-doctor-bots' }"
        class="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
      >
        {{ t('common.cancel') }}
      </router-link>
    </div>
  </form>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'
import DoctorSearchSelect from '@/components/superadmin/DoctorSearchSelect.vue'
import {
  DEFAULT_CASHBACK_PERCENT,
  DEFAULT_MAX_SPEND_PERCENT,
  DEFAULT_REFERRAL_BONUS,
  maskBotToken,
} from '@/lib/dedicatedBot'

const props = defineProps({
  botId: { type: String, default: '' },
  initial: { type: Object, default: null },
  doctors: { type: Array, default: () => [] },
  saving: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['submit'])
const { t } = useI18n()
const showToken = ref(false)
const tokenLast4 = ref('')

const form = reactive({
  doctor_id: '',
  clinic_id: null,
  bot_title: '',
  bot_username: '',
  bot_token: '',
  cashback_percent: DEFAULT_CASHBACK_PERCENT,
  max_spend_percent: DEFAULT_MAX_SPEND_PERCENT,
  referral_bonus: DEFAULT_REFERRAL_BONUS,
  welcome_message: '',
})

watch(() => props.initial, (row) => {
  if (!row) return
  form.doctor_id = row.doctor_id || ''
  form.clinic_id = row.clinic_id || null
  form.bot_title = row.bot_title || ''
  form.bot_username = row.bot_username || ''
  form.bot_token = ''
  form.cashback_percent = Number(row.cashback_percent) || DEFAULT_CASHBACK_PERCENT
  form.max_spend_percent = Number(row.max_spend_percent) || DEFAULT_MAX_SPEND_PERCENT
  form.referral_bonus = Number(row.referral_bonus) || DEFAULT_REFERRAL_BONUS
  form.welcome_message = row.welcome_message || ''
  tokenLast4.value = row.bot_token_last4 || ''
}, { immediate: true })

function onDoctorSelect(doc) {
  form.clinic_id = doc?.clinic_id ?? null
  if (!form.bot_title && doc?.full_name) {
    form.bot_title = doc.full_name
  }
}

function submit() {
  emit('submit', { ...form })
}
</script>
