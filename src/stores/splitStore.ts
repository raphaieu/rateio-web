import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { useStorage } from '@vueuse/core'
import type { SplitDraft, Participant, Item } from '@/api/types'

export const useSplitStore = defineStore('split', {
    state: () => ({
        // Use VueUse's useStorage to persist current draft ID or list of drafts
        // For simplicity, we'll store a map of drafts locally
        drafts: useStorage<Record<string, SplitDraft>>('rateio-drafts', {}),
        currentSplitId: useStorage<string | null>('rateio-current-split-id', null),
    }),

    getters: {
        currentDraft: (state): SplitDraft | undefined => {
            if (!state.currentSplitId) return undefined
            return state.drafts[state.currentSplitId]
        },

        // Helper to get consumers for a specific item
        getItemConsumers: (state) => (itemId: string) => {
            if (!state.currentSplitId) return []
            const draft = state.drafts[state.currentSplitId]
            if (!draft) return []
            return draft.shares
                .filter(s => s.itemId === itemId)
                .map(s => s.participantId)
        }
    },

    actions: {
        createDraft(name: string = 'New Split') {
            const id = uuidv4()
            const newDraft: SplitDraft = {
                id,
                name,
                participants: [],
                items: [],
                shares: [],
                extras: [],
                createdAt: new Date().toISOString()
            }
            this.drafts[id] = newDraft
            this.currentSplitId = id

            // Quick Add Flow: Default 2 participants
            this.addParticipant('Person A')
            this.addParticipant('Person B')

            return id
        },

        loadDraft(id: string) {
            if (this.drafts[id]) {
                this.currentSplitId = id
                return true
            }
            return false
        },

        addParticipant(name: string) {
            const draft = this.currentDraft
            if (!draft) return

            const newParticipant: Participant = {
                id: uuidv4(),
                name,
                sortOrder: draft.participants.length
            }
            draft.participants.push(newParticipant)
        },

        addItem(name: string, amountCents: number) {
            const draft = this.currentDraft
            if (!draft) return

            const newItem: Item = {
                id: uuidv4(),
                name,
                amountCents
            }
            draft.items.push(newItem)
            // Optional: Auto-select all participants? User requested "Quick Item" not explicit about auto-select,
            // but usually "Select All" helper is enough. We start empty or empty? 
            // "Review tab must block if any item has zero consumers". 
            // Let's leave it empty so they have to choose (or use Select All).
        },

        toggleShare(itemId: string, participantId: string) {
            const draft = this.currentDraft
            if (!draft) return

            const idx = draft.shares.findIndex(s => s.itemId === itemId && s.participantId === participantId)
            if (idx >= 0) {
                draft.shares.splice(idx, 1)
            } else {
                draft.shares.push({ itemId, participantId })
            }
        },

        setAllShares(itemId: string, participantIds: string[]) {
            const draft = this.currentDraft
            if (!draft) return

            // Remove all existing shares for this item
            draft.shares = draft.shares.filter(s => s.itemId !== itemId)

            // Add new ones
            for (const pid of participantIds) {
                draft.shares.push({ itemId, participantId: pid })
            }
        },

        clearShares(itemId: string) {
            const draft = this.currentDraft
            if (!draft) return
            draft.shares = draft.shares.filter(s => s.itemId !== itemId)
        },

        deleteItem(itemId: string) {
            const draft = this.currentDraft
            if (!draft) return
            draft.items = draft.items.filter(i => i.id !== itemId)
            draft.shares = draft.shares.filter(s => s.itemId !== itemId)
        },

        deleteParticipant(participantId: string) {
            const draft = this.currentDraft
            if (!draft) return
            draft.participants = draft.participants.filter(p => p.id !== participantId)
            draft.shares = draft.shares.filter(s => s.participantId !== participantId)
        }
    }
})
