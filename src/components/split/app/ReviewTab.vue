<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useSplitStore } from '@/stores/splitStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { AlertCircle, Loader2, Copy } from 'lucide-vue-next'
import { useApi } from '@/api/useApi'
import { useI18n } from 'vue-i18n'
import { useClipboard, useIntervalFn } from '@vueuse/core'

const { t } = useI18n()
const api = useApi()
const store = useSplitStore()
const { copy } = useClipboard()

const draft = computed(() => store.draft)
const calculation = ref<any>(null)
const isLoading = ref(false)
const showPaymentModal = ref(false)
const paymentData = ref<{ qrCode?: string, copyPaste?: string, paymentId?: string } | null>(null)

// Polling for payment status
const { pause, resume, isActive } = useIntervalFn(async () => {
    if (!draft.value?.id) return
    
    // Silent fetch
    await store.fetchSplit(api, draft.value.id)
    
    if (store.draft?.status === 'PAID') {
        pause()
        showPaymentModal.value = false
        // Refresh calculation if needed (though values are same, UI unblurs)
        fetchCalculation()
    }
}, 3000, { immediate: false })

// Stop polling when modal closes
watch(showPaymentModal, (open) => {
    if (!open) {
        pause()
    } else if (open && !isPaid.value) {
        resume()
    }
})

const errors = computed(() => {
    const errs: string[] = []
    if (!draft.value) return errs
    
    if (draft.value.participants.length < 1) errs.push(t('review.errors.minParticipants'))
    if (draft.value.items.length < 1) errs.push(t('review.errors.minItems'))
    
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
    return draft.value?.status === 'PAID'
})

const feeCents = computed(() => {
    return calculation.value?.baseFeeCents || 0
})

const handleAction = async () => {
    if (isPaid.value) {
         if (navigator.share) {
            navigator.share({
                title: 'Rateio Justo',
                text: `Ficou ${formatMoney(totalBill.value)} no total. Veja sua parte:`,
                url: window.location.href // NOTE: Ideally should be public slug URL
            }).catch(console.error)
        } else {
            copy(window.location.href)
            alert("Link copiado!")
        }
    } else {
        // Start Payment Flow
        try {
            isLoading.value = true
            const res = await store.paySplit(api) // Default topup 0 for now
            
            if (res.status === 'PAID') {
                // Already paid (maybe wallet covered it)
                fetchCalculation()
                return
            }
            
            if (res.status === 'PENDING') {
                paymentData.value = {
                    qrCode: res.qrCode,
                    copyPaste: res.copyPaste,
                    paymentId: res.paymentId
                }
                showPaymentModal.value = true
                resume() // Start listener
            }
        } catch (e) {
            alert("Erro ao iniciar pagamento. Tente novamente.")
        } finally {
            isLoading.value = false
        }
    }
}

const copyPixCode = () => {
    if (paymentData.value?.copyPaste) {
        copy(paymentData.value.copyPaste)
        // Toast would be better here
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
                    <span v-if="isPaid" class="font-medium text-green-600">{{ formatMoney(s.total || 0) }}</span>
                    <span v-else class="font-medium text-muted-foreground blur-sm select-none">R$ ??.??</span>
                </div>
                <!-- Fee Row (Only if Locked) -->
                <div v-if="!isPaid" class="flex justify-between text-muted-foreground text-sm border-t pt-2 mt-2">
                    <span>Taxa de Serviço</span>
                    <span>{{ formatMoney(feeCents) }}</span>
                </div>
                <!-- Total is always visible -->
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
            :disabled="isLoading"
        >
            <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
            {{ isPaid ? 'Compartilhar Resultado' : `Desbloquear Valores (${formatMoney(feeCents)})` }}
        </Button>
     </div>

     <!-- Payment Modal -->
     <Dialog :open="showPaymentModal" @update:open="showPaymentModal = $event">
        <DialogContent class="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Pagamento via PIX</DialogTitle>
                <DialogDescription>
                    Escaneie o QR Code ou copie a chave PIX para desbloquear o rateio.
                </DialogDescription>
            </DialogHeader>
            
            <div class="flex flex-col items-center justify-center space-y-4 py-4" v-if="paymentData">
                <div class="border-2 border-primary/20 rounded-lg p-2 bg-white">
                    <img v-if="paymentData.qrCode" 
                         :src="`data:image/png;base64,${paymentData.qrCode}`" 
                         alt="QR Code PIX" 
                         class="w-48 h-48 object-contain"
                    />
                    <div v-else class="w-48 h-48 flex items-center justify-center bg-gray-100 text-xs text-muted-foreground">
                        QR Code Indisponível (Mock)
                    </div>
                </div>

                <div class="w-full relative">
                    <Input 
                        readOnly 
                        :value="paymentData.copyPaste || 'Chave PIX indisponível'" 
                        class="pr-10 text-xs font-mono"
                    />
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        class="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-primary"
                        @click="copyPixCode"
                    >
                        <Copy class="w-4 h-4" />
                    </Button>
                </div>

                 <div class="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                    <Loader2 class="w-3 h-3 animate-spin" />
                    Aguardando pagamento...
                </div>
            </div>
            
            <DialogFooter class="sm:justify-start">
                <Button type="button" variant="secondary" @click="showPaymentModal = false">
                    Fechar
                </Button>
            </DialogFooter>
        </DialogContent>
     </Dialog>
  </div>
</template>
