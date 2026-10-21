<template>
  <SuperAdminLayout>
    <div class="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div class="flex items-center gap-4">
        <router-link
          :to="{ name: 'admin-doctor-bots' }"
          class="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeftIcon class="w-5 h-5" />
        </router-link>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ isEdit ? t('doctorBots.editTitle') : t('doctorBots.newTitle') }}
          </h1>
          <p class="text-gray-500">{{ t('doctorBots.formHint') }}</p>
        </div>
      </div>

      <div v-if="loading" class="p-12 text-center text-gray-500">
        {{ t('superAdmin.loading') }}
      </div>
      <DoctorBotForm
        v-else
        :bot-id="botId"
        :initial="initial"
        :doctors="doctors"
        :saving="saving"
        :error="error"
        @submit="onSubmit"
      />
    </div>
  </SuperAdminLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import SuperAdminLayout from '@/layouts/SuperAdminLayout.vue'
import DoctorBotForm from '@/components/superadmin/DoctorBotForm.vue'
import { useToast } from '@/composables/useToast'
import {
  activateDoctorBot,
  getDoctorBot,
  listAllDoctorsForBots,
} from '@/services/doctorBotsService'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const botId = computed(() => String(route.params.id || ''))
const isEdit = computed(() => Boolean(botId.value))
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const doctors = ref([])
const initial = ref(null)

onMounted(async () => {
  loading.value = true
  const [doctorResult, botResult] = await Promise.all([
    listAllDoctorsForBots(),
    isEdit.value ? getDoctorBot(botId.value) : Promise.resolve({ data: null, error: null }),
  ])
  doctors.value = doctorResult.data || []
  if (doctorResult.error) error.value = doctorResult.error
  if (botResult.error) error.value = botResult.error
  initial.value = botResult.data
  loading.value = false
})

async function onSubmit(form) {
  error.value = ''
  saving.value = true
  const result = await activateDoctorBot({
    ...form,
    id: botId.value || undefined,
  })
  saving.value = false
  if (result.error) {
    error.value = result.error
    toast.error(result.error)
    return
  }
  toast.success(t('doctorBots.activated'))
  router.push({ name: 'admin-doctor-bots' })
}
</script>
