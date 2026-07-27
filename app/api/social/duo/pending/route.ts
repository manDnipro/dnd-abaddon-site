import { NextResponse } from 'next/server'
import { loadOwnCharacter } from '@/lib/loadCharacter'
import { getPendingDuoFor } from '@/lib/socialStore'

export async function GET() {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId } = result

  const invite = await getPendingDuoFor(charId)
  return NextResponse.json({ invite })
}
