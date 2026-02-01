<script setup lang="ts">
import { computed } from 'vue'
import { useSplitStore } from '@/stores/splitStore'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const store = useSplitStore()
const draft = computed(() => store.currentDraft)

const errors = computed(() => {
    const errs: string[] = []
    if (!draft.value) return errs
    
    if (draft.value.participants.length < 1) errs.push('Add at least 1 participant.')
    if (draft.value.items.length < 1) errs.push('Add at least 1 item.')
    
    // Check for items with 0 consumers
    const orphanedItems = draft.value.items.filter(item => {
        const hasConsumer = draft.value!.shares.some(s => s.itemId === item.id)
        return !hasConsumer
    })
    
    if (orphanedItems.length > 0) {
        errs.push(`Assign consumers to: ${orphanedItems.map(i => i.name).join(', ')}`)
    }
    
    return errs
})

// Simple calculation simulation
const summary = computed(() => {
    if (!draft.value) return []
    // This logic should ideally be in the store or a service
    // Naive equal split per item
    
    const totals: Record<string, number> = {}
    draft.value.participants.forEach(p => totals[p.id] = 0)
    
    draft.value.items.forEach(item => {
        const consumers = draft.value!.shares.filter(s => s.itemId === item.id)
        if (consumers.length > 0) {
            const splitAmount = item.amountCents / consumers.length
            consumers.forEach(c => {
                 totals[c.participantId] = (totals[c.participantId] || 0) + splitAmount
            })
        }
    })
    
    return draft.value.participants.map(p => ({
        name: p.name,
        total: totals[p.id]
    }))
})

const totalBill = computed(() => {
    return draft.value?.items.reduce((acc, i) => acc + i.amountCents, 0) || 0
})

const formatMoney = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
</script>

<template>
  <div class="space-y-6">
     <div v-if="errors.length > 0" class="bg-destructive/10 p-4 rounded-md border border-destructive/20 text-destructive">
        <div class="flex items-center gap-2 font-bold mb-2">
            <AlertCircle class="w-5 h-5" />
            <span>Please fix the following:</span>
        </div>
        <ul class="list-disc list-inside text-sm">
            <li v-for="e in errors" :key="e">{{ e }}</li>
        </ul>
     </div>

     <div v-else class="space-y-4">
        <h2 class="text-xl font-bold">Summary</h2>
        
        <Card>
            <CardContent class="p-4 space-y-2">
                <div class="flex justify-between font-bold text-lg border-b pb-2">
                    <span>Total</span>
                    <span>{{ formatMoney(totalBill) }}</span>
                </div>
                <div v-for="s in summary" :key="s.name" class="flex justify-between">
                    <span>{{ s.name }}</span>
                    <span class="font-medium">{{ formatMoney(s.total || 0) }}</span>
                </div>
            </CardContent>
        </Card>
        
        <Button class="w-full" size="lg">Generate Payment Link</Button>
     </div>
  </div>
</template>
