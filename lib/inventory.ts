import { Character } from './types'

const BASE_CAPACITY = 6

const BACKPACK_CAPACITY: Record<string, number> = {
  improvised_backpack: 8,
  hiking_backpack: 10,
  tactical_backpack: 12,
  military_backpack: 15,
}

export function inventoryCapacity(character: Character): number {
  const backpackId = character.equipped.backpack
  if (!backpackId) return BASE_CAPACITY
  return BACKPACK_CAPACITY[backpackId] ?? BASE_CAPACITY
}

export function distinctSlotsUsed(character: Character): number {
  return character.inventory.length
}

export function hasCapacityFor(character: Character, itemId: string): boolean {
  const alreadyHave = character.inventory.some(s => s.itemId === itemId)
  if (alreadyHave) return true
  return distinctSlotsUsed(character) < inventoryCapacity(character)
}
