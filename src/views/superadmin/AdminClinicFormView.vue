<template>
  <SuperAdminLayout>
    <div class="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div class="flex items-center gap-4">
        <router-link
          :to="{ name: 'admin-clinics' }"
          class="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeftIcon class="w-5 h-5" />
        </router-link>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ isEdit ? t('superAdmin.editClinic') : t('superAdmin.createClinic') }}
          </h1>
          <p class="text-gray-500">
            {{ isEdit ? t('superAdmin.editClinic') : t('superAdmin.createClinic') }}
          </p>
        </div>
      </div>

      <!-- Klinika kirish ma'lumotlari (edit) -->
      <div
        v-if="isEdit && clinic"
        class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3"
      >
        <h3 class="text-sm font-semibold text-emerald-900">Klinika boshlig'i kirish ma'lumotlari</h3>
        <p class="text-xs text-emerald-700">Klinika ID va Login — kirish uchun. Parolni faqat pastda o'zgartirish mumkin.</p>
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">{{ t('superAdmin.clinicId') }}:</span>
            <code class="flex-1 px-2 py-1 bg-white rounded border border-emerald-200 text-sm font-mono">{{ clinic.id }}</code>
            <button
              type="button"
              @click="copyToClipboard(String(clinic.id))"
              class="shrink-0 px-2 py-1 text-xs font-medium text-emerald-700 bg-white border border-emerald-200 rounded hover:bg-emerald-100"
            >
              {{ t('superAdmin.copy') }}
            </button>
          </div>
          <div v-if="clinicOwner?.login" class="flex items-center gap-2">
            <span class="text-sm text-gray-600">Boshliq login:</span>
            <code class="flex-1 px-2 py-1 bg-white rounded border border-emerald-200 text-sm font-mono">{{ clinicOwner.login }}</code>
            <button
              type="button"
              @click="copyToClipboard(clinicOwner.login)"
              class="shrink-0 px-2 py-1 text-xs font-medium text-emerald-700 bg-white border border-emerald-200 rounded hover:bg-emerald-100"
            >
              {{ t('superAdmin.copy') }}
            </button>
          </div>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="bg-white rounded-2xl shadow-card border border-gray-100 p-6 space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('superAdmin.name') }} *</label>
          <input
            v-model="form.name"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            :placeholder="t('superAdmin.name')"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('superAdmin.slug') }} *</label>
          <input
            v-model="form.slug"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            :placeholder="t('superAdmin.slugPlaceholder')"
          />
          <p class="mt-1 text-xs text-gray-500">{{ t('superAdmin.slugHint') }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('superAdmin.maxDoctors') }}</label>
          <input
            v-model.number="form.max_doctors"
            type="number"
            min="1"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('superAdmin.logoUrl') }}</label>
          <input
            v-model="form.logo_url"
            type="url"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="https://..."
          />
        </div>

        <div class="pt-4 border-t border-gray-200 space-y-4">
          <h3 class="text-sm font-semibold text-gray-900">Klinika boshlig'i (Super Admin) login/paroli</h3>
          <p class="text-sm text-gray-500">Ushbu login/parol bilan faqat shu klinika boshqariladi.</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Login {{ isEdit ? '' : '*' }}
              </label>
              <input
                v-model="form.owner_login"
                type="text"
                :required="!isEdit"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Masalan: boss-1"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Parol {{ isEdit ? "(o'zgartirmasangiz bo'sh qoldiring)" : '*' }}
              </label>
              <input
                v-model="form.owner_password"
                type="password"
                :required="!isEdit"
                autocomplete="new-password"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                :placeholder="isEdit ? 'Yangilash uchun kiriting' : ''"
              />
            </div>
          </div>
        </div>


        <div v-if="isEdit && clinic?.is_active !== false" class="pt-2">
          <button
            type="button"
            @click="handleSuspend"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-700 bg-rose-50 rounded-lg hover:bg-rose-100"
          >
            <NoSymbolIcon class="w-5 h-5" />
            {{ t('superAdmin.suspend') }}
          </button>
        </div>

        <div class="flex gap-3 pt-2">
          <button
            type="submit"
            :disabled="saving"
            class="px-4 py-2.5 bg-gradient-to-r from-primary-500 to-cyan-600 text-white font-medium rounded-lg hover:shadow-lg disabled:opacity-50"
          >
            {{ saving ? t('superAdmin.loading') : t('superAdmin.save') }}
          </button>
          <router-link
            :to="{ name: 'admin-clinics' }"
            class="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
          >
            {{ t('superAdmin.cancel') }}
          </router-link>
        </div>
      </form>

      <!-- Klinika yaratilgach: ID, Login, Parol ko'rsatish -->
      <div
        v-if="showCredentialsModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="closeCredentialsModal"
      >
        <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
          <h3 class="text-lg font-bold text-gray-900">Klinika boshlig'i uchun kirish ma'lumotlari</h3>
          <p class="text-sm text-gray-600">Ushbu login/parol bilan faqat shu klinika boshqariladi.</p>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">{{ t('superAdmin.clinicId') }}</label>
              <div class="flex gap-2">
                <code class="flex-1 px-3 py-2 bg-gray-100 rounded-lg font-mono text-sm">{{ createdCredentials.clinicId }}</code>
                <button type="button" @click="copyToClipboard(String(createdCredentials.clinicId))" class="px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100">
                  {{ t('superAdmin.copy') }}
                </button>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Login</label>
              <div class="flex gap-2">
                <code class="flex-1 px-3 py-2 bg-gray-100 rounded-lg font-mono text-sm">{{ createdCredentials.login }}</code>
                <button type="button" @click="copyToClipboard(createdCredentials.login)" class="px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100">
                  {{ t('superAdmin.copy') }}
                </button>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Parol</label>
              <div class="flex gap-2">
                <code class="flex-1 px-3 py-2 bg-amber-50 rounded-lg font-mono text-sm">{{ createdCredentials.password }}</code>
                <button type="button" @click="copyToClipboard(createdCredentials.password)" class="px-3 py-2 text-sm font-medium text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200">
                  {{ t('superAdmin.copy') }}
                </button>
              </div>
            </div>
          </div>
          <div class="flex justify-end pt-2">
            <button
              type="button"
              @click="closeCredentialsModal"
              class="px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700"
            >
              {{ t('superAdmin.gotIt') }}
            </button>
          </div>
        </div>
      </div>

    </div>
  </SuperAdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'
import SuperAdminLayout from '@/layouts/SuperAdminLayout.vue'
import {
  getClinic,
  createClinic,
  updateClinic,
  suspendClinic,
  getClinicOwnerByClinic,
  createClinicOwner,
  updateClinicOwner,
} from '@/services/adminService'
import { ArrowLeftIcon, NoSymbolIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const toast = useToast()

const clinic = ref(null)
const clinicOwner = ref(null)
const saving = ref(false)
const showCredentialsModal = ref(false)
const createdCredentials = ref({ clinicId: '', login: '', password: '' })
const form = ref({
  name: '',
  slug: '',
  max_doctors: 4,
  logo_url: '',
  owner_login: '',
  owner_password: '',
})

const isEdit = computed(() => !!route.params.id)

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success(t('superAdmin.copied'))
  }).catch(() => {})
}

function closeCredentialsModal() {
  showCredentialsModal.value = false
  createdCredentials.value = { clinicId: '', login: '', password: '' }
  router.push({ name: 'admin-clinics' })
}

onMounted(async () => {
  if (!isEdit.value) return
  const id = Number(route.params.id)
  if (!Number.isFinite(id)) return
  try {
    const [clinicData, ownerData] = await Promise.all([
      getClinic(id),
      getClinicOwnerByClinic(id),
    ])
    clinic.value = clinicData
    clinicOwner.value = ownerData
    if (clinic.value) {
      form.value = {
        name: clinic.value.name || '',
        slug: clinic.value.slug || '',
        max_doctors: clinic.value.max_doctors ?? 4,
        logo_url: clinic.value.logo_url || '',
        owner_login: ownerData?.login || '',
        owner_password: '',
      }
    }
  } catch (e) {
    toast.error(e?.message || 'Failed to load clinic')
  }
})

async function handleSubmit() {
  saving.value = true
  try {
    let clinicId
    const login = (form.value.owner_login || '').trim()
    const password = (form.value.owner_password || '').trim()
    if (isEdit.value) {
      await updateClinic(route.params.id, {
        name: form.value.name,
        slug: form.value.slug,
        max_doctors: form.value.max_doctors,
        logo_url: form.value.logo_url || null,
      })
      clinicId = Number(route.params.id)
      if (!login) {
        throw new Error("Boshliq login majburiy")
      }
      if (clinicOwner.value?.id) {
        const payload = { login }
        if (password) payload.password = password
        await updateClinicOwner(clinicOwner.value.id, payload)
      } else {
        if (!password) throw new Error("Boshliq paroli majburiy")
        await createClinicOwner(clinicId, { login, password })
      }
      toast.success(t('superAdmin.saved'))
      router.push({ name: 'admin-clinics' })
      return
    }

    const created = await createClinic({
      name: form.value.name,
      slug: form.value.slug,
      max_doctors: form.value.max_doctors,
      logo_url: form.value.logo_url || null,
    })
    clinicId = created?.id ? Number(created.id) : null
    if (!clinicId) throw new Error('Klinika yaratilmadi')
    if (!login || !password) {
      throw new Error("Boshliq login va paroli majburiy")
    }
    await createClinicOwner(clinicId, { login, password })
    toast.success(t('superAdmin.saved'))
    createdCredentials.value = { clinicId, login, password }
    showCredentialsModal.value = true
  } catch (e) {
    toast.error(e?.message || 'Save failed')
  } finally {
    saving.value = false
  }
}

async function handleSuspend() {
  if (!confirm(t('superAdmin.suspendConfirm'))) return
  const id = Number(route.params.id)
  if (!Number.isFinite(id)) return
  try {
    await suspendClinic(id)
    toast.success(t('superAdmin.suspendDone'))
    clinic.value = await getClinic(id)
  } catch (e) {
    toast.error(e?.message || 'Suspend failed')
  }
}
</script>
