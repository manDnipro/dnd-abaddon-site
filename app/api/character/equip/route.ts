import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { getSession } from '@/lib/auth'
import { Character, Equipped, ClothingSlot } from '@/lib/types'
import { getItem } from '@/lib/items'
import { inventoryCapacity } from '@/lib/inventory'
import { blockIfInCombat } from '@/lib/loadCharacter'
import { getOwnerCharId } from '@/lib/ownerChar'

export async function POST(req: NextRequest) {
  const owner = await getSession()
  if (!owner) return NextResponse.json({ error: 'Потрібно увійти' }, { status: 401 })

  const charId = await getOwnerCharId(owner)
  if (!charId) return NextResponse.json({ error: 'Персонажа не знайдено' }, { status: 404 })

  const raw = await redis.get<string>(`char:${charId}`)
  if (!raw) return NextResponse.json({ error: 'Персонажа не знайдено' }, { status: 404 })
  const character: Character = typeof raw === 'string' ? JSON.parse(raw) : raw

  if (character.status !== 'approved') {
    return NextResponse.json({ error: 'Персонаж ще не затверджений ГМ' }, { status: 403 })
  }
  // Swapping gear mid-fight (e.g. broken armor for fresh armor between rounds) is a bigger exploit
  // than the "can't eat mid-combat" rule this guard exists for elsewhere — same restriction applies.
  const guard = blockIfInCombat(character)
  if (guard) return guard

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

// Matches the overflow behavior every other item-acquisition path in the game uses
// (expeditionEngine.ts, barter/confirm) — loot never vanishes, a full inventory spills into the
// personal storage box instead. Un-equipping something used to just push it onto inventory
// unconditionally, letting a player carry unlimited distinct stacks by cycling equip/unequip.
function addToInventory(character: Character, itemId: string, qty: number) {
  const alreadyCarried = character.inventory.some(s => s.itemId === itemId)
  if (alreadyCarried || character.inventory.length < inventoryCapacity(character)) {
    const stack = character.inventory.find(s => s.itemId === itemId)
    if (stack) stack.qty += qty
    else character.inventory.push({ itemId, qty })
  } else {
    const boxStack = character.storageBox.find(s => s.itemId === itemId)
    if (boxStack) boxStack.qty += qty
    else character.storageBox.push({ itemId, qty })
  }
}

function removeFromInventory(character: Character, itemId: string, qty: number) {
  const stack = character.inventory.find(s => s.itemId === itemId)
  if (!stack) return
  stack.qty -= qty
  if (stack.qty <= 0) character.inventory = character.inventory.filter(s => s.itemId !== itemId)
}
