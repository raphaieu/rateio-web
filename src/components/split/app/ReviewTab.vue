<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useSplitStore } from '@/stores/splitStore'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useApi } from '@/api/useApi'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const api = useApi()
const store = useSplitStore()
const draft = computed(() => store.draft)
const calculation = ref<any>(null)
const isLoading = ref(false)

const errors = computed(() => {
    const errs: string[] = []
    if (!draft.value) return errs
    
    if (draft.value.participants.length < 1) errs.push(t('review.errors.minParticipants'))
    if (draft.value.items.length < 1) errs.push(t('review.errors.minItems'))
    
    // Check for items with 0 consumers
    const orphanedItems = draft.value.items.filter(item => {
        const hasConsumer = draft.value!.shares.some(s => s.itemId === item.id)
        return !hasConsumer
    })
    
    if (orphanedItems.length > 0) {
        errs.push(t('review.errors.orphanedItems', { items: orphanedItems.map(i => i.name).join(', ') }))
    }
    
    return errs
})

const fetchCalculation = async () => {
    if (errors.value.length > 0) return
    isLoading.value = true
    calculation.value = await store.computeReview(api)
    isLoading.value = false
}

onMounted(() => {
    fetchCalculation()
})

const summary = computed(() => {
    if (!draft.value || !calculation.value) return []
    
    return draft.value.participants.map(p => ({
        name: p.name,
        total: calculation.value.participantTotals[p.id] || 0
    })).sort((a, b) => a.total - b.total)
})

const totalBill = computed(() => {
    return calculation.value?.finalTotalToPayCents || 0
})

const formatMoney = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const isPaid = computed(() => {
    // Check if status is PAID in draft
    // The backend returns current status.
    return draft.value?.status === 'PAID'
})

const feeCents = computed(() => {
    return calculation.value?.baseFeeCents || 0
})

const handleAction = async () => {
    if (isPaid.value) {
        // Share Result logic (WIP)
         if (navigator.share) {
            navigator.share({
                title: 'Rateio Justo',
                text: `Ficou ${formatMoney(totalBill.value)} no total. Veja sua parte:`,
                url: window.location.href
            }).catch(console.error)
        } else {
            alert("Compartilhar (Link copiado!)")
        }
    } else {
        // Unlock Logic - Mock Payment Flow
        if (confirm(`Pagar taxa de ${formatMoney(feeCents.value)} para desbloquear?`)) {
            // Call backend to pay (mock)
            // For now, since we don't have a pay endpoint, we can't switch it on server.
            // But we can update local store or implement the endpoint.
            // Let's implement a 'force pay' on store for dev or endpoint.
             await store.markAsPaid(api)
             fetchCalculation() // Refresh
        }
    }
}
</script>

<template>
  <div class="space-y-6">
     <div v-if="errors.length > 0" class="bg-destructive/10 p-4 rounded-md border border-destructive/20 text-destructive">
        <div class="flex items-center gap-2 font-bold mb-2">
            <AlertCircle class="w-5 h-5" />
            <span>{{ t('review.fixErrors') }}</span>
        </div>
        <ul class="list-disc list-inside text-sm">
            <li v-for="e in errors" :key="e">{{ e }}</li>
        </ul>
     </div>

     <div v-else-if="isLoading" class="flex justify-center py-10">
        <Loader2 class="w-8 h-8 animate-spin text-muted-foreground" />
     </div>

     <div v-else class="space-y-4">
        <h2 class="text-xl font-bold">{{ t('review.summary') }}</h2>
        
        <Card>
            <CardContent class="p-4 space-y-2">
                <div v-for="s in summary" :key="s.name" class="flex justify-between items-center">
                    <span>{{ s.name }}</span>
                    <span v-if="isPaid" class="font-medium">{{ formatMoney(s.total || 0) }}</span>
                    <span v-else class="font-medium text-muted-foreground blur-sm select-none">R$ ??.??</span>
                </div>
                <!-- Fee Row (Only if Locked) -->
                <div v-if="!isPaid" class="flex justify-between text-muted-foreground text-sm border-t pt-2 mt-2">
                    <span>Taxa de Serviço</span>
                    <span>{{ formatMoney(feeCents) }}</span>
                </div>
                <div class="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                    <span>{{ t('review.total') }}</span>
                    <span>{{ formatMoney(totalBill) }}</span>
                </div>
            </CardContent>
        </Card>
        
        <Button 
            class="w-full" 
            size="lg" 
            :variant="isPaid ? 'secondary' : 'default'"
            @click="handleAction"
        >
            {{ isPaid ? 'Compartilhar Resultado' : `Desbloquear Valores (${formatMoney(feeCents)})` }}
        </Button>
     </div>
  </div>
</template>
