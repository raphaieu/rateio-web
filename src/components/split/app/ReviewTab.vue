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
import { useMercadoPago } from '@/utils/mercadopago'

const draft = computed(() => store.draft)
const calculation = ref<any>(null)
const isLoading = ref(false)
const showPaymentModal = ref(false)
const paymentData = ref<{ qrCode?: string, copyPaste?: string, paymentId?: string } | null>(null)

// Polling for payment status
const { pause, resume } = useIntervalFn(async () => {
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

onMounted(async () => {
    fetchCalculation()
    await useMercadoPago()
})

const summary = computed(() => {
    if (!draft.value || !calculation.value) return []
    
    return draft.value.participants.map(p => ({
        name: p.name,
        total: calculation.value.participantTotals[p.id] || 0
    })).sort((a, b) => a.total - b.total)
})

const totalBill = computed(() => {
    return calculation.value?.grandTotalCents || 0
})

// ... (lines 91-125 skipped)

            if (res.status === 'PENDING') {
                console.log("Payment Data Received:", res);
                paymentData.value = {
                    qrCode: res.qrCode,
                    copyPaste: res.copyPaste,
                    paymentId: res.paymentId
                }
                showPaymentModal.value = true
                resume() // Start listener
            }
// ... (lines 142-227 skipped)

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
            </DialogFooter>
        </DialogContent>
     </Dialog>
  </div>
</template>
