<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useUiStore } from '@/stores/uiStore'

const ui = useUiStore()

// Só exibe o loader após 400ms de loading contínuo (evita flash em requisições rápidas, ex.: Clerk)
const showLoader = ref(false)
let timeoutId: ReturnType<typeof setTimeout> | null = null

watch(
    () => ui.isLoading,
    (loading) => {
        if (loading) {
            timeoutId = setTimeout(() => {
                showLoader.value = true
                timeoutId = null
            }, 400)
        } else {
            if (timeoutId) {
                clearTimeout(timeoutId)
                timeoutId = null
            }
            showLoader.value = false
        }
    },
    { immediate: true }
)

onUnmounted(() => {
    if (timeoutId) clearTimeout(timeoutId)
})
</script>

<template>
  <!-- Barra fina no topo, menos intrusiva que overlay full screen -->
  <div
    v-if="showLoader"
    class="fixed top-0 left-0 right-0 z-50 h-1 bg-primary/20 overflow-hidden"
    role="status"
    aria-label="Carregando"
  >
    <div class="loader-bar" />
  </div>
</template>

<style scoped>
.loader-bar {
    height: 100%;
    width: 33%;
    background: hsl(var(--primary));
    animation: loading-bar 1.2s ease-in-out infinite;
}
@keyframes loading-bar {
    0% { transform: translateX(-100%); }
    50% { transform: translateX(200%); }
    100% { transform: translateX(-100%); }
}
</style>
