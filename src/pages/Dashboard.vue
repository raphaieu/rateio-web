<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSplitStore } from '@/stores/splitStore'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, CardContent, CardHeader } from '@/components/ui/card'
import { UserButton } from '@clerk/vue'
import type { SplitDraft } from '@/api/types'
import { Plus, Trash2, Loader2 } from 'lucide-vue-next'
import { useApi } from '@/api/useApi'
import { useI18n } from 'vue-i18n'
import { toast } from '@/components/ui/toast/use-toast'

const { t } = useI18n()
const api = useApi()

const store = useSplitStore()
const router = useRouter()

const myDrafts = computed(() => store.mySplits)
const deletingId = ref<string | null>(null)

const createNewSplit = async () => {
    try {
        const id = await store.createSplit(api)
        if (id) {
            router.push(`/app/splits/${id}`)
        }
    } catch (e) {
        console.error(e)
    }
}

const openDraft = (id: string) => {
    router.push(`/app/splits/${id}`)
}

const countLabel = (count: number, oneKey: string, otherKey: string) => {
    return `${count} ${t(count === 1 ? oneKey : otherKey)}`
}

const deleteDraft = async (draft: SplitDraft) => {
    const ok = window.confirm(t('dashboard.card.deleteConfirm', { name: draft.name }))
    if (!ok) return

    deletingId.value = draft.id
    try {
        await store.deleteSplit(api, draft.id)
        toast({ title: t('dashboard.card.deleted') })
    } catch (e: any) {
        console.error(e)
        if (e?.status === 404) {
            toast({ title: t('dashboard.card.deleteNotSupported') })
        } else {
            toast({ title: t('dashboard.card.deleteError') })
        }
    } finally {
        deletingId.value = null
    }
}

onMounted(async () => {
  try {
      await store.listSplits(api)
  } catch (e) {
      console.error(e)
  }
})
</script>

<template>
  <div class="min-h-screen bg-background p-4">
    <header class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">{{ t('dashboard.mySplits') }}</h1>
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
                <span class="truncate">{{ draft.name }}</span>
                <span class="flex items-center gap-2 shrink-0">
                    <span class="text-xs text-muted-foreground font-normal">
                        {{ new Date(Number(draft.createdAt) * 1000).toLocaleDateString() }}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      class="text-destructive hover:text-destructive/90"
                      :disabled="deletingId === draft.id"
                      @click.stop.prevent="deleteDraft(draft)"
                      :aria-label="t('dashboard.card.delete')"
                      :title="t('dashboard.card.delete')"
                    >
                      <Loader2 v-if="deletingId === draft.id" class="animate-spin" />
                      <Trash2 v-else />
                    </Button>
                </span>
            </CardTitle>
        </CardHeader>
        <CardContent>
             <p class="text-sm text-muted-foreground">
                {{ countLabel(draft.participants.length, 'dashboard.card.participantsOne', 'dashboard.card.participantsOther') }}
                •
                {{ countLabel(draft.items.length, 'dashboard.card.itemsOne', 'dashboard.card.itemsOther') }}
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
        <p>{{ t('dashboard.noSplits') }}</p>
        <p class="text-sm">{{ t('dashboard.createSplit') }}</p>
    </div>
  </div>
</template>
