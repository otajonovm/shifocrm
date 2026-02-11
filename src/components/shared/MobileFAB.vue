<template>
  <button
    :class="[
      'fab md:hidden',
      { 'md:static md:w-auto md:h-auto md:rounded-xl md:px-5 md:py-3': !alwaysFloating }
    ]"
    @click="$emit('click')"
    :title="title"
  >
    <component :is="icon" class="w-6 h-6 md:w-5 md:h-5 md:mr-2" />
    <span v-if="label" class="hidden md:inline font-semibold">{{ label }}</span>
  </button>
</template>

<script setup>
defineProps({
  icon: {
    type: Object,
    required: true
  },
  label: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  alwaysFloating: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])
</script>
