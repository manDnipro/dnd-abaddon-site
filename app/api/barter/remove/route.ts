import { NextRequest, NextResponse } from 'next/server'
import { loadOwnCharacter, blockIfOnExpedition } from '@/lib/loadCharacter'
import { getActiveBarterFor, saveBarterSession } from '@/lib/barterStore'

export async function POST(req: NextRequest) {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId, character } = result
  const guard = blockIfOnExpedition(character)
  if (guard) return guard

  const session = await getActiveBarterFor(charId)
  if (!session) return NextResponse.json({ error: 'У тебе немає активного обміну' }, { status: 400 })

  const { itemId } = await req.json() as { itemId: string }
  const side = session.charAId === charId ? 'a' : 'b'
  if (side === 'a') session.itemsA = session.itemsA.filter(s => s.itemId !== itemId)
  else session.itemsB = session.itemsB.filter(s => s.itemId !== itemId)
  session.confirmedA = false
  session.confirmedB = false
  await saveBarterSession(session)

  return NextResponse.json(session)
}
