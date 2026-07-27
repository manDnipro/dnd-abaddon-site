import { Character } from './types'
import { getItem } from './items'

const BASE_CAPACITY = 6

export function inventoryCapacity(character: Character): number {
  const backpackId = character.equipped.backpack
  if (!backpackId) return BASE_CAPACITY
  const item = getItem(backpackId)
  if (!item) return BASE_CAPACITY
  // capacity bonus scales with backpack armor+warmth value tier
  const value = (item.armor ?? 0) + (item.warmth ?? 0)
  if (value >= 6) return 15
  if (value >= 3) return 12
  if (value >= 1) return 8
  return BASE_CAPACITY
}

export function distinctSlotsUsed(character: Character): number {
  return character.inventory.length
}

export function hasCapacityFor(character: Character, itemId: string): boolean {
  const alreadyHave = character.inventory.some(s => s.itemId === itemId)
  if (alreadyHave) return true
  return distinctSlotsUsed(character) < inventoryCapacity(character)
}
