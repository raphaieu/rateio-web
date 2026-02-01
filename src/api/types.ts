export type SplitDraft = {
    id: string
    name: string
    participants: Participant[]
    items: Item[]
    // shares: maps itemId + participantId -> ownership
    shares: Share[]
    extras: Extra[]
    createdAt: string // ISO
    status: 'OPEN' | 'PAID'
}

export type Participant = {
    id: string
    name: string
    sortOrder: number
}

export type Item = {
    id: string
    name: string
    amountCents: number
}

export type Share = {
    itemId: string
    participantId: string
}

export type ExtraType = 'FIXED' | 'SERVICE_PERCENT'
export type AllocationMode = 'EQUAL' | 'PROPORTIONAL'

export type Extra = {
    id: string
    type: ExtraType
    allocationMode: AllocationMode
    valueCents?: number
    valuePercentBp?: number // Basis points (e.g. 1000 = 10%)
}
