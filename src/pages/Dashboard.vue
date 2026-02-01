<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSplitStore } from '@/stores/splitStore'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, CardContent, CardHeader } from '@/components/ui/card'
import { UserButton } from '@clerk/vue'
import { Plus } from 'lucide-vue-next'
import { onMounted } from 'vue'
import { useApi } from '@/api/useApi'

const api = useApi()

const store = useSplitStore()
const router = useRouter()
// const { user } = useUser()

const myDrafts = computed(() => {
  return Object.values(store.drafts).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
})

const createNewSplit = () => {
    const id = store.createDraft()
    router.push(`/app/splits/${id}`)
}

const openDraft = (id: string) => {
    router.push(`/app/splits/${id}`)
}

onMounted(async () => {
  const me = await api.get('/me')
  console.log('me', me)

  const pricing = await api.get('/pricing/current')
  console.log('pricing', pricing)
})

</script>

<template>
  <div class="min-h-screen bg-background p-4">
    <header class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">My Splits</h1>
      <UserButton />
    </header>

    <div class="grid gap-4">
      <Card 
        v-for="draft in myDrafts" 
        :key="draft.id" 
        @click="openDraft(draft.id)"
        class="cursor-pointer hover:bg-accent transition-colors"
      >
        <CardHeader class="pb-2">
            <CardTitle class="flex justify-between items-center text-lg">
                {{ draft.name }}
                <span class="text-xs text-muted-foreground font-normal">
                    {{ new Date(draft.createdAt).toLocaleDateString() }}
                </span>
            </CardTitle>
        </CardHeader>
        <CardContent>
             <p class="text-sm text-muted-foreground">
                {{ draft.participants.length }} participants • {{ draft.items.length }} items
             </p>
        </CardContent>
      </Card>
      
      <Button 
        class="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg" 
        size="icon" 
        @click="createNewSplit"
      >
        <Plus class="w-6 h-6" />
      </Button>
    </div>
    
    <div v-if="myDrafts.length === 0" class="text-center text-muted-foreground mt-10">
        <p>No splits yet.</p>
        <p class="text-sm">Tap + to start splitting.</p>
    </div>
  </div>
</template>
