import { Character } from './types'
import { getItem } from './items'

// Distinct item slots used (not counting quantity in a stack); backpack raises the limit.
export function inventoryCapacity(character: Character): number {
  const backpack = character.equipped.backpack ? getItem(character.equipped.backpack) : null
  return backpack?.backpackSlots ?? 6
}

export function distinctSlotsUsed(character: Character): number {
  return character.inventory.length
}

export function hasCapacityFor(character: Character, itemId: string): boolean {
  const alreadyHave = character.inventory.some(s => s.itemId === itemId)
  if (alreadyHave) return true
  return distinctSlotsUsed(character) < inventoryCapacity(character)
}
