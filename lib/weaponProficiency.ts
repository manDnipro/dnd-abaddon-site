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

// Bot ties growth to persisted practice/win-streak counters (practice_count>=5 OR a 3-win streak).
// No such per-attempt DB table here, so this approximates it with a flat per-attack roll — but the
// roll's odds must still track whether THIS attack actually hit, or the dice stop mattering at all.
const PROFICIENCY_GROWTH_CHANCE_ON_HIT = 0.3
const PROFICIENCY_GROWTH_CHANCE_ON_MISS = 0.08

/** Every genuine attack nudges the matching proficiency up, but landing the hit matters — success
 *  trains the skill roughly 4x faster than whiffing, same spirit as the bot's win-streak bonus. */
export function trainWeaponProficiency(character: Character, item: ItemDefinition | undefined, hit: boolean): string | null {
  const key = item ? weaponProficiencyKey(item) : null
  if (!key || character[key] >= MAX_WEAPON_PROFICIENCY) return null
  if (Math.random() > (hit ? PROFICIENCY_GROWTH_CHANCE_ON_HIT : PROFICIENCY_GROWTH_CHANCE_ON_MISS)) return null
  character[key] += 1
  const label = key === 'meleeProf' ? '🗡️ Володіння холодною зброєю' : '🔫 Володіння вогнепальною зброєю'
  return `${label} зростає до ${character[key]}!`
}
