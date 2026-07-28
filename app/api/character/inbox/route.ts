import { NextResponse } from 'next/server'
import { loadOwnCharacter } from '@/lib/loadCharacter'
import { listPlayerMessages } from '@/lib/playerInbox'

export async function GET() {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const messages = await listPlayerMessages(result.charId)
  return NextResponse.json(messages)
}
