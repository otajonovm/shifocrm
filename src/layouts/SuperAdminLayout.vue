<template>
  <div class="min-h-screen bg-gray-50">
    <header class="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 sm:px-6">
      <div class="flex items-center gap-4">
        <router-link to="/admin/clinics" class="text-xl font-bold text-gray-900">
          {{ t('superAdmin.title') }}
        </router-link>
        <nav class="hidden sm:flex items-center gap-2">
          <router-link
            to="/admin/clinics"
            class="px-3 py-2 text-sm font-medium rounded-lg"
            :class="$route.path.startsWith('/admin/clinics') ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'"
          >
            {{ t('superAdmin.clinics') }}
          </router-link>
        </nav>
      </div>
      <div class="flex items-center gap-2">
        <router-link
          to="/dashboard"
          class="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          {{ t('superAdmin.backToApp') }}
        </router-link>
        <button
          @click="handleLogout"
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
        >
          <ArrowRightOnRectangleIcon class="w-5 h-5" />
          {{ t('common.logout') }}
        </button>
      </div>
    </header>
    <main class="p-4 sm:p-6 lg:p-8">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const router = useRouter()
const { t } = useI18n()

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>
