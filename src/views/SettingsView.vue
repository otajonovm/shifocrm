<template>
  <MainLayout>
    <div class="space-y-6 animate-fade-in">
      <div>
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
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from '@/layouts/MainLayout.vue'
import LanguageSwitcher from '@/components/shared/LanguageSwitcher.vue'
import { Cog6ToothIcon } from '@heroicons/vue/24/outline'
</script>
