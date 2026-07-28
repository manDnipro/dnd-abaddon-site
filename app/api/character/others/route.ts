import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { loadOwnCharacter } from '@/lib/loadCharacter'
import { Character } from '@/lib/types'
import { getApprovedCharacterIds } from '@/lib/approvedCharacters'

export async function GET() {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId, character: myCharacter } = result

  const ids = await getApprovedCharacterIds()
  const others: { id: string; name: string }[] = []
  for (const id of ids) {
    if (id === charId) continue
    const raw = await redis.get<string>(`char:${id}`)
    if (!raw) continue
    const c: Character = typeof raw === 'string' ? JSON.parse(raw) : raw
    // Belt-and-suspenders: also exclude by owner, in case a stale duplicate record from an old
    // schema migration shares the same account but got a different char id.
    if (c.owner === myCharacter.owner) continue
    if (c.status === 'approved' && !c.dead && !c.expedition) others.push({ id: c.id, name: c.name })
  }
  return NextResponse.json(others)
}
