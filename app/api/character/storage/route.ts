import { NextRequest, NextResponse } from 'next/server'
import { loadOwnCharacter, saveCharacter, blockIfOnExpedition } from '@/lib/loadCharacter'
import { addStack, countOf, removeStack } from '@/lib/stacks'
import { inventoryCapacity, distinctSlotsUsed } from '@/lib/inventory'
import { getItem } from '@/lib/items'

// POST { action: 'store' | 'take', itemId, qty }
export async function POST(req: NextRequest) {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId, character } = result
  const guard = blockIfOnExpedition(character)
  if (guard) return guard

  const { action, itemId, qty } = await req.json() as { action: 'store' | 'take'; itemId: string; qty: number }
  const amount = Math.max(1, Math.floor(qty || 1))
  const itemName = getItem(itemId)?.name ?? itemId

  if (action === 'store') {
    const have = countOf(character.inventory, itemId)
    if (have < amount) return NextResponse.json({ error: 'Недостатньо предметів в інвентарі' }, { status: 400 })
    character.inventory = removeStack(character.inventory, itemId, amount)
    addStack(character.storageBox, itemId, amount)
  } else if (action === 'take') {
    const have = countOf(character.storageBox, itemId)
    if (have < amount) return NextResponse.json({ error: 'Недостатньо предметів у ящику' }, { status: 400 })
    const alreadyInInv = character.inventory.some(s => s.itemId === itemId)
    if (!alreadyInInv && distinctSlotsUsed(character) >= inventoryCapacity(character)) {
      return NextResponse.json({ error: 'Інвентар повний' }, { status: 400 })
    }
    character.storageBox = removeStack(character.storageBox, itemId, amount)
    addStack(character.inventory, itemId, amount)
  } else {
    return NextResponse.json({ error: 'Невідома дія' }, { status: 400 })
  }

  await saveCharacter(charId, character)
  const log = [action === 'store'
    ? `📦 ${itemName} ×${amount} відправлено в ящик.`
    : `📦 ${itemName} ×${amount} забрано з ящика.`]
  return NextResponse.json({ character, log })
}
