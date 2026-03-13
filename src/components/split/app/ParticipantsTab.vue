<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSplitStore } from '@/stores/splitStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Trash2, User, Lock, Mic, Loader2 } from 'lucide-vue-next'
import { useApi } from '@/api/useApi'
import { useDebounceFn } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { useAudioRecorder } from '@/composables/useAudioRecorder'
import { toast } from '@/components/ui/toast/use-toast'

const { t } = useI18n()
const api = useApi()
const store = useSplitStore()
const newName = ref('')
const isProcessingIA = ref(false)

const { isRecording, startRecording, stopRecording } = useAudioRecorder()

const isPaid = computed(() => store.draft?.status === 'PAID')

const add = async () => {
    if (!newName.value) return
    await store.addParticipant(api, newName.value)
    newName.value = ''
}

const toggleMic = async () => {
    if (isRecording.value) {
        if (!store.draft) return
        isProcessingIA.value = true
        try {
            const blob = await stopRecording()
            const formData = new FormData()
            formData.append('audio', blob, 'participants.webm')
            
            const response = (await api.post(`/splits/${store.draft.id}/transcribe`, formData)) as any
            
            if (response.names && Array.isArray(response.names)) {
                for (const name of response.names) {
                    await store.addParticipant(api, name)
                }
                toast({
                    title: 'Participantes adicionados',
                    description: `${response.names.length} nomes identificados.`,
                })
            }
        } catch (err) {
            toast({
                title: 'Erro na transcrição',
                description: 'Não foi possível extrair nomes do áudio.',
                variant: 'destructive'
            })
        } finally {
            isProcessingIA.value = false
        }
    } else {
        await startRecording()
    }
}

const sync = useDebounceFn(async () => {
    store.syncParticipants(api)
}, 1000)

const onNameUpdate = (p: any, newName: string | number) => {
    // Update local state immediately for UI responsiveness
    p.name = newName.toString()
    // Trigger debounced sync
    sync()
}
</script>

<template>
  <div class="space-y-6">
     <!-- Aviso: rateio desbloqueado (somente leitura) -->
     <div v-if="isPaid" class="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 flex items-start gap-3">
        <Lock class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p class="text-sm text-amber-800 dark:text-amber-200">{{ t('split.lockedMessage') }}</p>
     </div>

     <!-- Add Participant (oculto quando já pago) -->
     <div v-if="!isPaid" class="flex gap-2">
        <div class="relative flex-1">
            <Input 
                v-model="newName" 
                :placeholder="t('participants.placeholder')"
                :disabled="isProcessingIA || isRecording"
                @keyup.enter="add"
                class="pr-10"
            />
            <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7 transition-colors rounded-full"
                    :class="{ 
                        'bg-red-500 text-white hover:bg-red-600 animate-pulse': isRecording,
                        'text-muted-foreground': !isRecording 
                    }"
                    :disabled="isProcessingIA"
                    @click="toggleMic"
                >
                    <Loader2 v-if="isProcessingIA" class="h-3 w-3 animate-spin" />
                    <Mic v-else class="h-3 w-3" />
                </Button>
            </div>
        </div>
        <Button @click="add" :disabled="!newName || isProcessingIA || isRecording">{{ t('participants.add') }}</Button>
     </div>

     <!-- List -->
     <div class="space-y-3">
        <Card v-for="p in store.draft?.participants" :key="p.id">
            <CardContent class="p-3 flex items-center justify-between">
                <div class="flex items-center gap-3 flex-1">
                    <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <User class="w-4 h-4" />
                    </div>
                    <Input 
                        :model-value="p.name" 
                        :readonly="isPaid"
                        @update:model-value="(val) => onNameUpdate(p, val)"
                        class="h-8 border-transparent focus-visible:border-input px-2 font-medium bg-transparent shadow-none"
                    />
                </div>
                <Button
                    v-if="!isPaid"
                    variant="ghost"
                    size="icon"
                    class="text-destructive h-8 w-8 shrink-0"
                    @click="store.removeParticipant(api, p.id)"
                >
                    <Trash2 class="w-4 h-4" />
                </Button>
            </CardContent>
        </Card>
     </div>
  </div>
</template>
