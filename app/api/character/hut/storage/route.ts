import { NextRequest, NextResponse } from 'next/server'
import { loadOwnCharacter, saveCharacter, blockIfOnExpedition } from '@/lib/loadCharacter'
import { addStack, countOf, removeStack } from '@/lib/stacks'
import { getItem } from '@/lib/items'
import { HUT_STORAGE_CAPACITY, hutStorageCount } from '@/lib/hut'

// POST { action: 'store' | 'take', itemId, qty }
export async function POST(req: NextRequest) {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId, character } = result
  const guard = blockIfOnExpedition(character)
  if (guard) return guard

  if (character.hutProgress < 100) return NextResponse.json({ error: 'Хібару ще не добудовано.' }, { status: 400 })

  const { action, itemId, qty } = await req.json() as { action: 'store' | 'take'; itemId: string; qty: number }
  const amount = Math.max(1, Math.floor(qty || 1))
  const itemName = getItem(itemId)?.name ?? itemId

  if (action === 'store') {
    const have = countOf(character.inventory, itemId)
    if (have < amount) return NextResponse.json({ error: 'Недостатньо предметів в інвентарі' }, { status: 400 })
    if (hutStorageCount(character.hutStorage) + amount > HUT_STORAGE_CAPACITY) {
      return NextResponse.json({ error: `Сховище хібари заповнене (макс. ${HUT_STORAGE_CAPACITY})` }, { status: 400 })
    }
    character.inventory = removeStack(character.inventory, itemId, amount)
    addStack(character.hutStorage, itemId, amount)
  } else if (action === 'take') {
    const have = countOf(character.hutStorage, itemId)
    if (have < amount) return NextResponse.json({ error: 'Недостатньо предметів у сховищі' }, { status: 400 })
    character.hutStorage = removeStack(character.hutStorage, itemId, amount)
    addStack(character.inventory, itemId, amount)
  } else {
    return NextResponse.json({ error: 'Невідома дія' }, { status: 400 })
  }

  await saveCharacter(charId, character)
  const log = [action === 'store'
    ? `🏠 ${itemName} ×${amount} відправлено у сховище хібари.`
    : `🏠 ${itemName} ×${amount} забрано зі сховища хібари.`]
  return NextResponse.json({ character, log })
}
