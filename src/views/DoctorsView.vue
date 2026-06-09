<template>
  <MainLayout>
    <EmployeeManagement />
  </MainLayout>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { canAccessAdminRoutes } from '@/lib/roles'
import MainLayout from '@/layouts/MainLayout.vue'
import EmployeeManagement from '@/components/staff/EmployeeManagement.vue'

const authStore = useAuthStore()
const router = useRouter()

onMounted(() => {
  if (!canAccessAdminRoutes(authStore)) {
    router.replace({ name: 'dashboard' })
  }
})
</script>
