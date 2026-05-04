<template>
  <router-view />
  <SpeedInsights />
</template>

<script setup>
import { SpeedInsights } from '@vercel/speed-insights/vue'
</script>
