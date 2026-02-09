<script setup lang="ts">
import { ref, computed, nextTick, useTemplateRef } from 'vue'
import { useSplitStore } from '@/stores/splitStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import CurrencyInput from './CurrencyInput.vue'
import ParticipantSelector from './ParticipantSelector.vue'
import { Switch } from '@/components/ui/switch'
import { Trash2, Loader2, Lock, Camera, Mic } from 'lucide-vue-next'
import { useApi } from '@/api/useApi'
import { useI18n } from 'vue-i18n'
import { toast } from '@/components/ui/toast/use-toast'

const { t } = useI18n()
const api = useApi()
const store = useSplitStore()

const isPaid = computed(() => store.draft?.status === 'PAID')

const newItemName = ref('')
const newItemAmount = ref(0)
const isAdding = ref(false)
const nameInput = useTemplateRef('name-input')

const showComingSoon = (feature: 'camera' | 'mic') => {
    if (feature === 'camera') {
        toast({
            title: 'Em breve',
            description: 'Vamos permitir tirar foto da conta para escanear (OCR/IA) e preencher os itens automaticamente.',
        })
        return
    }

    toast({
        title: 'Em breve',
        description: 'Vamos permitir narrar a conta por áudio e o app transcrever/preencher os itens automaticamente.',
    })
}

const addItem = async () => {
    if (!newItemName.value || newItemAmount.value <= 0 || isAdding.value) return
    
    isAdding.value = true
    try {
        await store.addItem(api, newItemName.value, newItemAmount.value)
        newItemName.value = ''
        newItemAmount.value = 0
        // Focus back on name input for rapid entry
        nextTick(() => {
             // Access the underlying input element from ShadCN component if possible, 
             // but 'nameInput' ref usually points to the component instance.
             // We need to find the actual input or if the component exposes focus().
             // Checking ShadCN/Vue Input implementation usually it renders an input with v-bind $attrs.
             // Let's try attempting to focus the element.
             const el = nameInput.value?.$el as HTMLInputElement | undefined
             if (el && typeof el.focus === 'function') {
                 el.focus()
             } else if (nameInput.value && '$el' in nameInput.value) {
                 // Sometimes the root element is the input
                 (nameInput.value.$el as HTMLElement).focus()
             }
        })
    } finally {
        isAdding.value = false
    }
}

const isAllConsumers = (itemId: string) => {
    const participants = store.draft?.participants ?? []
    const consumers = store.getItemConsumers(itemId)
    return participants.length > 0 && consumers.length === participants.length
}

const onConsumedSwitch = (itemId: string, checked: boolean) => {
    if (!store.draft) return
    const participantIds = checked ? store.draft.participants.map(p => p.id) : []
    store.setAllShares(api, itemId, participantIds)
}
</script>

<template>
  <div class="space-y-6">
     <!-- Aviso: rateio desbloqueado (somente leitura) -->
     <div v-if="isPaid" class="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 flex items-start gap-3">
        <Lock class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p class="text-sm text-amber-800 dark:text-amber-200">{{ t('split.lockedMessage') }}</p>
     </div>

     <!-- Quick Add Form (oculto quando já pago) -->
     <Card v-if="!isPaid" class="bg-muted/50 border-dashed">
        <CardContent class="p-4 space-y-3">
             <div class="flex items-center justify-between">
                <div class="text-sm text-muted-foreground font-medium">Adicionar Item</div>
                <div class="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        class="h-9 w-9 opacity-70"
                        :disabled="isAdding"
                        title="Em breve: escanear conta (OCR/IA)"
                        @click="showComingSoon('camera')"
                    >
                        <Camera class="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        class="h-9 w-9 opacity-70"
                        :disabled="isAdding"
                        title="Em breve: narrar por áudio"
                        @click="showComingSoon('mic')"
                    >
                        <Mic class="h-4 w-4" />
                    </Button>
                </div>
             </div>
             <div class="flex gap-3">
                <Input 
                    ref="name-input"
                    v-model="newItemName" 
                    :placeholder="t('items.namePlaceholder')"
                    class="flex-1"
                    :disabled="isAdding"
                    @keyup.enter="addItem"
                />
                <div class="w-32">
                    <CurrencyInput v-model="newItemAmount" @keyup.enter="addItem" :disabled="isAdding" />
                </div>
             </div>
             <Button class="w-full" @click="addItem" :disabled="!newItemName || newItemAmount <= 0 || isAdding">
                <Loader2 v-if="isAdding" class="w-4 h-4 mr-2 animate-spin" />
                {{ isAdding ? t('items.adding') : t('items.add') }}
             </Button>
        </CardContent>
     </Card>

     <!-- Items List -->
     <div class="space-y-4">
        <Card v-for="item in store.draft?.items" :key="item.id">
            <CardContent class="p-4">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h3 class="font-bold text-lg leading-tight">{{ item.name }}</h3>
                        <p class="text-sm text-muted-foreground">
                            {{ (item.amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
                        </p>
                    </div>
                    <Button
                        v-if="!isPaid"
                        variant="ghost"
                        size="icon"
                        class="text-destructive h-8 w-8"
                        @click="store.deleteItem(api, item.id)"
                    >
                        <Trash2 class="w-4 h-4" />
                    </Button>
                </div>
                
                <div v-if="!isPaid" class="mt-3 space-y-2">
                    <div class="flex items-center justify-between gap-3">
                        <span class="text-sm text-muted-foreground">{{ t('items.whoConsumed') }}</span>
                        <div class="flex items-center gap-2 shrink-0">
                            <Switch
                                :model-value="isAllConsumers(item.id)"
                                :disabled="isPaid || (store.draft?.participants.length ?? 0) === 0"
                                @update:model-value="(v) => onConsumedSwitch(item.id, v === true)"
                            />
                            <span class="text-xs text-muted-foreground">{{ t('items.all') }}</span>
                        </div>
                    </div>
                    <ParticipantSelector :item-id="item.id" :read-only="isPaid" />
                </div>
            </CardContent>
        </Card>
        
        <div v-if="store.draft?.items.length === 0" class="text-center text-muted-foreground py-8">
            <p>{{ t('items.noItems') }}</p>
        </div>
     </div>
  </div>
</template>
