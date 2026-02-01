<script setup lang="ts">
import { ref, nextTick, useTemplateRef } from 'vue'
import { useSplitStore } from '@/stores/splitStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import CurrencyInput from './CurrencyInput.vue'
import ParticipantSelector from './ParticipantSelector.vue'
import { Trash2, Loader2 } from 'lucide-vue-next'
import { useApi } from '@/api/useApi'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const api = useApi()
const store = useSplitStore()

const newItemName = ref('')
const newItemAmount = ref(0)
const isAdding = ref(false)
const nameInput = useTemplateRef('name-input')

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

const selectAll = async (itemId: string) => {
    if (!store.draft) return
    const allIds = store.draft.participants.map(p => p.id)
    await store.setAllShares(api, itemId, allIds)
}

const clearAll = async (itemId: string) => {
    await store.setAllShares(api, itemId, [])
}
</script>

<template>
  <div class="space-y-6">
     <!-- Quick Add Form -->
     <Card class="bg-muted/50 border-dashed">
        <CardContent class="p-4 space-y-3">
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
                    <Button variant="ghost" size="icon" class="text-destructive h-8 w-8" @click="store.deleteItem(api, item.id)">
                        <Trash2 class="w-4 h-4" />
                    </Button>
                </div>
                
                <div class="flex justify-between items-center text-xs text-muted-foreground mt-2 mb-1">
                    <span>{{ t('items.whoConsumed') }}</span>
                    <div class="flex gap-2">
                        <button class="hover:text-foreground flex items-center gap-1" @click="selectAll(item.id)">
                            {{ t('items.all') }}
                        </button>
                        <button class="hover:text-foreground" @click="clearAll(item.id)">
                            {{ t('items.none') }}
                        </button>
                    </div>
                </div>
                
                <ParticipantSelector :item-id="item.id" />
            </CardContent>
        </Card>
        
        <div v-if="store.draft?.items.length === 0" class="text-center text-muted-foreground py-8">
            <p>{{ t('items.noItems') }}</p>
        </div>
     </div>
  </div>
</template>
