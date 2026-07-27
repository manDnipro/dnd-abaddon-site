import { NextResponse } from 'next/server'
import { loadOwnCharacter } from '@/lib/loadCharacter'
import { getPendingMeetFor } from '@/lib/socialStore'

export async function GET() {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId } = result

  const meet = await getPendingMeetFor(charId)
  return NextResponse.json({ meet })
}
