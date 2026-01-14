<template>
  <MainLayout>
    <div class="space-y-6 animate-fade-in">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Sozlamalar</h1>
        <p class="text-gray-500">Tizim sozlamalari</p>
      </div>

      <div class="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
        <div class="text-center py-12">
          <Cog6ToothIcon class="w-16 h-16 text-gray-300 mx-auto" />
          <h3 class="mt-4 text-lg font-medium text-gray-900">Sozlamalar tez orada</h3>
          <p class="mt-2 text-gray-500">Sozlamalar moduli ishlab chiqilmoqda</p>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from '@/layouts/MainLayout.vue'
import { Cog6ToothIcon } from '@heroicons/vue/24/outline'
</script>
