<template>
  <MainLayout>
    <div class="space-y-6 animate-fade-in">
      <div>
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
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/layouts/MainLayout.vue'
import { Cog6ToothIcon } from '@heroicons/vue/24/outline'
import { setLocale } from '@/i18n'

const { locale, t } = useI18n()
const currentLocale = ref(locale.value)

watch(currentLocale, (newLocale) => {
  setLocale(newLocale)
})
</script>
