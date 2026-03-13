<script setup lang="ts">
import { ref, computed, nextTick, useTemplateRef } from 'vue'
import { useSplitStore } from '@/stores/splitStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import CurrencyInput from './CurrencyInput.vue'
import ParticipantSelector from './ParticipantSelector.vue'
import { Switch } from '@/components/ui/switch'
import { Trash2, Loader2, Lock, Camera, Mic, Pencil } from 'lucide-vue-next'
import { useApi } from '@/api/useApi'
import { useI18n } from 'vue-i18n'
import { toast } from '@/components/ui/toast/use-toast'

import { useAudioRecorder } from '@/composables/useAudioRecorder'
import { useTemplateRef as useTplRef } from 'vue'

const { t } = useI18n()
const api = useApi()
const store = useSplitStore()

const isPaid = computed(() => store.draft?.status === 'PAID')

const newItemName = ref('')
const newItemAmount = ref(0)
const isAdding = ref(false)
const isProcessingIA = ref(false)
const nameInput = useTemplateRef('name-input')
const fileInput = useTplRef<HTMLInputElement>('file-input')

const { isRecording, startRecording, stopRecording } = useAudioRecorder()

const onStartMic = async () => {
    await startRecording()
}

const onStopMic = async () => {
    if (!store.draft) return
    isProcessingIA.value = true
    try {
        const audioBlob = await stopRecording()
        const formData = new FormData()
        formData.append('audio', audioBlob, 'voice.webm')
        
        const response = (await api.post(`/splits/${store.draft.id}/voice-parse`, formData)) as any
        
        if (response.parsedItems && Array.isArray(response.parsedItems)) {
            for (const item of response.parsedItems) {
                await store.addItem(api, item.name, item.amountCents)
            }
            toast({
                title: 'Itens adicionados',
                description: `${response.parsedItems.length} itens extraídos do áudio.`,
            })
        }
    } catch (err) {
        toast({
            title: 'Erro no processamento',
            description: 'Não foi possível extrair itens do áudio.',
            variant: 'destructive'
        })
    } finally {
        isProcessingIA.value = false
    }
}

const onCameraClick = () => {
    fileInput.value?.click()
}

const onFileChange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file || !store.draft) return

    isProcessingIA.value = true
    try {
        const formData = new FormData()
        formData.append('image', file)

        const response = (await api.post(`/splits/${store.draft.id}/ocr-parse`, formData)) as any

        if (response.parsedItems && Array.isArray(response.parsedItems)) {
            for (const item of response.parsedItems) {
                await store.addItem(api, item.name, item.amountCents)
            }
            toast({
                title: 'Itens adicionados',
                description: `${response.parsedItems.length} itens extraídos da imagem.`,
            })
        }
    } catch (err) {
        toast({
            title: 'Erro no OCR',
            description: 'Não foi possível ler a imagem da conta.',
            variant: 'destructive'
        })
    } finally {
        isProcessingIA.value = false
        if (fileInput.value) fileInput.value.value = ''
    }
}

const toggleMic = () => {
    if (isRecording.value) {
        onStopMic()
    } else {
        onStartMic()
    }
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
             const el = nameInput.value?.$el as HTMLInputElement | undefined
             if (el && typeof el.focus === 'function') {
                 el.focus()
             } else if (nameInput.value && '$el' in nameInput.value) {
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

// In-place editing state
const editingItemId = ref<string | null>(null)
const editName = ref('')
const editAmount = ref(0)

const startEdit = (item: any) => {
    if (isPaid.value) return
    editingItemId.value = item.id
    editName.value = item.name
    editAmount.value = item.amountCents
}

const cancelEdit = () => {
    editingItemId.value = null
}

const saveEdit = async () => {
    if (!editingItemId.value) return
    
    // If name is empty or amount invalid, we could cancel or show error. 
    // For now, let's revert to original if empty name.
    if (!editName.value) {
        editingItemId.value = null
        return
    }

    const id = editingItemId.value
    await store.updateItem(api, id, { name: editName.value, amountCents: editAmount.value })
    editingItemId.value = null
}
</script>

<template>
  <div class="space-y-6">
     <!-- Backdrop para edição premium -->
     <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
     >
        <div 
          v-if="editingItemId" 
          class="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]" 
          @click="saveEdit"
        />
     </Transition>

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
                    <input 
                        ref="file-input" 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        class="hidden" 
                        @change="onFileChange" 
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        class="h-9 w-9"
                        :class="{ 'opacity-50 pointer-events-none': isProcessingIA || isRecording }"
                        :disabled="isAdding || isProcessingIA || isRecording"
                        title="Escanear conta (OCR/IA)"
                        @click="onCameraClick"
                    >
                        <Loader2 v-if="isProcessingIA && !isRecording" class="h-4 w-4 animate-spin" />
                        <Camera v-else class="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        class="h-9 w-9 transition-colors"
                        :class="{ 
                            'bg-red-500 text-white hover:bg-red-600 animate-pulse border-red-500': isRecording,
                            'opacity-50 pointer-events-none': isProcessingIA && !isRecording
                        }"
                        :disabled="isAdding || isProcessingIA"
                        title="Narrar por áudio"
                        @click="toggleMic"
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
                    :disabled="isAdding || isProcessingIA || isRecording"
                    @keyup.enter="addItem"
                />
                <div class="w-32">
                    <CurrencyInput v-model="newItemAmount" @keyup.enter="addItem" :disabled="isAdding || isProcessingIA || isRecording" />
                </div>
             </div>
             <Button class="w-full" @click="addItem" :disabled="!newItemName || newItemAmount <= 0 || isAdding || isProcessingIA || isRecording">
                <Loader2 v-if="isAdding" class="w-4 h-4 mr-2 animate-spin" />
                {{ isAdding ? t('items.adding') : t('items.add') }}
             </Button>
        </CardContent>
     </Card>

     <!-- Items List -->
     <div class="space-y-4">
        <Card 
            v-for="item in store.draft?.items" 
            :key="item.id"
            :class="[
                'transition-all duration-200 overflow-visible',
                editingItemId === item.id ? 'relative z-[101] ring-2 ring-primary shadow-2xl scale-[1.02] bg-card' : 'bg-card'
            ]"
        >
            <CardContent class="p-4">
                <div v-if="editingItemId === item.id" class="space-y-4" @click.stop>
                    <div class="flex flex-col gap-3">
                        <Input 
                            v-model="editName" 
                            placeholder="Nome do item" 
                            class="text-lg font-bold h-11"
                            @keyup.enter="saveEdit"
                        />
                        <div class="w-full">
                            <CurrencyInput v-model="editAmount" @keyup.enter="saveEdit" />
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <Button variant="default" class="flex-1" @click="saveEdit">Salvar</Button>
                        <Button variant="ghost" class="text-muted-foreground" @click="cancelEdit">Cancelar</Button>
                    </div>
                </div>
                <div v-else>
                    <div class="flex justify-between items-start mb-2">
                        <div 
                            class="flex-1 cursor-pointer group pr-4" 
                            title="Clique para editar nome ou valor"
                            @click="startEdit(item)"
                        >
                            <div class="flex items-center gap-2 mb-0.5">
                                <h3 class="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{{ item.name }}</h3>
                                <Pencil class="w-3 h-3 text-muted-foreground/60 group-hover:text-primary group-hover:scale-110 transition-all shrink-0" />
                            </div>
                            <p class="text-sm text-muted-foreground group-hover:text-primary/80 transition-colors">
                                {{ (item.amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
                            </p>
                        </div>
                        <Button
                            v-if="!isPaid"
                            variant="ghost"
                            size="icon"
                            class="text-destructive h-8 w-8 shrink-0"
                            @click.stop="store.deleteItem(api, item.id)"
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
                </div>
            </CardContent>
        </Card>
        
        <div v-if="store.draft?.items.length === 0" class="text-center text-muted-foreground py-8">
            <p>{{ t('items.noItems') }}</p>
        </div>
     </div>
  </div>
</template>
