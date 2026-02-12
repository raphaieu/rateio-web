import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { useStorage } from '@vueuse/core'
import type { SplitDraft, Participant, Item, Extra } from '@/api/types'

// Define a subset of the useApi return type for better typing
type ApiClient = {
    get: <T>(path: string) => Promise<T>
    post: <T>(path: string, body?: any) => Promise<T>
    put: <T>(path: string, body?: any) => Promise<T>
    patch: <T>(path: string, body?: any) => Promise<T>
    delete: <T>(path: string) => Promise<T>
}

export const useSplitStore = defineStore('split', {
    state: () => ({
        // We keep the current draft in memory, but persist ID
        draft: null as SplitDraft | null,
        mySplits: [] as SplitDraft[],
        currentSplitId: useStorage<string | null>('rateio-current-split-id', null),
        isLoading: false,
        error: null as string | null,
        isSaving: false,
        syncTimeoutId: null as any, // Using 'any' because checking strict types for NodeJS.Timeout vs number can be annoying
        participantsDirty: false,
        syncParticipantsInFlight: null as Promise<void> | null,
        participantsRevision: 0,
        itemsDirty: false,
        syncItemsInFlight: null as Promise<void> | null,
        itemsRevision: 0,
    }),

    getters: {
        // Helper to get consumers for a specific item
        getItemConsumers: (state) => (itemId: string) => {
            if (!state.draft) return []
            return state.draft.shares
                .filter(s => s.itemId === itemId)
                .map(s => s.participantId)
        },

        hasParticipants: (state) => (state.draft?.participants.length || 0) > 0
    },

    actions: {
        markParticipantsDirty() {
            this.participantsDirty = true
            this.participantsRevision++
        },

        markItemsDirty() {
            this.itemsDirty = true
            this.itemsRevision++
        },

        async ensureParticipantsSynced(api: ApiClient) {
            // Duas passagens no máximo: cobre mudanças que ocorreram durante um sync em voo.
            await this.syncParticipants(api)
            if (this.participantsDirty) {
                await this.syncParticipants(api)
            }
        },

        async ensureItemsSynced(api: ApiClient) {
            // Duas passagens no máximo: cobre mudanças que ocorreram durante um sync em voo.
            await this.syncItems(api)
            if (this.itemsDirty) {
                await this.syncItems(api)
            }
        },

        async listSplits(api: ApiClient) {
            this.isLoading = true
            try {
                this.mySplits = await api.get<SplitDraft[]>('/splits')
            } catch (e) {
                console.error(e)
            } finally {
                this.isLoading = false
            }
        },

        async deleteSplit(api: ApiClient, id: string) {
            this.isLoading = true
            try {
                await api.delete<void>(`/splits/${id}`)
                this.mySplits = this.mySplits.filter(s => s.id !== id)
                if (this.currentSplitId === id) this.currentSplitId = null
                if (this.draft?.id === id) this.draft = null
            } catch (e) {
                console.error(e)
                throw e
            } finally {
                this.isLoading = false
            }
        },

        async createSplit(api: ApiClient, name: string = 'Rateio') {
            this.isLoading = true
            try {
                // Backend creates defaults (2 participants)
                const res = await api.post<{ id: string }>('/splits', {
                    name,
                    peopleCount: 2
                })

                this.currentSplitId = res.id
                // Immediately fetch to get the server-generated IDs
                await this.fetchSplit(api, res.id)
                return res.id
            } catch (e: any) {
                this.error = e.message
                throw e
            } finally {
                this.isLoading = false
            }
        },

        async fetchSplit(api: ApiClient, id: string) {
            this.isLoading = true
            this.error = null
            try {
                const data = await api.get<SplitDraft>(`/splits/${id}`)
                this.draft = data
                this.currentSplitId = id
            } catch (e: any) {
                console.error(e)
                this.error = "Failed to load split"
            } finally {
                this.isLoading = false
            }
        },

        async updateSplit(api: ApiClient, updates: {
            name?: string;
            latitude?: number | null;
            longitude?: number | null;
            placeProvider?: string | null;
            placeId?: string | null;
            placeName?: string | null;
            placeDisplayName?: string | null;
        }) {
            if (!this.draft) return

            // Optimistic
            if (updates.name) this.draft.name = updates.name
            if (updates.latitude !== undefined) this.draft.latitude = updates.latitude
            if (updates.longitude !== undefined) this.draft.longitude = updates.longitude
            if (updates.placeProvider !== undefined) this.draft.placeProvider = updates.placeProvider
            if (updates.placeId !== undefined) this.draft.placeId = updates.placeId
            if (updates.placeName !== undefined) this.draft.placeName = updates.placeName
            if (updates.placeDisplayName !== undefined) this.draft.placeDisplayName = updates.placeDisplayName

            try {
                await api.patch(`/splits/${this.draft.id}`, updates)
            } catch (e) {
                console.error(e)
            }
        },

        // --- Participants ---

        async addParticipant(api: ApiClient, name: string) {
            if (!this.draft) return

            // Optimistic Update
            const newParticipant: Participant = {
                id: uuidv4(),
                name,
                sortOrder: this.draft.participants.length
            }
            this.draft.participants.push(newParticipant)
            this.markParticipantsDirty()

            await this.syncParticipants(api)
        },

        async removeParticipant(api: ApiClient, participantId: string) {
            if (!this.draft) return
            this.draft.participants = this.draft.participants.filter(p => p.id !== participantId)
            // Also remove shares
            this.draft.shares = this.draft.shares.filter(s => s.participantId !== participantId)
            this.markParticipantsDirty()
            this.markItemsDirty()

            await this.syncParticipants(api)
            // We also need to sync items because shares changed? 
            // Actually backend handles share cascade delete, but we should sync items if we want to be safe or re-fetch?
            // Re-fetching might be safest but slower.
            // For now, let's just sync participants, backend will clean up shares for that user.
            // But if we have local shares in memory, we should clean them. Check.
        },

        async updateParticipantName(api: ApiClient, id: string, name: string) {
            if (!this.draft) return
            const p = this.draft.participants.find(p => p.id === id)
            if (p) {
                p.name = name
                this.markParticipantsDirty()
                // Debounce this in UI? Or just fire?
                // For now, fire.
                await this.syncParticipants(api)
            }
        },

        async syncParticipants(api: ApiClient) {
            if (!this.draft) return
            // Nada para sincronizar
            if (!this.participantsDirty && !this.syncParticipantsInFlight) return

            // Dedup: se já existe um sync em andamento, apenas aguarde
            if (this.syncParticipantsInFlight) {
                await this.syncParticipantsInFlight
                return
            }

            const doSync = async () => {
                if (!this.draft) return
                this.isSaving = true
                const revisionAtStart = this.participantsRevision

                await api.put(`/splits/${this.draft.id}/participants`, {
                    participants: this.draft.participants
                })

                // Só limpa dirty se nada mudou durante o sync
                if (this.participantsRevision === revisionAtStart) {
                    this.participantsDirty = false
                }
            }

            this.syncParticipantsInFlight = doSync()
            try {
                await this.syncParticipantsInFlight
            } catch (e) {
                console.error("Failed to sync participants", e)
                throw e
            } finally {
                this.isSaving = false
                this.syncParticipantsInFlight = null
            }
        },

        // --- Items ---

        async addItem(api: ApiClient, name: string, amountCents: number) {
            if (!this.draft) return

            const newItem: Item = {
                id: uuidv4(),
                name,
                amountCents
            }
            this.draft.items.push(newItem)
            this.markItemsDirty()
            await this.syncItems(api)
        },

        async deleteItem(api: ApiClient, itemId: string) {
            if (!this.draft) return
            this.draft.items = this.draft.items.filter(i => i.id !== itemId)
            this.draft.shares = this.draft.shares.filter(s => s.itemId !== itemId)
            this.markItemsDirty()
            await this.syncItems(api)
        },

        async toggleShare(api: ApiClient, itemId: string, participantId: string) {
            if (!this.draft) return

            const idx = this.draft.shares.findIndex(s => s.itemId === itemId && s.participantId === participantId)
            if (idx >= 0) {
                this.draft.shares.splice(idx, 1)
            } else {
                this.draft.shares.push({ itemId, participantId })
            }
            this.markItemsDirty()
            // Mobile-safe: persist in background (debounced)
            this.scheduleSyncItems(api)
        },

        setAllShares(api: ApiClient, itemId: string, participantIds: string[]) {
            if (!this.draft) return
            const rest = this.draft.shares.filter(s => s.itemId !== itemId)
            const newShares = rest.concat(
                participantIds.map(pid => ({ itemId, participantId: pid }))
            )
            this.draft.shares = newShares
            this.markItemsDirty()
            // Mobile-safe: persist in background (debounced)
            this.scheduleSyncItems(api)
        },

        async paySplit(api: ApiClient, topupCents: number = 0) {
            if (!this.draft) throw new Error("No draft")
            this.isLoading = true
            try {
                const res = await api.post<{
                    status: 'PAID' | 'PENDING',
                    qrCode?: string,
                    copyPaste?: string,
                    paymentId?: string
                }>(`/splits/${this.draft.id}/pay`, {
                    topupCents,
                    payWithWallet: true // Always try wallet first per specs
                })

                if (res.status === 'PAID') {
                    this.draft.status = 'PAID'
                }

                return res
            } catch (e: any) {
                console.error("Payment error", e)
                throw e
            } finally {
                this.isLoading = false
            }
        },

        async scheduleSyncItems(api: ApiClient) {
            if (this.syncTimeoutId) {
                clearTimeout(this.syncTimeoutId)
            }
            this.isSaving = true // Show loading immediately
            this.syncTimeoutId = setTimeout(() => {
                // Avoid unhandled promise rejections (errors are stored in `this.error`)
                this.syncItems(api).catch(() => {})
            }, 1000)
        },

        async syncItems(api: ApiClient) {
            if (!this.draft) return

            // Nada para sincronizar
            if (!this.itemsDirty && !this.syncItemsInFlight) return

            // Dedup: se já existe um sync em andamento, apenas aguarde
            if (this.syncItemsInFlight) {
                await this.syncItemsInFlight
                return
            }

            // Transform to backend format
            // item.consumerIds

            const doSync = async () => {
                if (!this.draft) return
                this.isSaving = true
                const revisionAtStart = this.itemsRevision

                // Critical: guarantee participants are persisted before sending consumerIds.
                // (Mobile devices can trigger item sync before participant sync completes.)
                await this.ensureParticipantsSynced(api)

                const itemsPayload = this.draft.items.map(item => {
                    const consumerIds = this.draft?.shares
                        .filter(s => s.itemId === item.id)
                        .map(s => s.participantId)

                    return {
                        id: item.id,
                        name: item.name,
                        amountCents: item.amountCents,
                        consumerIds
                    }
                })

                await api.put(`/splits/${this.draft.id}/items`, {
                    items: itemsPayload
                })

                // Só limpa dirty se nada mudou durante o sync
                if (this.itemsRevision === revisionAtStart) {
                    this.itemsDirty = false
                }
            }

            this.syncItemsInFlight = doSync()
            try {
                await this.syncItemsInFlight
            } catch (e) {
                console.error("Failed to sync items", e)
                const anyErr = e as any
                const status = typeof anyErr?.status === 'number' ? anyErr.status : null
                const reqId = anyErr?.requestId as string | undefined
                const detailError = anyErr?.details?.error as string | undefined

                if (status === 400 && detailError === 'Invalid consumerIds') {
                    this.error = `Falha ao salvar: participantes ainda não sincronizados. Tente novamente em alguns segundos.${reqId ? ` (Req: ${reqId})` : ''}`
                } else if (status) {
                    this.error = `Falha ao salvar alterações (HTTP ${status}). Verifique sua conexão e tente novamente.${reqId ? ` (Req: ${reqId})` : ''}`
                } else {
                    this.error = `Falha ao salvar alterações. Verifique sua conexão e tente novamente.${reqId ? ` (Req: ${reqId})` : ''}`
                }
                throw e
            } finally {
                this.isSaving = false
                this.syncTimeoutId = null
                this.syncItemsInFlight = null
            }
        },

        // --- Extras ---

        async addExtra(api: ApiClient, extra: Partial<Extra>) {
            if (!this.draft) return
            console.log(api, extra)
        },

        async syncExtras(api: ApiClient) {
            if (!this.draft) return
            console.log(api)
        },

        async computeReview(api: ApiClient) {
            if (!this.draft) return null
            try {
                // Evita corrida: garanta que alterações recentes estejam persistidas antes do cálculo.
                await this.ensureParticipantsSynced(api)
                await this.ensureItemsSynced(api)
                const res = await api.post<any>(`/splits/${this.draft.id}/compute-review`)
                return res.calculation
            } catch (e) {
                console.error(e)
                return null
            }
        },

        async markAsPaid(_api: ApiClient) {
            if (!this.draft) return
            try {
                // Assuming backend has this endpoint or we treat it as a generic update.
                // For now, since we know paySplit exists, this might be a manual override.
                // We will optimistically update and try to call a pay endpoint with a flag if possible,
                // or just assume it's done. 
                this.draft.status = 'PAID'
                // TODO: Implement backend sync for manual mark as paid if needed
            } catch (e) {
                console.error(e)
            }
        }
    }
})
