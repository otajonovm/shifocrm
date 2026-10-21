<template>
  <SuperAdminLayout>
    <div class="space-y-6 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ t('doctorBots.title') }}</h1>
          <p class="text-gray-500">{{ t('doctorBots.subtitle') }}</p>
        </div>
        <router-link
          :to="{ name: 'admin-doctor-bots-new' }"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-cyan-600 text-white font-medium rounded-lg shadow hover:shadow-lg transition-all"
        >
          <PlusIcon class="w-5 h-5" />
          {{ t('doctorBots.newBot') }}
        </router-link>
      </div>

      <div class="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div v-if="loading" class="p-12 text-center text-gray-500">
          {{ t('superAdmin.loading') }}
        </div>
        <div v-else-if="error" class="p-12 text-center text-rose-600">
          {{ error }}
        </div>
        <div v-else-if="!bots.length" class="p-12 text-center text-gray-500">
          {{ t('doctorBots.empty') }}
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{{ t('doctorBots.doctor') }}</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{{ t('doctorBots.botUsername') }}</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{{ t('doctorBots.cashbackPercent') }}</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{{ t('doctorBots.token') }}</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{{ t('superAdmin.status') }}</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{{ t('superAdmin.actions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="bot in bots" :key="bot.id" class="hover:bg-gray-50">
                <td class="px-4 py-3">
                  <p class="font-medium text-gray-900">{{ bot.doctor_name || bot.doctor_id }}</p>
                  <p class="text-xs text-gray-500">{{ bot.clinic_name }}</p>
                </td>
                <td class="px-4 py-3 font-mono text-gray-700">{{ bot.bot_username }}</td>
                <td class="px-4 py-3 text-gray-700">{{ bot.cashback_percent }}% / {{ bot.max_spend_percent }}%</td>
                <td class="px-4 py-3 font-mono text-gray-500">{{ maskBotToken(bot.bot_token_last4) }}</td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="bot.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'"
                  >
                    {{ bot.is_active ? t('superAdmin.active') : t('superAdmin.inactive') }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right whitespace-nowrap">
                  <router-link
                    :to="{ name: 'admin-doctor-bots-edit', params: { id: bot.id } }"
                    class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 mr-2"
                  >
                    <PencilSquareIcon class="w-4 h-4" />
                    {{ t('superAdmin.edit') }}
                  </router-link>
                  <button
                    v-if="bot.is_active"
                    type="button"
                    class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-amber-800 bg-amber-50 rounded-lg hover:bg-amber-100 mr-2"
                    @click="onDeactivate(bot)"
                  >
                    {{ t('doctorBots.deactivate') }}
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-rose-700 bg-rose-50 rounded-lg hover:bg-rose-100"
                    @click="onDelete(bot)"
                  >
                    {{ t('doctorBots.delete') }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </SuperAdminLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { PencilSquareIcon, PlusIcon } from '@heroicons/vue/24/outline'
import SuperAdminLayout from '@/layouts/SuperAdminLayout.vue'
import { useToast } from '@/composables/useToast'
import { maskBotToken } from '@/lib/dedicatedBot'
import {
  deactivateDoctorBot,
  deleteDoctorBot,
  listDoctorBots,
} from '@/services/doctorBotsService'

const { t } = useI18n()
const toast = useToast()
const loading = ref(true)
const error = ref('')
const bots = ref([])

async function load() {
  loading.value = true
  error.value = ''
  const result = await listDoctorBots()
  bots.value = result.data || []
  error.value = result.error || ''
  loading.value = false
}

onMounted(load)

async function onDeactivate(bot) {
  if (!window.confirm(t('doctorBots.deactivateConfirm'))) return
  const result = await deactivateDoctorBot({ id: bot.id, doctorId: bot.doctor_id })
  if (result.error) {
    toast.error(result.error)
    return
  }
  toast.success(t('doctorBots.deactivated'))
  await load()
}

async function onDelete(bot) {
  if (!window.confirm(t('doctorBots.deleteConfirm'))) return
  const result = await deleteDoctorBot({ id: bot.id, doctorId: bot.doctor_id })
  if (result.error) {
    toast.error(result.error)
    return
  }
  toast.success(t('doctorBots.deleted'))
  await load()
}
</script>
