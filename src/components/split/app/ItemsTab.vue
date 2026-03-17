<script setup lang="ts">
import { ref, computed } from 'vue'
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
const showManualEntry = ref(false)
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
        // No focus back if we are in mobile/manual mode to avoid keyboard jumping if user wants to close
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

     <!-- Quick Add Form (Prioridade IA) -->
     <Card v-if="!isPaid" class="bg-card shadow-sm border-2 border-primary/10 overflow-hidden">
        <CardContent class="p-6">
             <div class="space-y-6">
                <!-- Seção IA: Grande e chamativa -->
                <div class="grid grid-cols-2 gap-4">
                    <input 
                        ref="file-input" 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        class="hidden" 
                        @change="onFileChange" 
                    />
                    <Button
                        variant="secondary"
                        class="h-28 flex flex-col gap-2 rounded-2xl border-2 border-transparent hover:border-primary/30 hover:bg-primary/5 transition-all group bg-primary/5"
                        :disabled="isAdding || isProcessingIA || isRecording"
                        @click="onCameraClick"
                    >
                        <div class="p-3 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors shadow-sm">
                            <Loader2 v-if="isProcessingIA && !isRecording" class="h-7 w-7 animate-spin text-primary" />
                            <Camera v-else class="h-7 w-7 text-primary" />
                        </div>
                        <span class="text-xs font-black uppercase tracking-widest text-primary/80">Escanear Conta</span>
                    </Button>

                    <Button
                        variant="secondary"
                        class="h-28 flex flex-col gap-2 rounded-2xl border-2 border-transparent transition-all group bg-primary/5"
                        :class="isRecording ? 'bg-red-500/10 border-red-500/50' : 'hover:border-primary/30 hover:bg-primary/5'"
                        :disabled="isAdding || isProcessingIA"
                        @click="toggleMic"
                    >
                        <div class="p-3 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors shadow-sm"
                             :class="{ 'bg-red-500/20 text-red-600 animate-pulse': isRecording }">
                            <Mic class="h-7 w-7 text-primary" :class="{ 'text-red-600': isRecording }" />
                        </div>
                        <span class="text-xs font-black uppercase tracking-widest text-primary/80" :class="{ 'text-red-700': isRecording }">
                            {{ isRecording ? 'Ouvindo...' : 'Narrar Itens' }}
                        </span>
                    </Button>
                </div>

                <!-- Divisor discreto para manual -->
                <div class="flex flex-col items-center">
                    <button 
                        class="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors py-2 px-4 rounded-full bg-muted/50"
                        @click="showManualEntry = !showManualEntry"
                    >
                        <Pencil class="w-3 h-3" />
                        {{ showManualEntry ? 'Ocultar entrada manual' : 'Adicionar manualmente' }}
                    </button>
                </div>

                <!-- Seção Manual: Colapsável com transição -->
                <Transition
                    enter-active-class="transition duration-300 ease-out"
                    enter-from-class="transform -translate-y-4 opacity-0 max-h-0"
                    enter-to-class="transform translate-y-0 opacity-100 max-h-[300px]"
                    leave-active-class="transition duration-200 ease-in"
                    leave-from-class="transform translate-y-0 opacity-100 max-h-[300px]"
                    leave-to-class="transform -translate-y-4 opacity-0 max-h-0"
                >
                    <div v-if="showManualEntry" class="space-y-4 pt-2 border-t border-dashed overflow-hidden">
                        <div class="flex gap-3">
                            <Input 
                                ref="name-input"
                                v-model="newItemName" 
                                :placeholder="t('items.namePlaceholder')"
                                class="flex-1 bg-muted/30"
                                :disabled="isAdding || isProcessingIA || isRecording"
                                @keyup.enter="addItem"
                            />
                            <div class="w-32">
                                <CurrencyInput v-model="newItemAmount" @keyup.enter="addItem" :disabled="isAdding || isProcessingIA || isRecording" />
                            </div>
                        </div>
                        <Button variant="outline" class="w-full bg-muted/50 hover:bg-primary/10" @click="addItem" :disabled="!newItemName || newItemAmount <= 0 || isAdding || isProcessingIA || isRecording">
                            <Loader2 v-if="isAdding" class="w-4 h-4 mr-2 animate-spin" />
                            {{ isAdding ? t('items.adding') : t('items.add') }}
                        </Button>
                    </div>
                </Transition>
             </div>
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
