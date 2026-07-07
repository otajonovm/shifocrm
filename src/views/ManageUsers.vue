<template>
  <MainLayout>
    <div class="space-y-6 pb-8 animate-fade-in">
      <section class="rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
              {{ t('manageUsers.eyebrow') }}
            </p>
            <h1 class="mt-2 text-2xl font-bold text-gray-900">{{ t('manageUsers.title') }}</h1>
            <p class="mt-1 text-sm text-gray-500">{{ t('manageUsers.subtitle') }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <label class="inline-flex items-center gap-2 text-sm text-gray-600">
              <input
                v-model="showInactive"
                type="checkbox"
                class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              {{ t('manageUsers.showInactive') }}
            </label>
            <input
              v-model="searchQuery"
              type="search"
              :placeholder="t('manageUsers.searchPlaceholder')"
              class="w-full sm:w-64 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
        </div>
      </section>

      <div
        v-if="errorMessage"
        class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
      >
        {{ errorMessage }}
      </div>

      <div
        v-if="successMessage"
        class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
      >
        {{ successMessage }}
      </div>

      <section class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
        <div v-if="loading" class="p-8 text-center text-sm text-gray-500">
          {{ t('manageUsers.loading') }}
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-100 text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {{ t('manageUsers.fullName') }}
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {{ t('manageUsers.phone') }}
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {{ t('manageUsers.type') }}
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {{ t('manageUsers.status') }}
                </th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {{ t('manageUsers.actions') }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-if="filteredUsers.length === 0">
                <td colspan="5" class="px-4 py-8 text-center text-gray-500">
                  {{ t('manageUsers.empty') }}
                </td>
              </tr>
              <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-gray-50/80">
                <td class="px-4 py-4">
                  <p class="font-medium text-gray-900">{{ user.fullName || '—' }}</p>
                  <p v-if="user.email" class="text-xs text-gray-500">{{ user.email }}</p>
                </td>
                <td class="px-4 py-4 text-gray-700">{{ user.phone || '—' }}</td>
                <td class="px-4 py-4">
                  <span class="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                    {{ accountTypeLabel(user) }}
                  </span>
                </td>
                <td class="px-4 py-4">
                  <span
                    class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                    :class="user.isActive
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-500'"
                  >
                    {{ user.isActive ? t('manageUsers.active') : t('manageUsers.inactive') }}
                  </span>
                </td>
                <td class="px-4 py-4">
                  <div class="flex justify-end gap-2">
                    <button
                      type="button"
                      class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      @click="openEdit(user)"
                    >
                      {{ t('manageUsers.edit') }}
                    </button>
                    <button
                      type="button"
                      class="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                      @click="confirmDelete(user)"
                    >
                      {{ t('manageUsers.delete') }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div
        v-if="editModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="closeEdit"
      >
        <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <h2 class="text-lg font-semibold text-gray-900">{{ t('manageUsers.editTitle') }}</h2>
          <form class="mt-5 space-y-4" @submit.prevent="saveEdit">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">{{ t('manageUsers.fullName') }}</label>
              <input
                v-model="editForm.fullName"
                type="text"
                required
                class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">{{ t('manageUsers.phone') }}</label>
              <input
                v-model="editForm.phone"
                type="tel"
                class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input
                v-model="editForm.isActive"
                type="checkbox"
                class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              {{ t('manageUsers.active') }}
            </label>
            <div class="flex justify-end gap-2 pt-2">
              <button
                type="button"
                class="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                @click="closeEdit"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                type="submit"
                class="rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
                :disabled="saving"
              >
                {{ saving ? t('manageUsers.saving') : t('common.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div
        v-if="deleteTarget"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="deleteTarget = null"
      >
        <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <h2 class="text-lg font-semibold text-gray-900">{{ t('manageUsers.deleteTitle') }}</h2>
          <p class="mt-2 text-sm text-gray-600">
            {{ t('manageUsers.deleteConfirm', { name: deleteTarget.fullName || deleteTarget.email || '—' }) }}
          </p>
          <div class="mt-6 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              @click="deleteTarget = null"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="button"
              class="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
              :disabled="saving"
              @click="performDelete"
            >
              {{ saving ? t('manageUsers.deleting') : t('manageUsers.delete') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/layouts/MainLayout.vue'
import {
  listManagedUsers,
  updateManagedUser,
  deleteManagedUser,
} from '@/services/userManagementService'
import { useAuthStore } from '@/stores/auth'
import { isGlobalSuperAdmin } from '@/lib/roles'

const { t } = useI18n()
const authStore = useAuthStore()

const users = ref([])
const loading = ref(true)
const saving = ref(false)
const showInactive = ref(true)
const searchQuery = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const editModalOpen = ref(false)
const editForm = ref({ id: null, fullName: '', phone: '', isActive: true })
const deleteTarget = ref(null)

const filteredUsers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter((user) => {
    const haystack = [user.fullName, user.phone, user.email, user.role, user.memberRole]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
})

const accountTypeLabel = (user) => {
  if (user.accountType === 'individual') return t('manageUsers.typeSolo')
  if (user.memberRole === 'owner') return t('manageUsers.typeOwner')
  if (user.memberRole === 'admin') return t('manageUsers.typeAdmin')
  if (user.memberRole === 'doctor') return t('manageUsers.typeDoctor')
  return user.role || user.accountType || '—'
}

const loadUsers = async () => {
  loading.value = true
  errorMessage.value = ''
  const clinicId = isGlobalSuperAdmin(authStore) ? null : authStore.userClinicId
  const { data, error } = await listManagedUsers({
    clinicId,
    includeInactive: showInactive.value,
  })
  loading.value = false
  if (error) {
    errorMessage.value = error.message
    users.value = []
    return
  }
  users.value = data || []
}

const openEdit = (user) => {
  editForm.value = {
    id: user.id,
    fullName: user.fullName || '',
    phone: user.phone || '',
    isActive: user.isActive,
  }
  editModalOpen.value = true
}

const closeEdit = () => {
  editModalOpen.value = false
}

const saveEdit = async () => {
  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  const { error } = await updateManagedUser(editForm.value.id, {
    fullName: editForm.value.fullName,
    phone: editForm.value.phone,
    isActive: editForm.value.isActive,
  })
  saving.value = false
  if (error) {
    errorMessage.value = error.message
    return
  }
  successMessage.value = t('manageUsers.saved')
  closeEdit()
  await loadUsers()
}

const confirmDelete = (user) => {
  deleteTarget.value = user
}

const performDelete = async () => {
  if (!deleteTarget.value) return
  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  const { error } = await deleteManagedUser(deleteTarget.value.id)
  saving.value = false
  if (error) {
    errorMessage.value = error.message
    return
  }
  successMessage.value = t('manageUsers.deleted')
  deleteTarget.value = null
  await loadUsers()
}

watch(showInactive, () => {
  loadUsers()
})

onMounted(() => {
  loadUsers()
})
</script>
