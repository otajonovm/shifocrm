<template>
  <div class="space-y-4">
    <div class="flex justify-end">
      <button
        v-if="canEdit"
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
        @click="openModal()"
      >
        <PlusIcon class="w-5 h-5" />
        {{ t('services.newDiscount') }}
      </button>
    </div>

    <div v-if="loading" class="py-8 text-center text-slate-500 text-sm">{{ t('services.loading') }}</div>
    <div v-else-if="rules.length === 0" class="rounded-xl border border-dashed border-violet-200 bg-violet-50/30 p-8 text-center">
      <p class="font-medium text-slate-700">{{ t('services.discountsEmptyTitle') }}</p>
      <p class="text-sm text-slate-500 mt-1">{{ t('services.discountsEmptyHint') }}</p>
    </div>
    <div v-else class="overflow-x-auto rounded-xl border border-slate-200">
      <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th class="px-4 py-3">{{ t('services.discountName') }}</th>
            <th class="px-4 py-3">{{ t('services.discountType') }}</th>
            <th class="px-4 py-3">{{ t('services.scope') }}</th>
            <th class="px-4 py-3">{{ t('services.status') }}</th>
            <th v-if="canEdit" class="px-4 py-3 text-right">{{ t('services.actions') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="rule in rules" :key="rule.id">
            <td class="px-4 py-3 font-medium text-slate-800">{{ rule.name }}</td>
            <td class="px-4 py-3 text-slate-600">
              {{ rule.discount_type === 'percent' ? t('services.discountPercent') : t('services.discountFixed') }}
              — {{ rule.discount_value }}{{ rule.discount_type === 'percent' ? '%' : '' }}
            </td>
            <td class="px-4 py-3 text-slate-600">
              {{ t(`services.scopeLabel.${rule.scope}`) || rule.scope }}
              <span v-if="rule.scope_ref" class="text-xs text-slate-400">({{ rule.scope_ref }})</span>
            </td>
            <td class="px-4 py-3">
              <span :class="rule.is_active ? 'text-emerald-600' : 'text-slate-400'">
                {{ rule.is_active ? t('services.active') : t('services.inactive') }}
              </span>
            </td>
            <td v-if="canEdit" class="px-4 py-3 text-right">
              <button class="p-2 text-primary-600 hover:bg-primary-50 rounded-lg" @click="openModal(rule)">
                <PencilSquareIcon class="w-4 h-4" />
              </button>
              <button class="p-2 text-rose-600 hover:bg-rose-50 rounded-lg" @click="remove(rule)">
                <TrashIcon class="w-4 h-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto" @click.self="closeModal">
        <div class="flex items-center justify-center min-h-screen px-4 py-8">
          <div class="fixed inset-0 bg-gray-500/75" />
          <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 class="text-lg font-semibold">{{ form.id ? t('services.editDiscount') : t('services.newDiscount') }}</h3>
            <input v-model="form.name" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" :placeholder="t('services.discountNamePlaceholder')" />
            <div class="grid grid-cols-2 gap-3">
              <select v-model="form.discount_type" class="rounded-lg border border-gray-200 px-3 py-2 text-sm">
                <option value="percent">{{ t('services.discountPercent') }}</option>
                <option value="fixed">{{ t('services.discountFixed') }}</option>
              </select>
              <input v-model.number="form.discount_value" type="number" min="0" class="rounded-lg border border-gray-200 px-3 py-2 text-sm" :placeholder="t('services.discountValue')" />
            </div>
            <select v-model="form.scope" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <option value="service">{{ t('services.scopeService') }}</option>
              <option value="category">{{ t('services.scopeCategory') }}</option>
              <option value="package">{{ t('services.scopePackage') }}</option>
              <option value="visit_total">{{ t('services.scopeVisitTotal') }}</option>
            </select>
            <input v-model="form.scope_ref" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" :placeholder="t('services.service')" />
            <div class="grid grid-cols-2 gap-3">
              <input v-model.number="form.min_amount" type="number" min="0" class="rounded-lg border border-gray-200 px-3 py-2 text-sm" :placeholder="t('services.minAmount')" />
              <input v-model.number="form.min_services_count" type="number" min="0" class="rounded-lg border border-gray-200 px-3 py-2 text-sm" :placeholder="t('services.minServicesCount')" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <input v-model="form.valid_from" type="date" class="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              <input v-model="form.valid_to" type="date" class="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <label class="flex items-center gap-2 text-sm">
              <input v-model="form.is_active" type="checkbox" class="rounded" />
              {{ t('services.active') }}
            </label>
            <div class="flex justify-end gap-2">
              <button class="px-4 py-2 rounded-lg border border-gray-300" @click="closeModal">{{ t('services.cancel') }}</button>
              <button class="px-4 py-2 rounded-lg bg-violet-600 text-white" @click="save">{{ t('services.save') }}</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { listDiscountRules, createDiscountRule, updateDiscountRule, deleteDiscountRule } from '@/api/servicesApi'
import { useToast } from '@/composables/useToast'

defineProps({
  canEdit: { type: Boolean, default: false },
})

const { t } = useI18n()
const toast = useToast()
const loading = ref(false)
const rules = ref([])
const showModal = ref(false)
const form = reactive({
  id: null,
  name: '',
  discount_type: 'percent',
  discount_value: 0,
  scope: 'service',
  scope_ref: '',
  min_amount: null,
  min_services_count: null,
  valid_from: '',
  valid_to: '',
  is_active: true,
})

async function load() {
  loading.value = true
  try {
    rules.value = await listDiscountRules('order=created_at.desc')
  } catch (e) {
    console.error(e)
    rules.value = []
  } finally {
    loading.value = false
  }
}

function openModal(rule = null) {
  if (rule) {
    Object.assign(form, {
      id: rule.id,
      name: rule.name || '',
      discount_type: rule.discount_type || 'percent',
      discount_value: Number(rule.discount_value) || 0,
      scope: rule.scope || 'service',
      scope_ref: rule.scope_ref || '',
      min_amount: rule.min_amount ?? null,
      min_services_count: rule.min_services_count ?? null,
      valid_from: rule.valid_from ? String(rule.valid_from).slice(0, 10) : '',
      valid_to: rule.valid_to ? String(rule.valid_to).slice(0, 10) : '',
      is_active: rule.is_active !== false,
    })
  } else {
    Object.assign(form, {
      id: null, name: '', discount_type: 'percent', discount_value: 0,
      scope: 'service', scope_ref: '', min_amount: null, min_services_count: null,
      valid_from: '', valid_to: '', is_active: true,
    })
  }
  showModal.value = true
}

function closeModal() { showModal.value = false }

async function save() {
  if (!form.name.trim()) {
    toast.error(t('services.errorNameRequired'))
    return
  }
  const payload = {
    name: form.name.trim(),
    discount_type: form.discount_type,
    discount_value: Number(form.discount_value) || 0,
    scope: form.scope,
    scope_ref: form.scope_ref?.trim() || null,
    min_amount: form.min_amount != null ? Number(form.min_amount) : null,
    min_services_count: form.min_services_count != null ? Number(form.min_services_count) : null,
    valid_from: form.valid_from || null,
    valid_to: form.valid_to || null,
    is_active: Boolean(form.is_active),
  }
  try {
    if (form.id) await updateDiscountRule(form.id, payload)
    else await createDiscountRule(payload)
    toast.success(t('services.toastCreated'))
    closeModal()
    await load()
  } catch (e) {
    toast.error(t('services.errorSave'))
  }
}

async function remove(rule) {
  if (!window.confirm(t('services.confirmDelete'))) return
  try {
    await deleteDiscountRule(rule.id)
    toast.success(t('services.toastDeleted'))
    await load()
  } catch (e) {
    toast.error(t('services.errorDelete'))
  }
}

onMounted(load)
</script>
