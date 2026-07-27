export type Stats = {
  strength: number
  agility: number
  endurance: number
  perception: number
  intellect: number
  charisma: number
}

export type CharacterStatus = 'pending' | 'approved' | 'rejected'

export type InventoryStack = { itemId: string; qty: number }
export type Equipped = {
  head: string | null
  torso: string | null
  legs: string | null
  boots: string | null
  accessory: string | null
  backpack: string | null
}

export const EMPTY_EQUIPPED: Equipped = {
  head: null, torso: null, legs: null, boots: null, accessory: null, backpack: 'backpack_none',
}

export type Character = {
  id: string
  owner: string // nickname of the account that created it
  name: string
  stats: Stats
  status: CharacterStatus
  createdAt: number
  reviewedAt?: number
  reviewNote?: string
  inventory: InventoryStack[]
  equipped: Equipped
}

export const STAT_LABELS: Record<keyof Stats, string> = {
  strength: 'Сила',
  agility: 'Спритність',
  endurance: 'Витривалість',
  perception: 'Сприйняття',
  intellect: 'Інтелект',
  charisma: 'Харизма',
}

export const STAT_POINTS_TOTAL = 18
