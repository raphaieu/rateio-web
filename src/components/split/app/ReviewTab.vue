<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useSplitStore } from '@/stores/splitStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AlertCircle, Loader2, Copy, Check, QrCode } from 'lucide-vue-next'
import { useUser } from '@clerk/vue'
import { useApi } from '@/api/useApi'
import { useI18n } from 'vue-i18n'
import { useClipboard, useIntervalFn } from '@vueuse/core'

const { t } = useI18n()
const { user } = useUser()
const api = useApi()
const apiSilent = useApi({ silent: true }) // polling/background — não dispara loader global
const store = useSplitStore()
const { copy } = useClipboard()

const draft = computed(() => store.draft)
const calculation = ref<any>(null)
const isLoading = ref(false)
const isPaying = ref(false)
const loadError = ref<string | null>(null)
const showPaymentModal = ref(false)
const paymentData = ref<{ qrCode?: string, copyPaste?: string, paymentId?: string } | null>(null)

// Backend envia DRAFT ou PAID; reconhecer ambos para exibir corretamente
const isPaid = computed(() => draft.value?.status === 'PAID')
const isDev = import.meta.env.DEV
// Em dev, não travar o fluxo por pagamento: exibir valores direto
const isUnlocked = computed(() => isPaid.value || isDev)

// Polling: quando webhook marca PAID, atualiza o split; fechamos a modal e exibimos os valores (silent = sem loader global)
const { pause, resume } = useIntervalFn(async () => {
    if (!draft.value?.id) return

    await store.fetchSplit(apiSilent, draft.value.id)

    if (store.draft?.status === 'PAID') {
        pause()
        showPaymentModal.value = false
        await fetchCalculation()
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
    loadError.value = null
    isLoading.value = true
    try {
        const result = await store.computeReview(api)
        if (result == null) {
            loadError.value = 'Não foi possível carregar o cálculo. Verifique a conexão e tente novamente.'
        } else {
            calculation.value = result
        }
    } catch (e) {
        console.error('[ReviewTab] compute-review failed', e)
        loadError.value = 'Não foi possível carregar o cálculo. Verifique a conexão e tente novamente.'
    } finally {
        isLoading.value = false
    }
}

// Quando o draft estiver pronto, buscar cálculo (mobile: aba Revisão pode montar antes do fetch do split)
watch(
    () => draft.value?.id,
    (id) => {
        if (id && !calculation.value && errors.value.length === 0) fetchCalculation()
    },
    { immediate: true }
)

const summary = computed(() => {
    if (!draft.value || !calculation.value) return []
    
    return draft.value.participants.map(p => ({
        id: p.id,
        name: p.name,
        total: calculation.value.participantTotals[p.id] || 0,
        totalRaw: calculation.value.participantTotalsRaw?.[p.id] as string | undefined
    })).sort((a, b) => b.total - a.total)
})

// Total da conta (itens + extras) — só para conferir com a conta física do estabelecimento
const totalBill = computed(() => {
    return calculation.value?.grandTotalCents ?? 0
})

// Taxa do app (PIX) — paga para desbloquear e ver quanto cada um deve ao estabelecimento
const platformFeeCents = computed(() => {
    return calculation.value?.finalTotalToPayCents ?? 0
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

// Botão "Simular Pagamento": só em dev ou para Raphael (testes)
const showSimulatePayment = computed(() => {
    if (isDev) return true
    const email = user.value?.primaryEmailAddress?.emailAddress ?? ''
    return email === 'rapha@raphael-martins.com'
})

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

      <div v-else-if="loadError" class="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
          <p class="text-sm text-amber-800 dark:text-amber-200 mb-3">{{ loadError }}</p>
          <Button variant="outline" size="sm" @click="fetchCalculation">Tentar novamente</Button>
      </div>

      <Card v-else-if="isLoading" class="flex justify-center items-center p-8">
          <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
      </Card>

      <div v-else>
          <!-- Total da conta: só para conferir com a conta física -->
          <Card class="mb-4 bg-primary text-primary-foreground">
              <CardHeader>
                  <CardTitle class="text-lg opacity-90">Total da Conta</CardTitle>
              </CardHeader>
              <CardContent>
                  <div class="text-4xl font-bold">{{ formatCurrency(totalBill) }}</div>
                  <p class="text-sm opacity-90 mt-1">Conferir com a conta física do estabelecimento. A soma do que cada um paga ao estabelecimento fecha esse valor.</p>
              </CardContent>
          </Card>

          <!-- Taxa do app: PIX para desbloquear os valores por pessoa -->
          <Card v-if="!isUnlocked && platformFeeCents > 0" class="mb-4 border-dashed">
              <CardContent class="pt-4 pb-4">
                  <div class="flex justify-between items-center">
                      <span class="text-sm text-muted-foreground">Taxa do app (PIX para desbloquear)</span>
                      <span class="font-semibold">{{ formatCurrency(platformFeeCents) }}</span>
                  </div>
              </CardContent>
          </Card>

          <!-- Por pessoa: quanto cada um deve pagar ao estabelecimento (visível só após desbloquear) -->
          <h3 class="font-semibold mb-2">Quanto cada um paga ao estabelecimento</h3>
          <div class="space-y-2">
              <Card v-for="person in summary" :key="person.id">
                  <CardContent class="flex justify-between items-center p-4">
                      <div class="font-medium">{{ person.name }}</div>
                      <div class="text-right">
                          <div v-if="isUnlocked" class="font-bold text-lg">{{ formatCurrency(person.total) }}</div>
                          <div v-else class="font-bold text-lg text-muted-foreground select-none blur-sm">{{ formatCurrency(person.total) }}</div>
                          <div
                              v-if="isUnlocked && person.totalRaw"
                              class="text-xs text-muted-foreground font-mono leading-none mt-1"
                          >
                              {{ person.totalRaw }}
                          </div>
                      </div>
                  </CardContent>
              </Card>
          </div>
          <p v-if="!isUnlocked" class="text-sm text-muted-foreground mt-1">Pague a taxa via PIX para desbloquear e ver quanto cada um deve pagar ao estabelecimento.</p>

          <!-- Actions -->
          <div class="fixed bottom-0 left-0 right-0 p-4 bg-background border-t flex gap-2">
               <Button
                  v-if="isDev"
                  class="flex-1"
                  size="lg"
                  variant="secondary"
                  disabled
              >
                  Modo dev: valores liberados
              </Button>
               <Button
                  v-else
                  class="flex-1"
                  size="lg"
                  :disabled="isPaid || isPaying"
                  @click="handlePay"
              >
                  <span v-if="isPaying" class="flex items-center gap-2">
                      <Loader2 class="w-4 h-4 animate-spin" /> Processando
                  </span>
                  <span v-else-if="isPaid" class="flex items-center gap-2">
                      <Check class="w-4 h-4" /> Valores desbloqueados
                  </span>
                  <span v-else>
                      Desbloquear valores
                      <span v-if="platformFeeCents > 0" class="ml-1 opacity-90">({{ formatCurrency(platformFeeCents) }})</span>
                  </span>
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
                <DialogTitle>Pagar taxa do app (PIX)</DialogTitle>
                <DialogDescription>
                    Pague a taxa via PIX para desbloquear os valores por pessoa. Escaneie o QR Code ou copie a chave abaixo.
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
                    <label class="block text-sm font-medium text-muted-foreground mb-1">Chave PIX (copiar e colar)</label>
                    <textarea 
                        readonly 
                        rows="4"
                        class="w-full min-h-[6rem] text-sm font-mono p-3 pr-12 border border-input rounded-md bg-muted/50 resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                        :value="paymentData.copyPaste || ''"
                        placeholder="Chave PIX indisponível"
                    ></textarea>
                    <Button 
                        size="icon" 
                        variant="secondary" 
                        class="absolute right-2 top-9 text-muted-foreground hover:text-primary"
                        @click="copyPixCode"
                        title="Copiar chave PIX"
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
                <Button
                    v-if="showSimulatePayment"
                    type="button"
                    variant="outline"
                    @click="handleMarkAsPaid"
                    class="ml-auto"
                >
                    Simular Pagamento
                </Button>
            </DialogFooter>
        </DialogContent>
     </Dialog>
  </div>
</template>
