<script setup lang="ts">
import { Analytics } from '@vercel/analytics/vue'
import { SpeedInsights } from '@vercel/speed-insights/vue'
import GlobalLoader from '@/components/GlobalLoader.vue'
import Toaster from '@/components/ui/toast/Toaster.vue'
</script>

<template>
  <Analytics />
  <SpeedInsights />
  <GlobalLoader />
  <Toaster />
  <router-view />
</template>
