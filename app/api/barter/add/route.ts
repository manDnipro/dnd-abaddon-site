import { NextRequest, NextResponse } from 'next/server'
import { loadOwnCharacter, blockIfOnExpedition } from '@/lib/loadCharacter'
import { getActiveBarterFor, saveBarterSession } from '@/lib/barterStore'
import { countOf, addStack } from '@/lib/stacks'

export async function POST(req: NextRequest) {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId, character } = result
  const guard = blockIfOnExpedition(character)
  if (guard) return guard

  const session = await getActiveBarterFor(charId)
  if (!session) return NextResponse.json({ error: 'У тебе немає активного обміну' }, { status: 400 })

  const { itemId, qty } = await req.json() as { itemId: string; qty: number }
  const amount = Math.max(1, Math.floor(qty || 1))

  const side = session.charAId === charId ? 'a' : 'b'
  const offered = side === 'a' ? session.itemsA : session.itemsB
  const alreadyOffered = offered.find(s => s.itemId === itemId)?.qty ?? 0
  const available = countOf(character.inventory, itemId) - alreadyOffered
  if (available < amount) return NextResponse.json({ error: 'Недостатньо вільної кількості цього предмета' }, { status: 400 })

  addStack(offered, itemId, amount)
  session.confirmedA = false
  session.confirmedB = false
  await saveBarterSession(session)

  return NextResponse.json(session)
}
