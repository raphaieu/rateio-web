<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSplitStore } from '@/stores/splitStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MapPin, Loader2, Search, Check } from 'lucide-vue-next'
import ItemsTab from '@/components/split/app/ItemsTab.vue'
import ParticipantsTab from '@/components/split/app/ParticipantsTab.vue'
import ReviewTab from '@/components/split/app/ReviewTab.vue'
import ExtrasTab from '@/components/split/app/ExtrasTab.vue'
import { useApi } from '@/api/useApi'
import { useDebounceFn } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import Input from '@/components/ui/input/Input.vue'
import { toast } from '@/components/ui/toast/use-toast'

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

// Ao sair da aba Itens, uma única requisição com todo o estado (itens + seleções)
watch(activeTab, (newTab, oldTab) => {
    if (oldTab === 'items' && newTab !== 'items') {
        store.syncItems(api).catch(() => {
            toast({
                title: 'Falha ao salvar alterações',
                description: 'Verifique sua conexão e tente novamente.',
            })
        })
    }
})

const currentDraft = computed(() => store.draft)
const isPaid = computed(() => store.draft?.status === 'PAID')
const saveError = computed(() => store.error)
const isSaving = computed(() => store.isSaving)
const hasLocation = computed(() => currentDraft.value?.latitude != null && currentDraft.value?.longitude != null)

const placeAddressLine = computed<string | null>(() => {
    const display = currentDraft.value?.placeDisplayName?.trim() || ''
    if (!display) return null

    const nameCandidates = [
        currentDraft.value?.placeName?.trim(),
        currentDraft.value?.name?.trim(),
    ].filter((v): v is string => Boolean(v))

    for (const prefix of nameCandidates) {
        if (display === prefix) return null
        const normalizedPrefix = `${prefix},`
        if (display.startsWith(normalizedPrefix)) {
            const rest = display.slice(normalizedPrefix.length).trim()
            return rest || null
        }
    }

    return display
})

const isLocating = ref(false)
const isPlaceSearchOpen = ref(false)
const placeQuery = ref('')
const isSearchingPlaces = ref(false)
const isLoadingGpsSuggestion = ref(false)
const gpsSuggestion = ref<null | {
    provider: string
    placeId: string | null
    name: string | null
    displayName: string | null
    latitude: number | null
    longitude: number | null
}>(null)
const placeResults = ref<Array<{
    provider: string
    placeId: string | null
    name: string | null
    displayName: string | null
    latitude: number | null
    longitude: number | null
    distanceKm?: number | null
}>>([])

const updateName = useDebounceFn(async (newName: string) => {
    await store.updateSplit(api, { name: newName })
}, 1000)

const onNameInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    updateName(target.value)
}

const runPlaceSearch = useDebounceFn(async () => {
    const q = placeQuery.value.trim()
    if (q.length < 2) {
        placeResults.value = []
        return
    }

    isSearchingPlaces.value = true
    try {
        const lat = currentDraft.value?.latitude
        const lng = currentDraft.value?.longitude
        const bias =
            lat != null && lng != null
                ? `&lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`
                : ''

        const res = await api.get<{ results: typeof placeResults.value }>(
            `/geo/search?q=${encodeURIComponent(q)}&limit=6${bias}`
        )
        placeResults.value = res.results || []
    } catch (e) {
        console.error('Place search failed', e)
        toast({ title: 'Não foi possível buscar lugares', description: 'Verifique sua conexão e tente novamente.' })
    } finally {
        isSearchingPlaces.value = false
    }
}, 300)

watch(placeQuery, () => {
    if (isPlaceSearchOpen.value) runPlaceSearch()
})

watch(isPlaceSearchOpen, (open) => {
    if (open) {
        // Abrir SEM conflitar com o nome do rateio/sugestões anteriores.
        // A busca só acontece quando o usuário digitar.
        placeQuery.value = ''
        placeResults.value = []

        // Se já temos coordenadas, mostrar uma sugestão "pelo GPS" separada (reverse).
        gpsSuggestion.value = null
        const lat = currentDraft.value?.latitude
        const lng = currentDraft.value?.longitude
        if (lat != null && lng != null) {
            isLoadingGpsSuggestion.value = true
            api.get<{
                provider: string
                placeId: string | null
                name: string | null
                displayName: string | null
                latitude: number | null
                longitude: number | null
            }>(`/geo/reverse?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`)
                .then((rev) => {
                    gpsSuggestion.value = rev || null
                })
                .catch((e) => {
                    console.error('GPS suggestion reverse failed', e)
                })
                .finally(() => {
                    isLoadingGpsSuggestion.value = false
                })
        }
    } else {
        isSearchingPlaces.value = false
        isLoadingGpsSuggestion.value = false
        gpsSuggestion.value = null
        placeResults.value = []
    }
})

const applyPlaceAsSplitName = async (place: (typeof placeResults.value)[number]) => {
    if (!currentDraft.value) return
    if (isPaid.value) return

    const name = place.name?.trim() || place.displayName?.split(',')?.[0]?.trim()
    if (!name) {
        toast({ title: 'Lugar sem nome', description: 'Selecione outro resultado.' })
        return
    }

    await store.updateSplit(api, {
        name,
        latitude: place.latitude ?? null,
        longitude: place.longitude ?? null,
        placeProvider: place.provider || 'nominatim',
        placeId: place.placeId,
        placeName: name,
        placeDisplayName: place.displayName,
    })

    toast({ title: 'Nome do rateio atualizado', description: name })
    isPlaceSearchOpen.value = false
}

const useTypedTextAsSplitName = async () => {
    const name = placeQuery.value.trim()
    if (!name) return
    await store.updateSplit(api, { name })
    toast({ title: 'Nome do rateio atualizado', description: name })
    isPlaceSearchOpen.value = false
}

const pinCurrentLocation = async () => {
    if (!currentDraft.value) return
    if (isPaid.value) return
    if (!('geolocation' in navigator)) {
        console.error('Geolocation not supported')
        toast({ title: 'GPS indisponível', description: 'Seu navegador não suporta geolocalização.' })
        return
    }

    isLocating.value = true
    try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0,
            })
        })

        const { latitude, longitude } = position.coords
        await store.updateSplit(api, { latitude, longitude })

        // Sugestão de nome via reverse geocoding
        try {
            const rev = await api.get<{
                provider: string
                placeId: string | null
                name: string | null
                displayName: string | null
                latitude: number | null
                longitude: number | null
            }>(`/geo/reverse?lat=${encodeURIComponent(String(latitude))}&lng=${encodeURIComponent(String(longitude))}`)

            const suggestedName = rev?.name?.trim() || null
            if (suggestedName) {
                const currentName = (currentDraft.value?.name || '').trim()
                const isDefaultName = currentName === '' || /^Rateio\b/i.test(currentName)

                await store.updateSplit(api, {
                    placeProvider: rev.provider || 'nominatim',
                    placeId: rev.placeId,
                    placeName: suggestedName,
                    placeDisplayName: rev.displayName,
                    name: isDefaultName ? suggestedName : undefined,
                })

                toast({
                    title: isDefaultName ? 'Nome sugerido aplicado' : 'Sugestão de estabelecimento',
                    description: suggestedName,
                })
            } else {
                toast({ title: 'Localização marcada', description: 'Coordenadas salvas.' })
            }
        } catch (e) {
            console.error('Reverse geocoding failed', e)
            toast({ title: 'Localização marcada', description: 'Coordenadas salvas (sem sugestão de nome).' })
        }
    } catch (e) {
        console.error('Failed to get geolocation', e)
        toast({ title: 'Não foi possível obter o GPS', description: 'Permita o acesso à localização e tente novamente.' })
    } finally {
        isLocating.value = false
    }
}

</script>

<template>
  <div v-if="currentDraft" class="flex flex-col min-h-screen h-[100dvh] bg-background">
     <Tabs v-model="activeTab" default-value="items" class="flex-1 flex flex-col min-h-0">
        <div class="sticky top-0 bg-background z-10">
            <div class="p-4 border-b flex items-center gap-2">
                <Button variant="ghost" size="icon" @click="router.push('/app')">
                    <ArrowLeft class="w-5 h-5" />
                </Button>
                <div class="flex-1 min-w-0">
                    <div class="flex flex-col min-w-0">
                        <input 
                           v-model="currentDraft.name"
                           :readonly="isPaid"
                           @input="onNameInput"
                           class="bg-transparent font-bold text-lg w-full focus:outline-none"
                           :class="{ 'cursor-default': isPaid }"
                           :placeholder="t('split.namePlaceholder')"
                        />
                        <div
                          v-if="placeAddressLine"
                          class="text-xs text-muted-foreground mt-0.5 line-clamp-1"
                          :title="placeAddressLine"
                        >
                          {{ placeAddressLine }}
                        </div>
                    </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  :disabled="isPaid"
                  title="Buscar estabelecimento"
                  @click="isPlaceSearchOpen = true"
                >
                  <Search class="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  :disabled="isPaid || isLocating"
                  :title="hasLocation ? 'Localização definida' : 'Marcar localização (GPS)'"
                  @click="pinCurrentLocation"
                >
                  <Loader2 v-if="isLocating" class="w-5 h-5 animate-spin" />
                  <MapPin v-else class="w-5 h-5" :class="hasLocation ? 'text-primary' : ''" />
                </Button>
            </div>

            <TabsList class="grid w-full grid-cols-4 rounded-none h-12 border-b">
                <TabsTrigger value="participants">{{ t('split.tabs.participants') }}</TabsTrigger>
                <TabsTrigger value="items">{{ t('split.tabs.items') }}</TabsTrigger>
                <TabsTrigger value="extras">{{ t('split.tabs.extras') }}</TabsTrigger>
                <TabsTrigger value="review">{{ t('split.tabs.review') }}</TabsTrigger>
            </TabsList>
        </div>

        <Dialog v-model:open="isPlaceSearchOpen">
            <DialogContent
                class="sm:max-w-lg top-6 -translate-y-0 sm:top-1/2 sm:-translate-y-1/2 max-h-[80dvh] overflow-y-auto"
            >
                <DialogHeader>
                    <DialogTitle>Buscar estabelecimento</DialogTitle>
                    <DialogDescription>
                        Pesquise um lugar e use como nome do rateio.
                    </DialogDescription>
                </DialogHeader>

            <div class="space-y-3 py-2">
                <Input
                  v-model="placeQuery"
                  placeholder="Ex: Bar do Zé, Restaurante, Padaria…"
                />

                <!-- Sugestão via GPS (compacta; melhor no mobile com teclado) -->
                <div v-if="hasLocation && !placeQuery.trim()" class="text-xs text-muted-foreground flex items-center gap-2">
                    <span class="shrink-0">Sugestão via GPS:</span>

                    <span v-if="isLoadingGpsSuggestion" class="flex items-center gap-1">
                        <Loader2 class="w-3 h-3 animate-spin" />
                        Buscando…
                    </span>

                    <button
                      v-else-if="gpsSuggestion?.name || gpsSuggestion?.displayName"
                      type="button"
                      class="text-foreground underline underline-offset-2 truncate text-left"
                      :title="gpsSuggestion?.displayName || gpsSuggestion?.name || ''"
                      @click="applyPlaceAsSplitName({
                        provider: gpsSuggestion?.provider || 'nominatim',
                        placeId: gpsSuggestion?.placeId ?? null,
                        name: gpsSuggestion?.name ?? null,
                        displayName: gpsSuggestion?.displayName ?? null,
                        latitude: currentDraft?.latitude ?? null,
                        longitude: currentDraft?.longitude ?? null
                      })"
                    >
                      {{ gpsSuggestion?.name || (gpsSuggestion?.displayName ? gpsSuggestion.displayName.split(',')[0] : 'Usar sugestão do GPS') }}
                    </button>

                    <span v-else class="truncate">Nenhuma</span>
                </div>

                <div v-if="isSearchingPlaces" class="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 class="w-4 h-4 animate-spin" /> Buscando…
                </div>

                <div v-else class="space-y-2">
                    <Button
                      v-if="placeQuery.trim()"
                      variant="secondary"
                      class="w-full justify-start"
                      @click="useTypedTextAsSplitName"
                    >
                      <Check class="w-4 h-4 mr-2" />
                      Usar “{{ placeQuery.trim() }}” como nome
                    </Button>

                    <div v-if="placeResults.length > 0" class="border rounded-md divide-y">
                        <button
                          v-for="r in placeResults"
                          :key="`${r.provider}:${r.placeId}:${r.latitude}:${r.longitude}`"
                          type="button"
                          class="w-full text-left p-3 hover:bg-muted/50 transition"
                          @click="applyPlaceAsSplitName(r)"
                        >
                            <div class="font-medium">
                                {{ r.name || (r.displayName ? r.displayName.split(',')[0] : 'Sem nome') }}
                            </div>
                            <div class="mt-1 flex items-start justify-between gap-3">
                                <div v-if="r.displayName" class="text-xs text-muted-foreground line-clamp-2">
                                    {{ r.displayName }}
                                </div>
                                <div
                                  v-if="r.distanceKm != null && Number.isFinite(r.distanceKm)"
                                  class="text-xs text-muted-foreground whitespace-nowrap"
                                  :title="`${r.distanceKm.toFixed(2)} km`"
                                >
                                  {{ r.distanceKm < 10 ? r.distanceKm.toFixed(1) : Math.round(r.distanceKm) }} km
                                </div>
                            </div>
                        </button>
                    </div>

                    <div v-else-if="placeQuery.trim().length >= 2" class="text-sm text-muted-foreground">
                        Nenhum resultado.
                    </div>
                    <div v-else class="text-sm text-muted-foreground">
                        Digite pelo menos 2 caracteres para buscar.
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button variant="secondary" @click="isPlaceSearchOpen = false">Fechar</Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>

        <div class="flex-1 min-h-0 overflow-y-auto p-4 pb-20 overscroll-contain">
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
                <ReviewTab :is-active="activeTab === 'review'" />
            </TabsContent>
        </div>
     </Tabs>

     <!-- Save status (fixed overlay; no layout shift) -->
     <div
        :class="[
          'fixed inset-x-0 z-50 flex justify-center pointer-events-none',
          activeTab === 'review' ? 'bottom-24' : 'bottom-6'
        ]"
     >
        <div
          v-if="saveError"
          class="pointer-events-auto max-w-[92vw] w-fit rounded-full border bg-background shadow-sm px-3 py-2 flex items-center gap-3"
        >
          <div class="text-sm text-amber-900">
            {{ saveError }}
          </div>
          <Button
            variant="outline"
            size="sm"
            class="h-8 px-3"
            @click="store.syncItems(api)"
          >
            Tentar salvar
          </Button>
        </div>
        <div
          v-else-if="isSaving"
          class="max-w-[92vw] w-fit rounded-full border bg-background/90 backdrop-blur shadow-sm px-3 py-2 text-xs text-muted-foreground"
        >
          Salvando…
        </div>
     </div>
  </div>
</template>
