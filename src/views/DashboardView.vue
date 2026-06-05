<template>
  <MainLayout>
    <AdminDashboard v-if="isAdmin" />
    <DoctorDashboard v-else-if="isDoctor" />
    <SoloDashboard v-else-if="isSolo" />
  </MainLayout>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import MainLayout from '@/layouts/MainLayout.vue'
import AdminDashboard from '@/views/AdminDashboard.vue'
import DoctorDashboard from '@/views/DoctorDashboard.vue'
import SoloDashboard from '@/views/SoloDashboard.vue'

const authStore = useAuthStore()
const isClinicScopedSuperAdmin = computed(() => authStore.userRole === 'super_admin' && authStore.superAdminScope === 'clinic')
const isAdmin = computed(() => authStore.userRole === 'admin' || isClinicScopedSuperAdmin.value)
const isDoctor = computed(() => authStore.userRole === 'doctor')
const isSolo = computed(() => authStore.userRole === 'solo')
</script>
