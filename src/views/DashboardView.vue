<template>
  <MainLayout>
    <!-- Admin Dashboard -->
    <AdminDashboard v-if="isAdmin" />

    <!-- Doctor Dashboard -->
    <DoctorDashboard v-else-if="isDoctor" />

    <!-- Solo Dashboard -->
    <div v-else-if="isSolo" class="space-y-8">
      <AdminDashboard />
      <DoctorDashboard />
    </div>
  </MainLayout>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import MainLayout from '@/layouts/MainLayout.vue'
import AdminDashboard from '@/views/AdminDashboard.vue'
import DoctorDashboard from '@/views/DoctorDashboard.vue'

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.userRole === 'admin')
const isDoctor = computed(() => authStore.userRole === 'doctor')
const isSolo = computed(() => authStore.userRole === 'solo')
</script>
