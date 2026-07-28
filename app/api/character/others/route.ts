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
  const byOwner = new Map<string, Character[]>()
  for (const id of ids) {
    if (id === charId) continue
    const raw = await redis.get<string>(`char:${id}`)
    if (!raw) continue
    const c: Character = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (c.owner === myCharacter.owner) continue // never list yourself, even under a stale duplicate id
    if (c.status !== 'approved' || c.dead || c.expedition) continue
    const list = byOwner.get(c.owner) ?? []
    list.push(c)
    byOwner.set(c.owner, list)
  }

  const others: { id: string; name: string }[] = []
  for (const [owner, list] of byOwner) {
    if (list.length === 1) {
      others.push({ id: list[0].id, name: list[0].name })
      continue
    }
    // Same stale-duplicate issue as the GM roster — pick whichever record the account's char:owner
    // mapping actually resolves to, so barter/social target the character that owner can actually use.
    const linkedId = await redis.get<string>(`char:owner:${owner}`)
    const linked = list.find(c => c.id === linkedId) ?? list.reduce((a, b) => (Number(b.id) > Number(a.id) ? b : a))
    others.push({ id: linked.id, name: linked.name })
  }
  return NextResponse.json(others)
}
