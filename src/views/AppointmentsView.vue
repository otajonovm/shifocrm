<template>
  <MainLayout>
    <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Uchrashuvlar</h1>
          <p class="text-gray-500">Qabullar jadvali va boshqaruvi</p>
        </div>
        <button
          v-if="isAdmin"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-cyan-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          <PlusIcon class="w-5 h-5" />
          Yangi Uchrashuv
        </button>
      </div>

      <!-- Calendar Placeholder -->
      <div class="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
        <div class="text-center py-12">
          <CalendarDaysIcon class="w-16 h-16 text-gray-300 mx-auto" />
          <h3 class="mt-4 text-lg font-medium text-gray-900">Kalendar tez orada</h3>
          <p class="mt-2 text-gray-500">Uchrashuvlar kalendari ishlab chiqilmoqda</p>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import MainLayout from '@/layouts/MainLayout.vue'
import { CalendarDaysIcon, PlusIcon } from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.userRole === 'admin')
</script>
