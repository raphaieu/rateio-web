<script setup lang="ts">
import { ref } from 'vue'
import { useSplitStore } from '@/stores/splitStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Trash2, User } from 'lucide-vue-next'
import { useApi } from '@/api/useApi'
import { useDebounceFn } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const api = useApi()
const store = useSplitStore()
const newName = ref('')

const add = async () => {
    if (!newName.value) return
    await store.addParticipant(api, newName.value)
    newName.value = ''
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
     <!-- Add Participant -->
     <div class="flex gap-2">
        <Input 
            v-model="newName" 
            :placeholder="t('participants.placeholder')"
            @keyup.enter="add"
        />
        <Button @click="add" :disabled="!newName">{{ t('participants.add') }}</Button>
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
                        @update:model-value="(val) => onNameUpdate(p, val)"
                        class="h-8 border-transparent focus-visible:border-input px-2 font-medium bg-transparent shadow-none"
                    />
                </div>
                <Button variant="ghost" size="icon" class="text-destructive h-8 w-8 shrink-0" @click="store.removeParticipant(api, p.id)">
                    <Trash2 class="w-4 h-4" />
                </Button>
            </CardContent>
        </Card>
     </div>
  </div>
</template>
