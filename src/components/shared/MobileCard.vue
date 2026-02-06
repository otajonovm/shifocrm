<template>
  <div
    class="mobile-list-item"
    :class="[
      { 'cursor-pointer': clickable },
      { 'active:bg-gray-50': clickable }
    ]"
    @click="handleClick"
  >
    <slot />
  </div>
</template>

<script setup>
const props = defineProps({
  clickable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const handleClick = () => {
  if (props.clickable) {
    emit('click')
  }
}
</script>
