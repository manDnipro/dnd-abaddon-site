import { InventoryStack } from './types'

export function addStack(stacks: InventoryStack[], itemId: string, qty: number) {
  const stack = stacks.find(s => s.itemId === itemId)
  if (stack) stack.qty += qty
  else stacks.push({ itemId, qty })
}

export function removeStack(stacks: InventoryStack[], itemId: string, qty: number): InventoryStack[] {
  const stack = stacks.find(s => s.itemId === itemId)
  if (!stack) return stacks
  stack.qty -= qty
  return stack.qty <= 0 ? stacks.filter(s => s.itemId !== itemId) : stacks
}

export function countOf(stacks: InventoryStack[], itemId: string): number {
  return stacks.find(s => s.itemId === itemId)?.qty ?? 0
}
