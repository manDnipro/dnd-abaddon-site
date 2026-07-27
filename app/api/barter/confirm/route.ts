import { NextResponse } from 'next/server'
import { loadOwnCharacter } from '@/lib/loadCharacter'
import { getActiveBarterFor, saveBarterSession, clearActiveFor } from '@/lib/barterStore'
import { InventoryStack } from '@/lib/types'
import { redis } from '@/lib/redis'
import { Character } from '@/lib/types'
import { getItem } from '@/lib/items'
import { countOf, removeStack } from '@/lib/stacks'
import { inventoryCapacity } from '@/lib/inventory'

export async function POST() {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId } = result

  const session = await getActiveBarterFor(charId)
  if (!session) return NextResponse.json({ error: 'У тебе немає активного обміну' }, { status: 400 })

  const side = session.charAId === charId ? 'a' : 'b'
  if (side === 'a') session.confirmedA = true
  else session.confirmedB = true

  if (!session.confirmedA || !session.confirmedB) {
    await saveBarterSession(session)
    return NextResponse.json(session)
  }

  // Both confirmed — re-validate everything at execution time, exactly like the bot.
  const rawA = await redis.get<string>(`char:${session.charAId}`)
  const rawB = await redis.get<string>(`char:${session.charBId}`)
  if (!rawA || !rawB) {
    session.status = 'cancelled'
    await saveBarterSession(session)
    await clearActiveFor(session.charAId)
    await clearActiveFor(session.charBId)
    return NextResponse.json({ error: 'Один з гравців недоступний — обмін скасовано' }, { status: 400 })
  }
  const charA: Character = typeof rawA === 'string' ? JSON.parse(rawA) : rawA
  const charB: Character = typeof rawB === 'string' ? JSON.parse(rawB) : rawB

  for (const row of session.itemsA) {
    if (countOf(charA.inventory, row.itemId) < row.qty) {
      session.status = 'cancelled'
      await saveBarterSession(session)
      await clearActiveFor(session.charAId)
      await clearActiveFor(session.charBId)
      return NextResponse.json({ error: `У ${charA.name} вже не вистачає запропонованого — обмін скасовано` }, { status: 400 })
    }
  }
  for (const row of session.itemsB) {
    if (countOf(charB.inventory, row.itemId) < row.qty) {
      session.status = 'cancelled'
      await saveBarterSession(session)
      await clearActiveFor(session.charAId)
      await clearActiveFor(session.charBId)
      return NextResponse.json({ error: `У ${charB.name} вже не вистачає запропонованого — обмін скасовано` }, { status: 400 })
    }
  }

  function give(from: Character, to: Character, rows: InventoryStack[]) {
    for (const row of rows) {
      from.inventory = removeStack(from.inventory, row.itemId, row.qty)
      const alreadyHas = to.inventory.some(s => s.itemId === row.itemId)
      if (alreadyHas || to.inventory.length < inventoryCapacity(to)) {
        const stack = to.inventory.find(s => s.itemId === row.itemId)
        if (stack) stack.qty += row.qty
        else to.inventory.push({ itemId: row.itemId, qty: row.qty })
      } else {
        const boxStack = to.storageBox.find(s => s.itemId === row.itemId)
        if (boxStack) boxStack.qty += row.qty
        else to.storageBox.push({ itemId: row.itemId, qty: row.qty })
      }
    }
  }

  give(charA, charB, session.itemsA)
  give(charB, charA, session.itemsB)

  await redis.set(`char:${session.charAId}`, JSON.stringify(charA))
  await redis.set(`char:${session.charBId}`, JSON.stringify(charB))

  session.status = 'completed'
  await saveBarterSession(session)
  await clearActiveFor(session.charAId)
  await clearActiveFor(session.charBId)

  const summaryA = session.itemsA.map(r => `${getItem(r.itemId)?.name ?? r.itemId} ×${r.qty}`).join(', ') || '—'
  const summaryB = session.itemsB.map(r => `${getItem(r.itemId)?.name ?? r.itemId} ×${r.qty}`).join(', ') || '—'

  return NextResponse.json({ ...session, log: [`✅ Обмін завершено! ${charA.name} віддав: ${summaryA}. ${charB.name} віддав: ${summaryB}.`] })
}
