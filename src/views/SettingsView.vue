<template>
  <MainLayout>
    <div class="space-y-6 animate-fade-in">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('settings.title') }}</h1>
        <p class="text-gray-500">{{ t('settings.subtitle') }}</p>
      </div>

      <!-- Clinic logo & name -->
      <div class="bg-white rounded-2xl shadow-card border border-gray-100 p-8 space-y-6">
        <div class="flex items-center gap-3">
          <PhotoIcon class="w-6 h-6 text-gray-400" />
          <h2 class="text-lg font-semibold text-gray-900">{{ t('settings.logoTitle') }}</h2>
        </div>
        <p class="text-sm text-gray-500">{{ t('settings.logoHint') }}</p>
        <div class="flex flex-wrap items-start gap-6">
          <div class="flex flex-col items-center gap-3">
            <div
              class="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden"
            >
              <img
                v-if="clinicStore.logoUrl"
                :src="clinicStore.logoUrl"
                alt="Logo"
                class="w-full h-full object-contain"
              />
              <PhotoIcon v-else class="w-10 h-10 text-gray-300" />
            </div>
            <div class="flex flex-col gap-2">
              <label
                class="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 cursor-pointer transition-colors"
              >
                <ArrowUpTrayIcon class="w-4 h-4" />
                {{ t('settings.logoUpload') }}
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="onLogoSelect"
                />
              </label>
              <button
                v-if="clinicStore.isCustomLogo"
                type="button"
                class="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                @click="removeLogo"
              >
                <TrashIcon class="w-4 h-4" />
                {{ t('settings.logoRemove') }}
              </button>
            </div>
          </div>
          <div class="flex-1 min-w-[200px] space-y-2">
            <label class="block text-sm font-medium text-gray-700">{{ t('settings.clinicNameLabel') }}</label>
            <input
              v-model="clinicNameInput"
              type="text"
              :placeholder="t('settings.clinicNamePlaceholder')"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              @blur="saveClinicName"
            />
            <p class="text-xs text-gray-500">{{ t('settings.clinicNameHint') }}</p>
          </div>
          <p v-if="logoError" class="text-sm text-rose-600 w-full">{{ logoError }}</p>
        </div>
      </div>

      <!-- Language -->
      <div class="bg-white rounded-2xl shadow-card border border-gray-100 p-8 space-y-6">
        <div class="flex items-center gap-3">
          <Cog6ToothIcon class="w-6 h-6 text-gray-400" />
          <h2 class="text-lg font-semibold text-gray-900">{{ t('settings.languageTitle') }}</h2>
        </div>
        <div class="max-w-sm">
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('language.label') }}</label>
          <select
            v-model="currentLocale"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="uz">O'zbekcha</option>
            <option value="ru">Русский</option>
          </select>
          <p class="mt-2 text-sm text-gray-500">
            {{ t('settings.languageHint') }}
          </p>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/layouts/MainLayout.vue'
import { useClinicStore } from '@/stores/clinic'
import { resizeLogoFile } from '@/lib/logoResize'
import { Cog6ToothIcon, PhotoIcon, ArrowUpTrayIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { setLocale } from '@/i18n'
import { useToast } from '@/composables/useToast'

const { locale, t } = useI18n()
const clinicStore = useClinicStore()
const toast = useToast()

const currentLocale = ref(locale.value)
const logoError = ref('')
const clinicNameInput = ref(clinicStore.getClinicName())

watch(currentLocale, (newLocale) => {
  setLocale(newLocale)
})

function saveClinicName() {
  clinicStore.setClinicName(clinicNameInput.value)
}

async function onLogoSelect(e) {
  logoError.value = ''
  const file = e.target?.files?.[0]
  if (!file) return
  try {
    const dataUrl = await resizeLogoFile(file)
    clinicStore.setLogo(dataUrl)
    toast.success(t('settings.logoUploaded'))
  } catch (err) {
    logoError.value = err.message || t('settings.logoError')
    toast.error(logoError.value)
  }
  e.target.value = ''
}

function removeLogo() {
  clinicStore.clearLogo()
  logoError.value = ''
  toast.success(t('settings.logoRemoved'))
}
</script>
