<script setup lang="ts">
import { ref } from 'vue'
import { useSplitStore } from '@/stores/splitStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Trash2, User } from 'lucide-vue-next'

const store = useSplitStore()
const newName = ref('')

const add = () => {
    if (!newName.value) return
    store.addParticipant(newName.value)
    newName.value = ''
}
</script>

<template>
  <div class="space-y-6">
     <!-- Add Participant -->
     <div class="flex gap-2">
        <Input 
            v-model="newName" 
            placeholder="Name (e.g. Bob)" 
            @keyup.enter="add"
        />
        <Button @click="add" :disabled="!newName">Add</Button>
     </div>

     <!-- List -->
     <div class="space-y-3">
        <Card v-for="p in store.currentDraft?.participants" :key="p.id">
            <CardContent class="p-3 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User class="w-4 h-4" />
                    </div>
                    <span class="font-medium">{{ p.name }}</span>
                </div>
                <Button variant="ghost" size="icon" class="text-destructive h-8 w-8" @click="store.deleteParticipant(p.id)">
                    <Trash2 class="w-4 h-4" />
                </Button>
            </CardContent>
        </Card>
     </div>
  </div>
</template>
