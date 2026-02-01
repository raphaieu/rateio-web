<script setup lang="ts">
import { computed } from 'vue'
import { useSplitStore } from '@/stores/splitStore'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-vue-next'
import { useApi } from '@/api/useApi'

const props = defineProps<{
    itemId: string
}>()

const api = useApi()
const store = useSplitStore()

const consumers = computed(() => store.getItemConsumers(props.itemId))
const draft = computed(() => store.draft)

const toggle = async (participantId: string) => {
    await store.toggleShare(api, props.itemId, participantId)
}

const isSelected = (id: string) => consumers.value.includes(id)
</script>

<template>
  <div class="flex flex-wrap gap-2 mt-2">
    <div 
        v-for="p in draft?.participants" 
        :key="p.id"
        class="cursor-pointer select-none transition-all active:scale-95"
        @click="toggle(p.id)"
    >
        <Badge 
            :variant="isSelected(p.id) ? 'default' : 'outline'"
            class="h-8 px-3 text-sm flex items-center gap-1"
        >
            <Check v-if="isSelected(p.id)" class="w-3 h-3" />
            {{ p.name }}
        </Badge>
    </div>
  </div>
</template>
