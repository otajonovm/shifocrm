<template>
  <div class="overflow-x-auto rounded-xl border border-slate-200">
    <table class="min-w-full text-sm">
      <thead>
        <tr class="bg-gradient-to-r from-slate-50 to-primary-50/40">
          <th class="px-4 py-3 text-left font-semibold text-slate-700 w-48">
            {{ t('staffWizard.permissions.section') }}
          </th>
          <th
            v-for="action in actions"
            :key="action.key"
            class="px-3 py-3 text-center font-semibold text-slate-600"
          >
            {{ t(`staffWizard.permissions.${action.key}`) }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        <tr
          v-for="section in sections"
          :key="section.key"
          class="hover:bg-slate-50/60 transition-colors"
        >
          <td class="px-4 py-3">
            <label class="inline-flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                :checked="sectionAllChecked(modelValue, section.key)"
                :indeterminate.prop="sectionIndeterminate(modelValue, section.key)"
                @change="onSectionToggle(section.key, $event.target.checked)"
              />
              <span class="font-medium text-slate-800">
                {{ t(`staffWizard.permissions.sections.${section.key}`) }}
              </span>
            </label>
          </td>
          <td
            v-for="action in actions"
            :key="`${section.key}-${action.key}`"
            class="px-3 py-3 text-center"
          >
            <input
              type="checkbox"
              class="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              :checked="modelValue[section.key]?.[action.key] === true"
              @change="onActionToggle(section.key, action.key, $event.target.checked)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
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

const onSectionToggle = (sectionKey, checked) => {
  const next = { ...props.modelValue }
  toggleSection(next, sectionKey, checked)
  emit('update:modelValue', next)
}

const onActionToggle = (sectionKey, actionKey, checked) => {
  const next = { ...props.modelValue }
  if (!next[sectionKey]) {
    next[sectionKey] = { view: false, create: false, edit: false, delete: false }
  }
  next[sectionKey] = { ...next[sectionKey], [actionKey]: checked }
  emit('update:modelValue', next)
}
</script>
