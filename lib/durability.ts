import { Character, ClothingSlot } from './types'
import { ItemDefinition, estimateTradeValue } from './items'
import { MAX_LEVEL, levelFromXp } from './levels'

export const MAX_DURABILITY = 100
export const PROTECTIVE_SLOTS: ClothingSlot[] = ['head', 'torso', 'legs', 'feet', 'accessory']

const WEAPON_WEAR_PER_USE = 4
const ARMOR_WEAR_PER_HIT = 3
const MAX_WEAR_REDUCTION = 0.6

export function isBroken(durability: number): boolean {
  return durability <= 0
}

export function durabilityLabel(durability: number): string {
  if (durability <= 0) return '🔴 Зламано (потрібен ремонт)'
  if (durability < 30) return `🟠 Сильно зношене (${durability}%)`
  if (durability < 70) return `🟡 Зношене (${durability}%)`
  return `🟢 Справне (${durability}%)`
}

function wearRateMultiplier(playerLevel: number): number {
  const clamped = Math.max(1, Math.min(MAX_LEVEL, playerLevel))
  return 1 - ((clamped - 1) / (MAX_LEVEL - 1)) * MAX_WEAR_REDUCTION
}

function applyWear(current: number, baseAmount: number, playerLevel: number): number {
  const wear = Math.max(1, Math.round(baseAmount * wearRateMultiplier(playerLevel)))
  return Math.max(0, current - wear)
}

export function getDurability(character: Character, itemKey: string): number {
  return character.durability[itemKey] ?? MAX_DURABILITY
}

function setDurability(character: Character, itemKey: string, value: number) {
  character.durability = { ...character.durability, [itemKey]: value }
}

export function wearWeaponOnUse(character: Character, weaponKey: string): void {
  const current = getDurability(character, weaponKey)
  if (isBroken(current)) return
  const level = levelFromXp(character.xp)
  setDurability(character, weaponKey, applyWear(current, WEAPON_WEAR_PER_USE, level))
}

export function wearArmorOnHit(character: Character): void {
  const level = levelFromXp(character.xp)
  for (const slot of PROTECTIVE_SLOTS) {
    const key = character.equipped[slot]
    if (!key) continue
    const current = getDurability(character, key)
    if (isBroken(current)) continue
    setDurability(character, key, applyWear(current, ARMOR_WEAR_PER_HIT, level))
  }
}

export function repairScrapCost(item: ItemDefinition): number {
  return Math.max(1, Math.ceil(estimateTradeValue(item) / 2))
}
