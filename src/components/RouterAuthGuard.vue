<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@clerk/vue'
import { Loader2 } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const { isLoaded, isSignedIn } = useAuth()

const requiresAuth = computed(() =>
  route.matched.some((r) => r.meta.requiresAuth === true)
)

const showLoading = computed(
  () => requiresAuth.value && !isLoaded.value
)

const shouldRedirectToLogin = computed(
  () => requiresAuth.value && isLoaded.value && !isSignedIn.value
)

watch(
  [showLoading, shouldRedirectToLogin],
  () => {
    if (!shouldRedirectToLogin.value || !route.path.startsWith('/app')) return
    router.replace({
      path: '/',
      query: {
        reason: 'login_required',
        returnUrl: route.fullPath,
      },
    })
  },
  { immediate: true }
)
</script>

<template>
  <!-- Rota protegida e Clerk ainda carregando: evita "perder sessão" no refresh -->
  <div
    v-if="showLoading"
    class="min-h-screen flex items-center justify-center bg-background"
    aria-live="polite"
    aria-busy="true"
  >
    <div class="flex flex-col items-center gap-4 text-muted-foreground">
      <Loader2 class="h-10 w-10 animate-spin" aria-hidden="true" />
      <p class="text-sm">Carregando…</p>
    </div>
  </div>
  <!-- Redirecionando para login (evita flash do dashboard) -->
  <div
    v-else-if="shouldRedirectToLogin"
    class="min-h-screen flex items-center justify-center bg-background"
    aria-live="polite"
  >
    <div class="flex flex-col items-center gap-4 text-muted-foreground">
      <Loader2 class="h-10 w-10 animate-spin" aria-hidden="true" />
      <p class="text-sm">Redirecionando…</p>
    </div>
  </div>
  <router-view v-else />
</template>
