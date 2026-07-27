import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { getSession } from '@/lib/auth'
import { Character, Equipped, ClothingSlot } from '@/lib/types'
import { getItem } from '@/lib/items'

export async function POST(req: NextRequest) {
  const owner = await getSession()
  if (!owner) return NextResponse.json({ error: 'Потрібно увійти' }, { status: 401 })

  const charId = await redis.get<string>(`char:owner:${owner}`)
  if (!charId) return NextResponse.json({ error: 'Персонажа не знайдено' }, { status: 404 })

  const raw = await redis.get<string>(`char:${charId}`)
  if (!raw) return NextResponse.json({ error: 'Персонажа не знайдено' }, { status: 404 })
  const character: Character = typeof raw === 'string' ? JSON.parse(raw) : raw

  if (character.status !== 'approved') {
    return NextResponse.json({ error: 'Персонаж ще не затверджений ГМ' }, { status: 403 })
  }

  const body = await req.json() as { action: 'equip' | 'unequip'; itemId?: string; slot?: ClothingSlot }

  if (body.action === 'equip') {
    const item = body.itemId ? getItem(body.itemId) : undefined
    if (!item || item.type !== 'clothing' || !item.slot) {
      return NextResponse.json({ error: 'Цей предмет не можна вдягнути' }, { status: 400 })
    }
    const stack = character.inventory.find(s => s.itemId === item.key)
    if (!stack || stack.qty < 1) {
      return NextResponse.json({ error: 'Предмета немає в інвентарі' }, { status: 400 })
    }

    const slot = item.slot
    const currentlyEquipped = character.equipped[slot]
    if (currentlyEquipped) addToInventory(character, currentlyEquipped, 1)
    removeFromInventory(character, item.key, 1)
    character.equipped = { ...character.equipped, [slot]: item.key } as Equipped
  } else if (body.action === 'unequip') {
    const slot = body.slot
    if (!slot) return NextResponse.json({ error: 'Не вказано слот' }, { status: 400 })
    const equippedId = character.equipped[slot]
    if (!equippedId) return NextResponse.json({ error: 'Слот вже порожній' }, { status: 400 })
    addToInventory(character, equippedId, 1)
    character.equipped = { ...character.equipped, [slot]: null } as Equipped
  } else {
    return NextResponse.json({ error: 'Невідома дія' }, { status: 400 })
  }

  await redis.set(`char:${charId}`, JSON.stringify(character))
  return NextResponse.json(character)
}

function addToInventory(character: Character, itemId: string, qty: number) {
  const stack = character.inventory.find(s => s.itemId === itemId)
  if (stack) stack.qty += qty
  else character.inventory.push({ itemId, qty })
}

function removeFromInventory(character: Character, itemId: string, qty: number) {
  const stack = character.inventory.find(s => s.itemId === itemId)
  if (!stack) return
  stack.qty -= qty
  if (stack.qty <= 0) character.inventory = character.inventory.filter(s => s.itemId !== itemId)
}
