<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSplitStore } from '@/stores/splitStore'
import { useApi } from '@/api/useApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Home, MessageCircle, Copy, Check } from 'lucide-vue-next'
import { useClipboard } from '@vueuse/core'

const route = useRoute()
const router = useRouter()
const store = useSplitStore()
const api = useApi({ silent: true })
const { copy, copied } = useClipboard()

const splitId = route.params.slug as string
const calculation = ref<any>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

const fetchSplitData = async () => {
    isLoading.value = true
    try {
        await store.fetchPublicSplit(api, splitId)
        // Perform calculation for display
        // Note: now compute-review is accessible for PAID splits
        const res = await api.post<any>(`/splits/${splitId}/compute-review`)
        calculation.value = res.calculation
    } catch (e) {
        console.error(e)
        error.value = "Não foi possível carregar o comprovante."
    } finally {
        isLoading.value = false
    }
}

onMounted(() => {
    fetchSplitData()
})

const summary = computed(() => {
    if (!store.draft || !calculation.value) return []
    return store.draft.participants.map(p => ({
        id: p.id,
        name: p.name,
        total: calculation.value.participantTotals[p.id] || 0
    })).sort((a, b) => b.total - a.total)
})

const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

const shareText = computed(() => {
    if (!store.draft) return ''
    const total = formatCurrency(calculation.value?.grandTotalCents || 0)
    let text = `*Recibo: ${store.draft.name || 'Rateio Justo'}*\n`
    text += `Total: ${total}\n\n`
    summary.value.forEach(p => {
        text += `• ${p.name}: ${formatCurrency(p.total)}\n`
    })
    text += `\nConfira os detalhes aqui: ${window.location.href}`
    return text
})

const shareOnWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText.value)}`
    window.open(url, '_blank')
}

const handleNewSplit = () => {
    // If current session matches this split, clear it
    if (store.currentSplitId === splitId) {
        localStorage.removeItem('rateio-current-split-id')
        store.currentSplitId = null
    }
    router.push('/')
}

const copyLink = () => {
    copy(window.location.href)
}

</script>

<template>
  <div class="min-h-screen bg-zinc-50 pb-24">
    <header class="bg-white border-b px-4 py-4 flex items-center justify-between sticky top-0 z-40">
        <h1 class="font-bold text-emerald-600">Rateio Justo</h1>
        <Button variant="ghost" size="sm" @click="handleNewSplit">
            <Home class="w-4 h-4 mr-2" /> Início
        </Button>
    </header>

    <main class="p-4 max-w-md mx-auto w-full">
        <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 class="w-8 h-8 animate-spin text-emerald-500" />
            <p class="text-zinc-500">Carregando comprovante...</p>
        </div>

        <div v-else-if="error" class="text-center py-20">
            <p class="text-zinc-500 mb-4">{{ error }}</p>
            <Button @click="router.push('/')">Voltar ao Início</Button>
        </div>

        <div v-else-if="store.draft" class="space-y-6">
            <div class="text-center space-y-2">
                <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-2">
                    <Check class="w-6 h-6" />
                </div>
                <h2 class="text-2xl font-black text-zinc-900">Pagamento Confirmado!</h2>
                <p class="text-zinc-500">{{ store.draft.name }} • {{ new Date(store.draft.createdAt).toLocaleDateString() }}</p>
            </div>

            <Card class="bg-primary text-primary-foreground border-0 shadow-lg">
                <CardHeader>
                    <CardTitle class="text-lg opacity-90">Total da Conta</CardTitle>
                </CardHeader>
                <CardContent>
                    <div class="text-4xl font-bold">{{ formatCurrency(calculation?.grandTotalCents || 0) }}</div>
                </CardContent>
            </Card>

            <div class="space-y-3">
                <h3 class="font-bold text-zinc-500 uppercase text-xs tracking-widest pl-1">Divisão por pessoa</h3>
                <Card v-for="person in summary" :key="person.id">
                    <CardContent class="flex justify-between items-center p-4">
                        <div class="font-medium text-zinc-700">{{ person.name }}</div>
                        <div class="font-bold text-lg text-emerald-600">{{ formatCurrency(person.total) }}</div>
                    </CardContent>
                </Card>
            </div>

            <div class="grid grid-cols-2 gap-3 pt-4">
                <Button variant="outline" class="h-12 border-zinc-200" @click="copyLink">
                    <Check v-if="copied" class="w-4 h-4 mr-2 text-emerald-500" />
                    <Copy v-else class="w-4 h-4 mr-2" />
                    {{ copied ? 'Copiado!' : 'Copiar Link' }}
                </Button>
                <Button class="h-12 bg-[#25D366] hover:bg-[#20ba5a] text-white border-0" @click="shareOnWhatsApp">
                    <MessageCircle class="w-4 h-4 mr-2" /> WhatsApp
                </Button>
            </div>
            
            <Button variant="ghost" class="w-full text-zinc-400 font-medium" @click="handleNewSplit">
                Criar novo rateio
            </Button>
        </div>
    </main>
  </div>
</template>
