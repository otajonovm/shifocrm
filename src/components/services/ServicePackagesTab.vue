<template>
  <div class="space-y-4">
    <div class="flex justify-end">
      <button
        v-if="canEdit"
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        @click="openModal()"
      >
        <PlusIcon class="w-5 h-5" />
        {{ t('services.newPackage') }}
      </button>
    </div>

    <div v-if="loading" class="py-8 text-center text-slate-500 text-sm">{{ t('services.loading') }}</div>
    <div v-else-if="packages.length === 0" class="rounded-xl border border-dashed border-slate-200 p-8 text-center">
      <p class="font-medium text-slate-700">{{ t('services.packagesEmptyTitle') }}</p>
      <p class="text-sm text-slate-500 mt-1">{{ t('services.packagesEmptyHint') }}</p>
    </div>
    <div v-else class="grid gap-4 md:grid-cols-2">
      <div
        v-for="pkg in packages"
        :key="pkg.id"
        class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div class="flex items-start justify-between gap-2">
          <div>
            <h3 class="font-semibold text-slate-900">{{ pkg.name }}</h3>
            <p class="text-sm text-slate-500 mt-0.5">{{ pkg.description || '—' }}</p>
            <p class="text-sm font-medium text-primary-600 mt-2">{{ formatCurrency(pkg.package_price) }}</p>
            <p class="text-xs mt-1" :class="pkg.is_active ? 'text-emerald-600' : 'text-slate-400'">
              {{ pkg.is_active ? t('services.active') : t('services.inactive') }}
            </p>
          </div>
          <div v-if="canEdit" class="flex gap-1">
            <button class="p-2 text-primary-600 hover:bg-primary-50 rounded-lg" @click="openModal(pkg)">
              <PencilSquareIcon class="w-4 h-4" />
            </button>
            <button class="p-2 text-rose-600 hover:bg-rose-50 rounded-lg" @click="remove(pkg)">
              <TrashIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
        <ul class="mt-3 space-y-1 text-sm text-slate-600 border-t border-slate-100 pt-3">
          <li v-for="item in itemsByPackage[pkg.id] || []" :key="item.id">
            {{ serviceName(item.service_id) }} × {{ item.quantity }}
          </li>
          <li v-if="!(itemsByPackage[pkg.id] || []).length" class="text-slate-400">{{ t('services.noPackageItems') }}</li>
        </ul>
      </div>
    </div>

    <Transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto" @click.self="closeModal">
        <div class="flex items-center justify-center min-h-screen px-4 py-8">
          <div class="fixed inset-0 bg-gray-500/75" />
          <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h3 class="text-lg font-semibold">{{ form.id ? t('services.editPackage') : t('services.newPackage') }}</h3>
            <input v-model="form.name" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" :placeholder="t('services.packageName')" />
            <textarea v-model="form.description" rows="2" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" :placeholder="t('services.notes')" />
            <input v-model.number="form.package_price" type="number" min="0" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" :placeholder="t('services.price')" />
            <label class="flex items-center gap-2 text-sm">
              <input v-model="form.is_active" type="checkbox" class="rounded" />
              {{ t('services.active') }}
            </label>
            <div class="border-t border-gray-100 pt-3 space-y-2">
              <p class="text-sm font-medium text-gray-700">{{ t('services.packageItems') }}</p>
              <div v-for="(row, idx) in form.items" :key="idx" class="flex gap-2">
                <select v-model="row.service_id" class="flex-1 rounded-lg border border-gray-200 px-2 py-2 text-sm">
                  <option value="">{{ t('services.selectService') }}</option>
                  <option v-for="s in services" :key="s.id" :value="String(s.id)">{{ s.name }}</option>
                </select>
                <input v-model.number="row.quantity" type="number" min="1" class="w-20 rounded-lg border border-gray-200 px-2 py-2 text-sm" />
                <button type="button" class="text-rose-500 px-2" @click="form.items.splice(idx, 1)">×</button>
              </div>
              <button type="button" class="text-sm text-primary-600" @click="form.items.push({ service_id: '', quantity: 1 })">
                + {{ t('services.addItem') }}
              </button>
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button class="px-4 py-2 rounded-lg border border-gray-300" @click="closeModal">{{ t('services.cancel') }}</button>
              <button class="px-4 py-2 rounded-lg bg-primary-600 text-white" @click="save">{{ t('services.save') }}</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/vue/24/outline'
import {
  listPackages,
  createPackage,
  updatePackage,
  deletePackage,
  listPackageItemsByPackageId,
  createPackageItem,
  deletePackageItem,
} from '@/api/servicesApi'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  services: { type: Array, default: () => [] },
  canEdit: { type: Boolean, default: false },
})

const { t } = useI18n()
const toast = useToast()
const loading = ref(false)
const packages = ref([])
const itemsByPackage = ref({})
const showModal = ref(false)
const form = reactive({
  id: null,
  name: '',
  description: '',
  package_price: 0,
  is_active: true,
  items: [{ service_id: '', quantity: 1 }],
})

const serviceName = (id) => props.services.find((s) => Number(s.id) === Number(id))?.name || `#${id}`

const formatCurrency = (amount) => {
  if (amount == null) return '—'
  return new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 })
    .format(amount).replace('UZS', t('common.currencySuffix'))
}

async function load() {
  loading.value = true
  try {
    packages.value = await listPackages('order=created_at.desc')
    const map = {}
    for (const pkg of packages.value) {
      map[pkg.id] = await listPackageItemsByPackageId(pkg.id)
    }
    itemsByPackage.value = map
  } catch (e) {
    console.error(e)
    packages.value = []
  } finally {
    loading.value = false
  }
}

function openModal(pkg = null) {
  if (!props.canEdit) return
  if (pkg) {
    form.id = pkg.id
    form.name = pkg.name || ''
    form.description = pkg.description || ''
    form.package_price = Number(pkg.package_price) || 0
    form.is_active = pkg.is_active !== false
    const items = (itemsByPackage.value[pkg.id] || []).map((i) => ({
      service_id: String(i.service_id),
      quantity: Number(i.quantity) || 1,
      existingId: i.id,
    }))
    form.items = items.length ? items : [{ service_id: '', quantity: 1 }]
  } else {
    form.id = null
    form.name = ''
    form.description = ''
    form.package_price = 0
    form.is_active = true
    form.items = [{ service_id: '', quantity: 1 }]
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function save() {
  if (!form.name.trim()) {
    toast.error(t('services.errorNameRequired'))
    return
  }
  try {
    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
      package_price: Number(form.package_price) || 0,
      is_active: Boolean(form.is_active),
    }
    let pkgId = form.id
    if (pkgId) {
      await updatePackage(pkgId, payload)
      const oldItems = itemsByPackage.value[pkgId] || []
      for (const item of oldItems) await deletePackageItem(item.id)
    } else {
      const created = await createPackage(payload)
      pkgId = created.id
    }
    for (const row of form.items) {
      if (!row.service_id) continue
      await createPackageItem({
        package_id: pkgId,
        service_id: Number(row.service_id),
        quantity: Number(row.quantity) || 1,
      })
    }
    toast.success(t('services.toastCreated'))
    closeModal()
    await load()
  } catch (e) {
    console.error(e)
    toast.error(t('services.errorSave'))
  }
}

async function remove(pkg) {
  if (!window.confirm(t('services.confirmDelete'))) return
  try {
    await deletePackage(pkg.id)
    toast.success(t('services.toastDeleted'))
    await load()
  } catch (e) {
    toast.error(t('services.errorDelete'))
  }
}

onMounted(load)
defineExpose({ reload: load })
</script>
