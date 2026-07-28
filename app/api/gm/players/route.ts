import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { isGM } from '@/lib/auth'
import { Character } from '@/lib/types'
import { getApprovedCharacterIds } from '@/lib/approvedCharacters'

export async function GET() {
  if (!await isGM()) return NextResponse.json({ error: 'Немає доступу' }, { status: 403 })

  const ids = await getApprovedCharacterIds()
  const byOwner = new Map<string, Character>()
  for (const id of ids) {
    const raw = await redis.get<string>(`char:${id}`)
    if (!raw) continue
    const c: Character = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (c.status !== 'approved') continue
    // Old schema migrations can leave stale duplicate records for the same account under
    // different ids — keep only the highest (most recently created) id per owner.
    const existing = byOwner.get(c.owner)
    if (!existing || Number(c.id) > Number(existing.id)) byOwner.set(c.owner, c)
  }
  const players = [...byOwner.values()].sort((a, b) => a.name.localeCompare(b.name))
  return NextResponse.json(players)
}
