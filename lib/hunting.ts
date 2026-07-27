export const MAX_HUNTING_PROFICIENCY = 10
export const HUNTS_PER_PROFICIENCY = 4
export const HUNTING_DC = 10
export const HUNTING_HUNGER_COST = 5
export const HUNTING_THIRST_COST = 5
export const HUNTING_MISHAP_CHANCE = 0.15

interface HuntingCatchEntry { itemKey: string; weight: number }
export const HUNTING_CATCH_TABLE: HuntingCatchEntry[] = [
  { itemKey: 'rat_meat', weight: 10 },
  { itemKey: 'pigeon_meat', weight: 7 },
  { itemKey: 'crow_meat', weight: 6 },
  { itemKey: 'seagull_meat', weight: 4 },
]

export function rollHuntingCatch(): string {
  const total = HUNTING_CATCH_TABLE.reduce((s, e) => s + e.weight, 0)
  let roll = Math.random() * total
  for (const entry of HUNTING_CATCH_TABLE) {
    roll -= entry.weight
    if (roll <= 0) return entry.itemKey
  }
  return HUNTING_CATCH_TABLE[HUNTING_CATCH_TABLE.length - 1].itemKey
}
