<script setup lang="ts">
import { useUiStore } from '@/stores/uiStore'
import { Loader2 } from 'lucide-vue-next'

const ui = useUiStore()
</script>

<template>
  <div 
    v-if="ui.isLoading" 
    class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
  >
    <div class="flex flex-col items-center gap-4">
        <Loader2 class="h-12 w-12 animate-spin text-primary" />
        <p class="text-lg font-medium text-muted-foreground">Processando...</p>
    </div>
  </div>
</template>
