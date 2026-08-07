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

export interface ExpeditionLogEntry { text: string; at: number }

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
  currentExpeditionLog: ExpeditionLogEntry[]
  lastExpeditionLog: ExpeditionLogEntry[]

  recentExpeditionTimestamps: number[]
  huntingProf: number
  huntsSinceLevel: number
  avatar: string | null
  canteenUses: number[]
  // Per-camp-location-key timestamp of last use, for locations with a CampLocation.cooldownMinutes
  // set (e.g. watchtower) — a generic map instead of one-off fields so any future location can opt
  // into a cooldown without another character-schema change.
  locationCooldowns: Record<string, number>
  // Per-camp-location-key rolling-window use timestamps, for lib/locationYield.ts's diminishing-
  // returns mechanic — separate from locationCooldowns (a hard lock) since this location stays
  // usable, it just pays out less the more it's farmed inside the window.
  locationYieldUses: Record<string, number[]>

  // Personal hut, unlocked at HUT_UNLOCK_REPUTATION (lib/hut.ts). hutUnlocked latches true the
  // first time reputation hits the threshold so a later reputation dip can't strand an in-progress
  // build. hutContributions is keyed "stageKey:itemKey" -> qty contributed so far toward that
  // stage's requirement; hutProgress is the derived 0-100 cumulative % once a stage is fully paid.
  hutUnlocked: boolean
  hutProgress: number
  hutContributions: Record<string, number>
  inHut: boolean
  lastHutTickAt: number
  hutStorage: InventoryStack[]

  // Set on both characters when a duo expedition invite is accepted (app/api/social/duo/accept),
  // cleared for whichever one finishes their trip first (lib/expeditionLog.ts's
  // finalizeExpeditionLog) — lets the expedition page show a partner's live status/log even though
  // each character's own search rolls stay fully independent (see app/api/social/duo/accept's own
  // log line: "прогрес не спільний, лише час виходу співпав").
  duoPartnerId: string | null

  // Decremented by one on every expedition search while > 0 — each of those searches skips the
  // level's hungerCost/thirstCost entirely instead of restoring hunger/thirst (see energy_drink_*
  // items in lib/items.ts and lib/expeditionEngine.ts's performSearch).
  energyChargesLeft: number

  xp: number
  meleeProf: number
  firearmProf: number
  lastDailyTickAt: number
  durability: Record<string, number>
  bio: string

  // Lifetime counters for the character sheet's summary boxes (🎯 / 💀 / 🩹) — expeditionsCompleted
  // and zombiesKilled increment automatically from game logic; playersSaved has no mechanic yet and
  // is GM-adjustable only, same as HP/stats.
  expeditionsCompleted: number
  zombiesKilled: number
  playersSaved: number

  // "Удача" — a resource separate from HP, spent to reroll a single failed search roll on an
  // expedition instead of just eating the bad result. Refills to LUCK_MAX on the character's first
  // daily tick of a new day (see lib/dailyTick.ts), not per-expedition, so it's a scarce daily
  // resource rather than something to spend on every attempt.
  luck: number
  maxLuck: number
}

export const LUCK_MAX = 3
