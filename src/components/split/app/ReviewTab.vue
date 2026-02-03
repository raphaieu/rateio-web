<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useSplitStore } from '@/stores/splitStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AlertCircle, Loader2, Copy, Check, QrCode } from 'lucide-vue-next'
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
const isPaying = ref(false)
const showPaymentModal = ref(false)
const paymentData = ref<{ qrCode?: string, copyPaste?: string, paymentId?: string } | null>(null)

const isPaid = computed(() => draft.value?.status === 'PAID')

// Polling for payment status
const { pause, resume } = useIntervalFn(async () => {
    if (!draft.value?.id) return
    
    // Silent fetch
    await store.fetchSplit(api, draft.value.id)
    
    if (store.draft?.status === 'PAID') {
        pause()
        showPaymentModal.value = false
        // Refresh calculation if needed
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
        errs.push(t('review.errors.orphanedItems', { count: orphanedItems.length }))
    }
    
    return errs
})

const fetchCalculation = async () => {
    if (errors.value.length > 0) return
    isLoading.value = true
    calculation.value = await store.computeReview(api)
    isLoading.value = false
}

onMounted(async () => {
    fetchCalculation()
    // Initialize MercadoPago if needed
    // await useMercadoPago() 
})

const summary = computed(() => {
    if (!draft.value || !calculation.value) return []
    
    return draft.value.participants.map(p => ({
        id: p.id,
        name: p.name,
        total: calculation.value.participantTotals[p.id] || 0
    })).sort((a, b) => b.total - a.total)
})

const totalBill = computed(() => {
    return calculation.value?.grandTotalCents || 0
})

const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

const handlePay = async () => {
    if (!draft.value) return
    isPaying.value = true
    try {
        const res = await store.paySplit(api)
        if (res.status === 'PENDING') {
            paymentData.value = {
                qrCode: res.qrCode,
                copyPaste: res.copyPaste,
                paymentId: res.paymentId
            }
            showPaymentModal.value = true
            resume() 
        } else if (res.status === 'PAID') {
            // Already paid?
            fetchCalculation()
        }
    } catch (e) {
        console.error(e)
    } finally {
        isPaying.value = false
    }
}

const copyPixCode = async () => {
    if (paymentData.value?.copyPaste) {
        await copy(paymentData.value.copyPaste)
        // Could show toast here
    }
}

const handleMarkAsPaid = async () => {
    await store.markAsPaid(api)
}

</script>

<template>
  <div class="space-y-4 p-4 pb-24">
      <div v-if="errors.length > 0" class="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <div class="flex items-center gap-2 mb-2">
              <AlertCircle class="h-4 w-4" />
              <h5 class="font-medium leading-none tracking-tight">Erros encontrados</h5>
          </div>
          <div class="text-sm opacity-90">
              <ul class="list-disc list-inside">
                  <li v-for="err in errors" :key="err">{{ err }}</li>
              </ul>
          </div>
      </div>

      <Card v-else-if="isLoading" class="flex justify-center items-center p-8">
          <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
      </Card>

      <div v-else>
          <!-- Total Card -->
          <Card class="mb-4 bg-primary text-primary-foreground">
              <CardHeader>
                  <CardTitle class="text-lg opacity-90">Total da Conta</CardTitle>
              </CardHeader>
              <CardContent>
                  <div class="text-4xl font-bold">{{ formatCurrency(totalBill) }}</div>
              </CardContent>
          </Card>

          <!-- Participants List -->
          <h3 class="font-semibold mb-2">Por Pessoa</h3>
          <div class="space-y-2">
              <Card v-for="person in summary" :key="person.id">
                  <CardContent class="flex justify-between items-center p-4">
                      <div class="font-medium">{{ person.name }}</div>
                      <div class="font-bold text-lg">{{ formatCurrency(person.total) }}</div>
                  </CardContent>
              </Card>
          </div>

          <!-- Actions -->
          <div class="fixed bottom-0 left-0 right-0 p-4 bg-background border-t flex gap-2">
               <Button 
                  class="flex-1" 
                  size="lg" 
                  :disabled="isPaid || isPaying"
                  @click="handlePay"
              >
                  <span v-if="isPaying" class="flex items-center gap-2">
                      <Loader2 class="w-4 h-4 animate-spin" /> Processando
                  </span>
                  <span v-else-if="isPaid" class="flex items-center gap-2">
                      <Check class="w-4 h-4" /> Pago
                  </span>
                  <span v-else>Pagar Conta</span>
              </Button>
               <!-- Manual Mark as Paid (Hidden or Secondary) -->
               <!-- Maybe user wanted this for debug or cash payments -->
               <!-- Only show if invalid payment or specific role? optional -->
          </div>
      </div>

      <!-- Payment Modal -->
      <Dialog v-model:open="showPaymentModal">
        <DialogContent class="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Pagamento via PIX</DialogTitle>
                <DialogDescription>
                    Escaneie o QR Code ou copie a chave PIX abaixo para pagar.
                </DialogDescription>
            </DialogHeader>
            
            <div class="flex flex-col items-center gap-4 py-4" v-if="paymentData">
                <!-- QR Code Display (Placeholder or Image) -->
                <div class="w-48 h-48 bg-gray-100 flex items-center justify-center rounded overflow-hidden relative">
                    <img 
                        v-if="paymentData.qrCode" 
                        :src="`data:image/png;base64,${paymentData.qrCode}`" 
                        alt="QR Code PIX"
                        class="w-full h-full object-contain"
                    />
                    <QrCode v-else class="w-12 h-12 text-muted-foreground" />
                </div>
                
                <div class="w-full relative">
                    <textarea 
                        readonly 
                        class="w-full text-xs font-mono p-2 pr-10 border rounded bg-muted resize-none h-24 focus:outline-none"
                        :value="paymentData.copyPaste || 'Chave PIX indisponível'"
                    ></textarea>
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        class="absolute right-1 top-1 text-muted-foreground hover:text-primary"
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
                <!-- <Button type="button" variant="outline" @click="handleMarkAsPaid" class="ml-auto">
                    Simular Pagamento
                </Button> -->
            </DialogFooter>
        </DialogContent>
     </Dialog>
  </div>
</template>
