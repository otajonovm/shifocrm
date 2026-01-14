<template>
  <MainLayout>
    <div class="space-y-6 animate-fade-in">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Xizmatlar</h1>
          <p class="text-gray-500">Xizmatlar ro'yxati va narxlari</p>
        </div>
        <button class="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-cyan-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all">
          <PlusIcon class="w-5 h-5" />
          Yangi Xizmat
        </button>
      </div>

      <div class="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
        <div class="text-center py-12">
          <ClipboardDocumentListIcon class="w-16 h-16 text-gray-300 mx-auto" />
          <h3 class="mt-4 text-lg font-medium text-gray-900">Xizmatlar tez orada</h3>
          <p class="mt-2 text-gray-500">Xizmatlar moduli ishlab chiqilmoqda</p>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from '@/layouts/MainLayout.vue'
import { ClipboardDocumentListIcon, PlusIcon } from '@heroicons/vue/24/outline'
</script>
