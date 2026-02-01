<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="text-center py-10 text-muted-foreground">
    <p>{{ t('extras.comingSoon') }}</p>
  </div>
</template>
