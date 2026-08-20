<template>
  <router-view v-slot="{ Component, route }">
    <KeepAlive :key="sessionKey" :include="keepAliveInclude" :max="keepAliveMax">
      <component :is="Component" :key="keepAliveKey(route)" />
    </KeepAlive>
  </router-view>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { KEEP_ALIVE_VIEWS, keepAliveKey } from '@/lib/keepAliveViews'

const authStore = useAuthStore()
const keepAliveInclude = computed(() => (
  authStore.isAuthenticated ? KEEP_ALIVE_VIEWS : []
))
const keepAliveMax = computed(() => Math.max(keepAliveInclude.value.length, 12))
const sessionKey = computed(() => (
  String(authStore.user?.id || authStore.userEmail || authStore.userClinicId || 'anon')
))
</script>
