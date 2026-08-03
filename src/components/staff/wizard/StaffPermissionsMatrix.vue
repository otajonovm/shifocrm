<template>
  <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
    <section
      v-for="section in sections"
      :key="section.key"
      class="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-primary-200"
    >
      <div class="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h4 class="font-semibold text-slate-900">
            {{ t(`staffWizard.permissions.sections.${section.key}`) }}
          </h4>
          <p class="mt-0.5 text-xs text-slate-500">
            {{ t('staffWizard.permissions.sectionMaster') }}
          </p>
        </div>

        <label class="inline-flex cursor-pointer items-center gap-2 select-none">
          <input
            type="checkbox"
            class="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            :checked="sectionStates[section.key].all"
            :indeterminate.prop="sectionStates[section.key].indeterminate"
            :aria-label="`${t(`staffWizard.permissions.sections.${section.key}`)}: ${t('staffWizard.permissions.sectionMaster')}`"
            @change="onSectionToggle(section.key, $event.target.checked)"
          />
          <span class="text-sm font-medium text-slate-700">
            {{ t('staffWizard.permissions.sectionMaster') }}
          </span>
        </label>
      </div>

      <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label
          v-for="action in actions"
          :key="`${section.key}-${action.key}`"
          class="flex cursor-pointer items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2.5 select-none"
        >
          <span class="text-xs font-medium text-slate-700">
            {{ t(`staffWizard.permissions.${action.key}`) }}
          </span>
          <span class="relative inline-flex h-5 w-9 flex-shrink-0">
            <input
              type="checkbox"
              class="peer sr-only"
              :checked="modelValue[section.key]?.[action.key] === true"
              @change="onActionToggle(section.key, action.key, $event.target.checked)"
            />
            <span class="absolute inset-0 rounded-full bg-slate-300 transition-colors peer-checked:bg-primary-600 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2" />
            <span class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
          </span>
        </label>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  PERMISSION_SECTIONS,
  PERMISSION_ACTIONS,
  sectionAllChecked,
  sectionIndeterminate,
  toggleSection,
} from '@/lib/staffPermissionsMatrix'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const sections = PERMISSION_SECTIONS
const actions = PERMISSION_ACTIONS

const sectionStates = computed(() => Object.fromEntries(
  sections.map(({ key }) => [
    key,
    {
      all: sectionAllChecked(props.modelValue, key),
      indeterminate: sectionIndeterminate(props.modelValue, key),
    },
  ])
))

const onSectionToggle = (sectionKey, checked) => {
  const next = Object.fromEntries(
    sections.map(({ key }) => [key, { ...(props.modelValue[key] || {}) }])
  )
  toggleSection(next, sectionKey, checked)
  emit('update:modelValue', next)
}

const onActionToggle = (sectionKey, actionKey, checked) => {
  const next = Object.fromEntries(
    sections.map(({ key }) => [key, { ...(props.modelValue[key] || {}) }])
  )
  if (!next[sectionKey]) {
    next[sectionKey] = { view: false, create: false, edit: false, delete: false }
  }
  next[sectionKey] = { ...next[sectionKey], [actionKey]: checked }
  emit('update:modelValue', next)
}
</script>
