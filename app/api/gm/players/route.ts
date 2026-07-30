import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { isGM } from '@/lib/auth'
import { Character } from '@/lib/types'
import { getApprovedCharacterIds } from '@/lib/approvedCharacters'
import { getOwnerCharId } from '@/lib/ownerChar'

export async function GET() {
  if (!await isGM()) return NextResponse.json({ error: 'Немає доступу' }, { status: 403 })

  const ids = await getApprovedCharacterIds()
  const byOwner = new Map<string, Character[]>()
  for (const id of ids) {
    const raw = await redis.get<string>(`char:${id}`)
    if (!raw) continue
    const c: Character = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (c.status !== 'approved') continue
    const list = byOwner.get(c.owner) ?? []
    list.push(c)
    byOwner.set(c.owner, list)
  }

  const players: Character[] = []
  for (const [owner, list] of byOwner) {
    if (list.length === 1) {
      players.push(list[0])
      continue
    }
    // Old schema migrations / a GM re-creating a card can leave stale duplicate records under the
    // same owner name. Picking "highest id" here was wrong — it could point at an orphaned
    // duplicate instead of the character the account's char:owner mapping (and therefore the
    // player themselves) actually resolves to, which broke anything targeted by charId (e.g.
    // RP missions never showing up for the player they were created for). Prefer whichever record
    // that mapping actually points at; only fall back to highest-id for unlinked owner names
    // (GM-only NPC-style entries with no real registered account).
    const linkedId = await getOwnerCharId(owner)
    const linked = list.find(c => c.id === linkedId)
    players.push(linked ?? list.reduce((a, b) => (Number(b.id) > Number(a.id) ? b : a)))
  }
  players.sort((a, b) => a.name.localeCompare(b.name))
  return NextResponse.json(players)
}
