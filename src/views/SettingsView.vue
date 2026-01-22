<template>
  <MainLayout>
    <div class="space-y-6 animate-fade-in">
      <div>
<<<<<<< HEAD
        <h1 class="text-2xl font-bold text-gray-900">{{ $t('settings.title') }}</h1>
        <p class="text-gray-500">{{ $t('settings.systemSettings') }}</p>
      </div>

      <!-- Language Settings -->
      <div class="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ $t('settings.language') }}</h2>
        <p class="text-sm text-gray-500 mb-4">{{ $t('settings.languageDescription') }}</p>
        <LanguageSwitcher />
      </div>

      <!-- Clinic Settings -->
      <div class="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ $t('settings.clinicSettings') }}</h2>
        <div class="text-center py-12">
          <Cog6ToothIcon class="w-16 h-16 text-gray-300 mx-auto" />
          <h3 class="mt-4 text-lg font-medium text-gray-900">{{ $t('settings.comingSoon') }}</h3>
          <p class="mt-2 text-gray-500">{{ $t('settings.comingSoonDescription') }}</p>
=======
        <h1 class="text-2xl font-bold text-gray-900">{{ t('settings.title') }}</h1>
        <p class="text-gray-500">{{ t('settings.subtitle') }}</p>
      </div>

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
>>>>>>> 15c7b98d3af6412713edde1f137b3b8bc0c92b18
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/layouts/MainLayout.vue'
import LanguageSwitcher from '@/components/shared/LanguageSwitcher.vue'
import { Cog6ToothIcon } from '@heroicons/vue/24/outline'
import { setLocale } from '@/i18n'

const { locale, t } = useI18n()
const currentLocale = ref(locale.value)

watch(currentLocale, (newLocale) => {
  setLocale(newLocale)
})
</script>
