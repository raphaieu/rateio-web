<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useSplitStore } from '@/stores/splitStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import CurrencyInput from './CurrencyInput.vue'
import ParticipantSelector from './ParticipantSelector.vue'
import { Trash2 } from 'lucide-vue-next'

const store = useSplitStore()

const newItemName = ref('')
const newItemAmount = ref(0)
// const nameInput = ref<HTMLInputElement | null>(null)

const addItem = () => {
    if (!newItemName.value || newItemAmount.value <= 0) return
    store.addItem(newItemName.value, newItemAmount.value)
    newItemName.value = ''
    newItemAmount.value = 0
    // Focus back on name input for rapid entry
    nextTick(() => {
        // nameInput.value?.$el?.querySelector('input')?.focus() 
        // Need to ref the actual Input component correctly or use native input
        // Since shadcn Input wraps native input, we rely on autofocus or manual ref
    })
}

const selectAll = (itemId: string) => {
    if (!store.currentDraft) return
    const allIds = store.currentDraft.participants.map(p => p.id)
    store.setAllShares(itemId, allIds)
}

const clearAll = (itemId: string) => {
    store.clearShares(itemId)
}
</script>

<template>
  <div class="space-y-6">
     <!-- Quick Add Form -->
     <Card class="bg-muted/50 border-dashed">
        <CardContent class="p-4 space-y-3">
             <div class="flex gap-3">
                <Input 
                    v-model="newItemName" 
                    placeholder="Item (e.g. Pizza)" 
                    class="flex-1"
                    @keyup.enter="addItem"
                />
                <div class="w-32">
                    <CurrencyInput v-model="newItemAmount" @keyup.enter="addItem" />
                </div>
             </div>
             <Button class="w-full" @click="addItem" :disabled="!newItemName || newItemAmount <= 0">
                Add Item
             </Button>
        </CardContent>
     </Card>

     <!-- Items List -->
     <div class="space-y-4">
        <Card v-for="item in store.currentDraft?.items" :key="item.id">
            <CardContent class="p-4">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h3 class="font-bold text-lg leading-tight">{{ item.name }}</h3>
                        <p class="text-sm text-muted-foreground">
                            {{ (item.amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" class="text-destructive h-8 w-8" @click="store.deleteItem(item.id)">
                        <Trash2 class="w-4 h-4" />
                    </Button>
                </div>
                
                <div class="flex justify-between items-center text-xs text-muted-foreground mt-2 mb-1">
                    <span>Who consumed?</span>
                    <div class="flex gap-2">
                        <button class="hover:text-foreground flex items-center gap-1" @click="selectAll(item.id)">
                            All
                        </button>
                        <button class="hover:text-foreground" @click="clearAll(item.id)">
                            None
                        </button>
                    </div>
                </div>
                
                <ParticipantSelector :item-id="item.id" />
            </CardContent>
        </Card>
        
        <div v-if="store.currentDraft?.items.length === 0" class="text-center text-muted-foreground py-8">
            <p>No items added yet.</p>
        </div>
     </div>
  </div>
</template>
