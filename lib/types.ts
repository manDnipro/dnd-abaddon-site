export type StatKey = 'str' | 'agi' | 'end' | 'per' | 'int' | 'cha'

export type Stats = Record<StatKey, number>

export const STAT_LABELS: Record<StatKey, string> = {
  str: 'Сила',
  agi: 'Спритність',
  end: 'Витривалість',
  per: 'Сприйняття',
  int: 'Інтелект',
  cha: 'Харизма',
}

export const STAT_BUDGET = 18
export const STAT_MIN = 1
export const STAT_MAX = 5

export function statModifier(stat: number): number {
  return stat - 3
}

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`
}

export function maxHpForEndurance(end: number): number {
  return 10 + end * 2
}

export function validateStatSpread(stats: Stats): string | null {
  const values = Object.values(stats)
  if (values.length !== 6) return 'Потрібно вказати всі 6 характеристик.'
  for (const v of values) {
    if (!Number.isInteger(v) || v < STAT_MIN || v > STAT_MAX) {
      return `Кожна характеристика має бути цілим числом від ${STAT_MIN} до ${STAT_MAX}.`
    }
  }
  const sum = values.reduce((a, b) => a + b, 0)
  if (sum !== STAT_BUDGET) return `Сума характеристик має дорівнювати ${STAT_BUDGET} (зараз ${sum}).`
  return null
}

export function clampHungerThirst(v: number) { return Math.max(0, Math.min(100, v)) }
export function clampInfection(v: number) { return Math.max(0, Math.min(100, v)) }
export function clampMorale(v: number) { return Math.max(0, Math.min(100, v)) }
export function clampReputation(v: number) { return Math.max(0, Math.min(100, v)) }

export type ClothingSlot = 'head' | 'torso' | 'legs' | 'feet' | 'accessory' | 'backpack'
export type Equipped = Record<ClothingSlot, string | null>
export const EMPTY_EQUIPPED: Equipped = {
  head: null, torso: null, legs: null, feet: null, accessory: null, backpack: null,
}

export type InventoryStack = { itemId: string; qty: number }
export type CharacterStatus = 'pending' | 'approved' | 'rejected'

export type ExpeditionState = {
  levelKey: string
  phase: 'traveling_out' | 'on_site' | 'traveling_back'
  arrivesAt: number // timestamp — when the current travel phase completes
} | null

// A pending, interactive fight — set when a zombie encounter fires during a search instead of
// auto-resolving. The player picks attack / stealth / flee via /api/expedition/combat/* each round.
export interface CombatState {
  enemyKey: string
  enemyLabel: string
  enemyEmoji: string
  image: string | null
  hp: number
  maxHp: number
  defense: number
  attackBonus: number
  damageDice: string
  infectionChance: number
  levelIndex: number
  special?: 'call_horde'
  hordeCalled: boolean
}

export type Character = {
  id: string
  owner: string
  name: string
  stats: Stats
  status: CharacterStatus
  createdAt: number
  reviewedAt?: number
  reviewNote?: string

  hp: number
  maxHp: number
  hunger: number
  thirst: number
  morale: number
  infection: number
  reputation: number
  dead: boolean

  inventory: InventoryStack[]
  equipped: Equipped
  storageBox: InventoryStack[]

  expedition: ExpeditionState
  combat: CombatState | null
  currentExpeditionLog: string[]
  lastExpeditionLog: string[]

  recentExpeditionTimestamps: number[]
  huntingProf: number
  huntsSinceLevel: number
  avatar: string | null
  canteenUses: number[]

  xp: number
  meleeProf: number
  firearmProf: number
  lastDailyTickAt: number
  durability: Record<string, number>
  bio: string
}
