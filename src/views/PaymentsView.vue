<template>
  <MainLayout>
    <div class="space-y-6 animate-fade-in">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">To'lovlar</h1>
          <p class="text-gray-500">Moliyaviy hisobotlar va to'lovlar</p>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
        <div class="text-center py-12">
          <CreditCardIcon class="w-16 h-16 text-gray-300 mx-auto" />
          <h3 class="mt-4 text-lg font-medium text-gray-900">To'lovlar tez orada</h3>
          <p class="mt-2 text-gray-500">To'lovlar moduli ishlab chiqilmoqda</p>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from '@/layouts/MainLayout.vue'
import { CreditCardIcon } from '@heroicons/vue/24/outline'
</script>
