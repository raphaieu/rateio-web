<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: 0 } // Cents
})

const emit = defineEmits(['update:modelValue'])

const displayValue = ref('')

// Initialize display value
watch(() => props.modelValue, (newVal) => {
    const currentStr = displayValue.value.replace(',', '.')
    const current = parseFloat(currentStr)
    const newFloat = newVal / 100
    
    // Only update display if there is a significant difference
    if (Math.abs(newFloat - (isNaN(current) ? 0 : current)) > 0.001) {
        displayValue.value = newFloat.toString() // uses dot by default
    }
}, { immediate: true })

const onInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    const val = target.value
    
    displayValue.value = val

    if (val === '') {
        emit('update:modelValue', 0)
        return
    }

    // Handle comma as dot
    const normalized = val.replace(',', '.')
    // Filter out invalid characters if needed? 
    // inputmode="decimal" helps, but user can type trash on desktop.
    // parseFloat parses "12a" as 12.
    const num = parseFloat(normalized)
    
    if (!isNaN(num)) {
        emit('update:modelValue', Math.round(num * 100))
    }
}
</script>

<template>
  <div class="relative">
    <span class="absolute left-3 top-2.5 text-muted-foreground">R$</span>
    <input 
        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-foreground file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9"
        inputmode="decimal"
        placeholder="0.00"
        :value="displayValue"
        @input="onInput"
    />
  </div>
</template>
