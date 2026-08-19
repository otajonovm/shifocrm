<template>
  <SuperAdminLayout>
    <div class="max-w-xl mx-auto space-y-6 animate-fade-in">
      <div class="flex items-center gap-4">
        <router-link
          :to="{ name: 'admin-clinics' }"
          class="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeftIcon class="w-5 h-5" />
        </router-link>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ t('soloDoctor.title') }}</h1>
          <p class="text-gray-500">{{ t('soloDoctor.subtitle') }}</p>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="bg-white rounded-2xl shadow-card border border-gray-100 p-6 space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('soloDoctor.fullName') }} *</label>
          <input
            v-model="form.full_name"
            type="text"
            required
            class="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            :placeholder="t('soloDoctor.fullNamePlaceholder')"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('soloDoctor.login') }} *</label>
          <input
            v-model="form.login"
            type="text"
            required
            class="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            :placeholder="t('soloDoctor.loginPlaceholder')"
          />
          <p class="mt-1 text-xs text-gray-500">{{ t('soloDoctor.loginHint') }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('soloDoctor.password') }} *</label>
          <input
            v-model="form.password"
            type="text"
            required
            class="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            :placeholder="t('soloDoctor.passwordPlaceholder')"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('soloDoctor.email') }}</label>
          <input
            v-model="form.email"
            type="email"
            class="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            :placeholder="t('soloDoctor.emailPlaceholder')"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('soloDoctor.clinicName') }}</label>
          <input
            v-model="form.clinic_name"
            type="text"
            class="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            :placeholder="t('soloDoctor.clinicNamePlaceholder')"
          />
          <p class="mt-1 text-xs text-gray-500">{{ t('soloDoctor.clinicNameHint') }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('soloDoctor.specialization') }}</label>
          <input
            v-model="form.specialization"
            type="text"
            class="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            :placeholder="t('soloDoctor.specializationPlaceholder')"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('soloDoctor.phone') }}</label>
          <input
            v-model="form.phone"
            type="tel"
            class="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="+998 90 123 45 67"
          />
        </div>

        <div class="pt-4 border-t border-gray-200 space-y-4">
          <h3 class="text-sm font-semibold text-gray-900">{{ t('subscription.adminModulesTitle') }}</h3>
          <p class="text-xs text-gray-500">{{ t('subscription.adminModulesHint') }}</p>
          <div
            v-for="mod in featureModules"
            :key="mod.feature_key"
            class="rounded-xl border border-gray-100 bg-gray-50/80 p-4 space-y-3"
          >
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-medium text-gray-900">
                  {{ t(`subscription.features.${mod.feature_key}`) }}
                </p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  v-model="mod.is_active"
                  type="checkbox"
                  class="sr-only peer"
                />
                <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary-600 peer-focus:ring-2 peer-focus:ring-primary-300 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">
                {{ t('subscription.expiresAtLabel') }}
              </label>
              <input
                v-model="mod.expires_at_local"
                type="datetime-local"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <p class="mt-1 text-xs text-gray-400">{{ t('subscription.expiresAtHint') }}</p>
            </div>
          </div>
        </div>

        <div class="flex gap-3 pt-2">
          <button
            type="submit"
            :disabled="saving"
            class="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-cyan-600 text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-50"
          >
            {{ saving ? t('superAdmin.loading') : t('soloDoctor.create') }}
          </button>
          <router-link
            :to="{ name: 'admin-clinics' }"
            class="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
          >
            {{ t('superAdmin.cancel') }}
          </router-link>
        </div>
      </form>

      <!-- Yaratilgach ma'lumotlar -->
      <div
        v-if="showSuccessModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="closeSuccessModal"
      >
        <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircleIcon class="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900">{{ t('soloDoctor.successTitle') }}</h3>
              <p class="text-sm text-gray-600">{{ t('soloDoctor.successSubtitle') }}</p>
            </div>
          </div>
          <div class="space-y-3 bg-gray-50 rounded-xl p-4">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">{{ t('soloDoctor.login') }}</label>
              <div class="flex gap-2">
                <code class="flex-1 px-3 py-2 bg-white rounded-lg font-mono text-sm border border-gray-200">{{ createdCredentials.login }}</code>
                <button type="button" @click="copy(createdCredentials.login)" class="px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100">
                  {{ t('superAdmin.copy') }}
                </button>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">{{ t('login.passwordLabel') }}</label>
              <div class="flex gap-2">
                <code class="flex-1 px-3 py-2 bg-amber-50 rounded-lg font-mono text-sm border border-amber-200">{{ createdCredentials.password }}</code>
                <button type="button" @click="copy(createdCredentials.password)" class="px-3 py-2 text-sm font-medium text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200">
                  {{ t('superAdmin.copy') }}
                </button>
              </div>
            </div>
          </div>
          <p class="text-sm text-gray-600">{{ t('soloDoctor.successLoginHint') }}</p>
          <div class="flex justify-end pt-2">
            <button
              type="button"
              @click="closeSuccessModal"
              class="px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700"
            >
              {{ t('superAdmin.gotIt') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </SuperAdminLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'
import SuperAdminLayout from '@/layouts/SuperAdminLayout.vue'
import { createSoloDoctor } from '@/services/adminService'
import { saveClinicFeatures } from '@/services/subscriptionService'
import { PREMIUM_FEATURE_KEYS } from '@/lib/subscriptionFeatures'
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const { t } = useI18n()
const toast = useToast()

const form = ref({
  full_name: '',
  login: '',
  password: '',
  email: '',
  clinic_name: '',
  specialization: '',
  phone: ''
})

const featureModules = ref(
  PREMIUM_FEATURE_KEYS.map((feature_key) => ({
    feature_key,
    is_active: false,
    expires_at_local: '',
  }))
)

const saving = ref(false)
const showSuccessModal = ref(false)
const createdCredentials = ref({ login: '', password: '' })

const fromLocalDatetime = (local) => {
  if (!local) return null
  const d = new Date(local)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

const featurePayload = () =>
  featureModules.value.map((mod) => ({
    feature_key: mod.feature_key,
    is_active: Boolean(mod.is_active),
    expires_at: fromLocalDatetime(mod.expires_at_local),
  }))

function copy(text) {
  navigator.clipboard.writeText(text).then(() => toast.success(t('superAdmin.copied'))).catch(() => {})
}

function closeSuccessModal() {
  showSuccessModal.value = false
    createdCredentials.value = { login: '', password: '' }
  router.push({ name: 'admin-clinics' })
}

async function handleSubmit() {
  saving.value = true
  try {
    const result = await createSoloDoctor({
      full_name: form.value.full_name,
      login: form.value.login || undefined,
      email: form.value.email || undefined,
      password: form.value.password,
      clinic_name: form.value.clinic_name || undefined,
      specialization: form.value.specialization || undefined,
      phone: form.value.phone || undefined
    })
    const clinicId = Number(result?.clinic?.id ?? result?.clinic)
    if (Number.isFinite(clinicId)) {
      await saveClinicFeatures(clinicId, featurePayload())
    }
    createdCredentials.value = { login: result.login, password: result.password }
    showSuccessModal.value = true
    toast.success(t('soloDoctor.created'))
  } catch (e) {
    toast.error(e?.message || 'Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}
</script>
