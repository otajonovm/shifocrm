<template>
  <div class="space-y-4 animate-fade-in">
    <p class="text-sm text-slate-600">{{ t('staffWizard.permissionsIntro') }}</p>
    <StaffPermissionsMatrix :model-value="permissions" @update:model-value="onPermissionsUpdate" />
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import StaffPermissionsMatrix from './StaffPermissionsMatrix.vue'

const props = defineProps({
  permissions: { type: Object, required: true },
})

const { t } = useI18n()

const onPermissionsUpdate = (value) => {
  Object.keys(value).forEach((sectionKey) => {
    props.permissions[sectionKey] = { ...value[sectionKey] }
  })
}
</script>
