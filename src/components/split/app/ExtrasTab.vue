<script setup lang="ts">
import { computed } from 'vue'
import { useSplitStore } from '@/stores/splitStore'
import { Lock } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const store = useSplitStore()
const isPaid = computed(() => store.draft?.status === 'PAID')
</script>

<template>
  <div class="space-y-6">
     <div v-if="isPaid" class="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 flex items-start gap-3">
        <Lock class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p class="text-sm text-amber-800 dark:text-amber-200">{{ t('split.lockedMessage') }}</p>
     </div>
     <div class="text-center py-10 text-muted-foreground">
        <p>{{ t('extras.comingSoon') }}</p>
     </div>
  </div>
</template>
