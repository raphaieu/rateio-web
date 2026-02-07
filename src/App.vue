<script setup lang="ts">
import GlobalLoader from '@/components/GlobalLoader.vue'
import Toaster from '@/components/ui/toast/Toaster.vue'
</script>

<template>
  <GlobalLoader />
  <Toaster />
  <router-view />
</template>
