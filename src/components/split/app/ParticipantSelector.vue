<script setup lang="ts">
import { computed } from 'vue'
import { useSplitStore } from '@/stores/splitStore'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-vue-next'
import { useApi } from '@/api/useApi'

const props = withDefaults(
    defineProps<{
        itemId: string
        readOnly?: boolean
    }>(),
    { readOnly: false }
)

const api = useApi()
const store = useSplitStore()

const consumers = computed(() => store.getItemConsumers(props.itemId))
const draft = computed(() => store.draft)

const toggle = async (participantId: string) => {
    if (props.readOnly) return
    await store.toggleShare(api, props.itemId, participantId)
}

const isSelected = (id: string) => consumers.value.includes(id)
</script>

<template>
  <div class="flex flex-wrap gap-2 mt-2">
    <div 
        v-for="p in draft?.participants" 
        :key="p.id"
        :class="[
          'select-none transition-all',
          readOnly ? 'cursor-default opacity-90' : 'cursor-pointer active:scale-95'
        ]"
        @click="toggle(p.id)"
    >
        <Badge 
            :variant="isSelected(p.id) ? 'default' : 'outline'"
            class="h-8 px-3 text-sm flex items-center gap-1"
        >
            {{ p.name }}
        </Badge>
    </div>
  </div>
</template>
