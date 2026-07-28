import { NextResponse } from 'next/server'
import { loadOwnCharacter } from '@/lib/loadCharacter'
import { markAllRead } from '@/lib/playerInbox'

export async function POST() {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  await markAllRead(result.charId)
  return NextResponse.json({ ok: true })
}
