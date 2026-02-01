<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSplitStore } from '@/stores/splitStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-vue-next'
import ItemsTab from '@/components/split/app/ItemsTab.vue'
import ParticipantsTab from '@/components/split/app/ParticipantsTab.vue'
import ReviewTab from '@/components/split/app/ReviewTab.vue'
import ExtrasTab from '@/components/split/app/ExtrasTab.vue'

const route = useRoute()
const router = useRouter()
const store = useSplitStore()

const splitId = route.params.id as string
const activeTab = ref('items')

onMounted(() => {
    const exists = store.loadDraft(splitId)
    if (!exists) {
        router.push('/app')
    }
})

const currentDraft = computed(() => store.currentDraft)

</script>

<template>
  <div v-if="currentDraft" class="flex flex-col h-screen bg-background">
     <div class="p-4 border-b flex items-center gap-2 sticky top-0 bg-background z-10">
        <Button variant="ghost" size="icon" @click="router.push('/app')">
            <ArrowLeft class="w-5 h-5" />
        </Button>
        <div class="flex-1">
             <input 
                v-model="currentDraft.name" 
                class="bg-transparent font-bold text-lg w-full focus:outline-none"
                placeholder="Split Name"
            />
        </div>
     </div>

     <Tabs v-model="activeTab" default-value="items" class="flex-1 flex flex-col overflow-hidden">
        <TabsList class="grid w-full grid-cols-4 rounded-none h-12">
            <TabsTrigger value="participants">People</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="extras">Extras</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
        </TabsList>
        
        <div class="flex-1 overflow-y-auto p-4 pb-20">
             <TabsContent value="participants">
                <ParticipantsTab />
             </TabsContent>
             <TabsContent value="items">
                <ItemsTab />
             </TabsContent>
             <TabsContent value="extras">
                <ExtrasTab />
             </TabsContent>
             <TabsContent value="review">
                <ReviewTab />
             </TabsContent>
        </div>
     </Tabs>
  </div>
</template>
