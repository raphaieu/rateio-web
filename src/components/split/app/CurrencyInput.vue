<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: 0 }, // Cents
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const displayValue = computed(() => {
  // Always format as BRL decimal (pt-BR)
  // modelValue is in cents.
  return new Intl.NumberFormat('pt-BR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(props.modelValue / 100)
})

const onInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  // Remove all non-numeric characters
  const rawValue = target.value.replace(/\D/g, '')
  
  const numericValue = parseInt(rawValue || '0', 10)
  
  emit('update:modelValue', numericValue)
  
  // Force the input to update immediately to match the computed format
  // This prevents invalid characters from lingering and keeps the cursor logic simpler (usually jumps to end)
  target.value = new Intl.NumberFormat('pt-BR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericValue / 100)
}
</script>

<template>
  <div class="relative">
    <span class="absolute left-3 top-2.5 text-muted-foreground">R$</span>
    <input 
        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-foreground file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9"
        inputmode="numeric"
        placeholder="0,00"
        :value="displayValue"
        :disabled="disabled"
        @input="onInput"
    />
  </div>
</template>
