import { NextResponse } from 'next/server'
import { loadOwnCharacter } from '@/lib/loadCharacter'
import { getActiveBarterFor } from '@/lib/barterStore'
import { redis } from '@/lib/redis'
import { Character } from '@/lib/types'

export async function GET() {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId } = result

  const session = await getActiveBarterFor(charId)
  if (!session) return NextResponse.json({ session: null })

  const otherId = session.charAId === charId ? session.charBId : session.charAId
  const raw = await redis.get<string>(`char:${otherId}`)
  const other: Character | null = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null

  return NextResponse.json({
    session,
    mySide: session.charAId === charId ? 'a' : 'b',
    otherName: other?.name ?? '???',
  })
}
