<template>
  <MainLayout>
    <div class="mx-auto max-w-lg py-16 text-center">
      <div class="rounded-2xl border border-amber-200 bg-amber-50 p-8">
        <ShieldExclamationIcon class="mx-auto h-12 w-12 text-amber-600" />
        <h1 class="mt-4 text-xl font-bold text-slate-900">Ruxsat yetarli emas</h1>
        <p class="mt-2 text-sm text-slate-600">
          Ushbu bo'lim yoki amal uchun rahbaringizdan ruxsat so'rang.
          Agar barcha rollar yopilgan bo'lsa, tizimdan chiqing va rahbarga murojaat qiling.
        </p>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ShieldExclamationIcon } from '@heroicons/vue/24/outline'
import MainLayout from '@/layouts/MainLayout.vue'
</script>
