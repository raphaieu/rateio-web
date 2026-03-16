<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSplitStore } from '@/stores/splitStore'
import { useApi } from '@/api/useApi'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  CheckCircle2
} from 'lucide-vue-next'
import ParticipantsTab from '@/components/split/app/ParticipantsTab.vue'
import ItemsTab from '@/components/split/app/ItemsTab.vue'
import ReviewTab from '@/components/split/app/ReviewTab.vue'
import { toast } from '@/components/ui/toast/use-toast'

const router = useRouter()
const store = useSplitStore()
const api = useApi()

const step = ref(1)

const isCreatingValue = ref(false)

onMounted(async () => {
  // If no draft, create one automatically for the guest
  if (!store.currentSplitId) {
    isCreatingValue.value = true
    try {
      await store.createSplit(api, 'Novo Rateio')
    } catch (e) {
      console.error('Failed to auto-create split', e)
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar o rateio. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      isCreatingValue.value = false
    }
  } else {
      // Ensure we have the draft loaded
      await store.fetchSplit(api, store.currentSplitId)
  }
})

const nextStep = () => {
  if (step.value < 3) step.value++
}

const prevStep = () => {
  if (step.value > 1) step.value--
}

const finish = () => {
  if (store.draft?.status === 'PAID') {
    localStorage.removeItem('rateio_guest_id')
    store.currentSplitId = null
  }
  router.push('/app')
}

const reviewTab = ref<any>(null)

const canGoNext = computed(() => {
    if (step.value === 1) return (store.draft?.participants.length ?? 0) >= 1
    if (step.value === 2) return (store.draft?.items.length ?? 0) >= 1
    return true
})

const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

</script>

<template>
  <div class="min-h-screen bg-zinc-50 flex flex-col pb-20">
    <!-- Header -->
    <header class="bg-white border-b sticky top-0 z-40 px-4 py-3 flex items-center justify-between shadow-sm">
      <div class="flex items-center gap-3">
        <Button variant="ghost" size="icon" @click="step === 1 ? router.push('/') : prevStep()">
           <ArrowLeft class="w-5 h-5" />
        </Button>
        <h1 class="font-bold text-lg text-emerald-600">Rateio Justo</h1>
      </div>
      <div class="flex flex-col items-end">
        <div class="text-xs font-bold uppercase tracking-wider text-zinc-400">Passo</div>
        <div class="text-sm font-black text-zinc-900">{{ step }} / 3</div>
      </div>
    </header>

    <!-- Content -->
    <main class="flex-1 p-4 max-w-2xl mx-auto w-full">
      <div v-if="isCreatingValue" class="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 class="w-10 h-10 animate-spin text-emerald-500" />
        <p class="text-zinc-500 font-medium">Iniciando sua mesa...</p>
      </div>

      <div v-else-if="store.draft" class="space-y-6">
        <!-- Step 1: Participants -->
        <div v-if="step === 1" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div class="mb-6">
            <h2 class="text-2xl font-black text-zinc-900 mb-2">Quem está na mesa?</h2>
            <p class="text-zinc-500">Adicione os nomes das pessoas que vão dividir a conta.</p>
          </div>
          <ParticipantsTab />
        </div>

        <!-- Step 2: Items -->
        <div v-if="step === 2" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div class="mb-6">
            <h2 class="text-2xl font-black text-zinc-900 mb-2">O que consumiram?</h2>
            <p class="text-zinc-500">Insira os itens da conta e selecione quem comeu/bebeu o quê.</p>
          </div>
          <ItemsTab />
        </div>

        <!-- Step 3: Review -->
        <div v-if="step === 3" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div class="mb-6">
            <h2 class="text-2xl font-black text-zinc-900 mb-2">Quase lá!</h2>
            <p class="text-zinc-500">Confira o resumo e veja quanto cada um deve.</p>
          </div>
            <ReviewTab ref="reviewTab" :is-active="step === 3" hide-actions />
        </div>
      </div>
    </main>

    <!-- Navigation Footer -->
    <footer class="fixed bottom-0 left-0 right-0 bg-white border-t p-4 safe-area-inset-bottom">
      <div class="max-w-2xl mx-auto flex gap-3">
        <Button 
            v-if="step < 3"
            class="flex-1 h-12 text-lg font-bold bg-emerald-500 hover:bg-emerald-600 text-white" 
            :disabled="!canGoNext || isCreatingValue"
            @click="nextStep"
        >
          Próximo <ArrowRight class="ml-2 w-5 h-5" />
        </Button>

        <template v-else>
          <!-- Se estiver no passo 3, o botão depende do status do pagamento -->
          <Button 
              v-if="store.draft?.status !== 'PAID'"
              class="flex-1 h-12 text-lg font-bold bg-emerald-500 hover:bg-emerald-600 text-white"
              :disabled="reviewTab?.isPaying"
              @click="reviewTab?.handlePay()"
          >
            <Loader2 v-if="reviewTab?.isPaying" class="mr-2 w-5 h-5 animate-spin" />
            <span v-if="reviewTab?.isPaying">Processando...</span>
            <span v-else>
              Desbloquear valores
              <span v-if="reviewTab?.platformFeeCents > 0" class="ml-1 opacity-90">({{ formatCurrency(reviewTab.platformFeeCents) }})</span>
            </span>
          </Button>

          <Button 
              v-else
              class="flex-1 h-12 text-lg font-bold bg-zinc-900 hover:bg-zinc-800 text-white"
              @click="finish"
          >
            Finalizar <CheckCircle2 class="ml-2 w-5 h-5" />
          </Button>
        </template>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.safe-area-inset-bottom {
  padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
}
</style>
