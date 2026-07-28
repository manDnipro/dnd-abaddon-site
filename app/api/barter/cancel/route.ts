import { NextResponse } from 'next/server'
import { loadOwnCharacter, blockIfOnExpedition } from '@/lib/loadCharacter'
import { getActiveBarterFor, saveBarterSession, clearActiveFor } from '@/lib/barterStore'

export async function POST() {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId, character } = result
  const guard = blockIfOnExpedition(character)
  if (guard) return guard

  const session = await getActiveBarterFor(charId)
  if (!session) return NextResponse.json({ error: 'У тебе немає активного обміну' }, { status: 400 })

  session.status = 'cancelled'
  await saveBarterSession(session)
  await clearActiveFor(session.charAId)
  await clearActiveFor(session.charBId)

  return NextResponse.json(session)
}
