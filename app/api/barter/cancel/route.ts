import { NextResponse } from 'next/server'
import { loadOwnCharacter } from '@/lib/loadCharacter'
import { getActiveBarterFor, saveBarterSession, clearActiveFor } from '@/lib/barterStore'

export async function POST() {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId } = result

  const session = await getActiveBarterFor(charId)
  if (!session) return NextResponse.json({ error: 'У тебе немає активного обміну' }, { status: 400 })

  session.status = 'cancelled'
  await saveBarterSession(session)
  await clearActiveFor(session.charAId)
  await clearActiveFor(session.charBId)

  return NextResponse.json(session)
}
