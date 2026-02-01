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
import { useApi } from '@/api/useApi'
import { useDebounceFn } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useSplitStore()
const api = useApi()

const splitId = route.params.id as string
const activeTab = ref('items')

onMounted(async () => {
    if (!splitId) {
        router.push('/app')
        return
    }
    await store.fetchSplit(api, splitId)
    if (!store.draft) {
        // Handle 404
        router.push('/app')
    }
})

const currentDraft = computed(() => store.draft)

const updateName = useDebounceFn(async (newName: string) => {
    await store.updateSplit(api, { name: newName })
}, 1000)

const onNameInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    updateName(target.value)
}

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
                @input="onNameInput"
                class="bg-transparent font-bold text-lg w-full focus:outline-none"
                :placeholder="t('split.namePlaceholder')"
             />
        </div>
     </div>

     <Tabs v-model="activeTab" default-value="items" class="flex-1 flex flex-col overflow-hidden">
        <TabsList class="grid w-full grid-cols-4 rounded-none h-12">
            <TabsTrigger value="participants">{{ t('split.tabs.participants') }}</TabsTrigger>
            <TabsTrigger value="items">{{ t('split.tabs.items') }}</TabsTrigger>
            <TabsTrigger value="extras">{{ t('split.tabs.extras') }}</TabsTrigger>
            <TabsTrigger value="review">{{ t('split.tabs.review') }}</TabsTrigger>
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
