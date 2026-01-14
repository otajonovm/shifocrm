<template>
  <MainLayout>
    <!-- Admin Dashboard -->
    <AdminDashboard v-if="authStore.userRole === 'admin'" />

    <!-- Doctor Dashboard -->
    <DoctorDashboard v-else-if="authStore.userRole === 'doctor'" />
  </MainLayout>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import MainLayout from '@/layouts/MainLayout.vue'
import AdminDashboard from '@/views/AdminDashboard.vue'
import DoctorDashboard from '@/views/DoctorDashboard.vue'

const authStore = useAuthStore()
</script>
