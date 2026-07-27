import { Character } from './types'
import { ItemDefinition, ItemRarity, getItemRarity } from './items'

export const PROFICIENCY_REQUIREMENT_BY_RARITY: Record<ItemRarity, number> = {
  common: 1, uncommon: 2, rare: 3, epic: 5, legendary: 7,
}

export const MAX_WEAPON_PROFICIENCY = 10
const PENALTY_PER_LEVEL = 2

export type ProfKey = 'meleeProf' | 'firearmProf'

export function weaponProficiencyKey(item: ItemDefinition): ProfKey | null {
  if (item.type === 'weapon_melee') return 'meleeProf'
  if (item.type === 'weapon_ranged') return 'firearmProf'
  return null
}

export function requiredProficiency(item: ItemDefinition): number {
  return PROFICIENCY_REQUIREMENT_BY_RARITY[getItemRarity(item)]
}

/** Under-qualified for this weapon's rarity? Returns a negative accuracy penalty (never a hard block). */
export function weaponProficiencyPenalty(character: Character, item: ItemDefinition | undefined): number {
  if (!item) return 0
  const key = weaponProficiencyKey(item)
  if (!key) return 0
  const shortfall = requiredProficiency(item) - character[key]
  return shortfall > 0 ? -shortfall * PENALTY_PER_LEVEL : 0
}

/** Every genuine attack (win or lose) nudges the matching proficiency up — grows by 1 every 5 uses, capped at 10. */
export function trainWeaponProficiency(character: Character, item: ItemDefinition | undefined): string | null {
  const key = item ? weaponProficiencyKey(item) : null
  if (!key || character[key] >= MAX_WEAPON_PROFICIENCY) return null
  // Simple deterministic growth (bot uses a practice/streak counter in a DB table we don't have here):
  // 1-in-5 chance per attack keeps the average growth rate comparable without extra persisted counters.
  if (Math.random() > 0.2) return null
  character[key] += 1
  const label = key === 'meleeProf' ? '🗡️ Володіння холодною зброєю' : '🔫 Володіння вогнепальною зброєю'
  return `${label} зростає до ${character[key]}!`
}
