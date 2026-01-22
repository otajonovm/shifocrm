<template>
  <MainLayout>
    <div class="space-y-6 animate-fade-in">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ t('reports.title') }}</h1>
          <p class="text-gray-500">{{ t('reports.subtitle') }}</p>
        </div>
        <button class="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 font-medium rounded-lg hover:bg-gray-50 transition-colors">
          <ArrowDownTrayIcon class="w-5 h-5" />
          {{ t('reports.export') }}
        </button>
      </div>

      <div class="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
        <div class="text-center py-12">
          <ChartBarIcon class="w-16 h-16 text-gray-300 mx-auto" />
          <h3 class="mt-4 text-lg font-medium text-gray-900">{{ t('reports.comingSoonTitle') }}</h3>
          <p class="mt-2 text-gray-500">{{ t('reports.comingSoonSubtitle') }}</p>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from '@/layouts/MainLayout.vue'
import { useI18n } from 'vue-i18n'
import { ChartBarIcon, ArrowDownTrayIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
</script>
