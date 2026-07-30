import { NextRequest, NextResponse } from 'next/server'
import { isGM } from '@/lib/auth'
import { redis } from '@/lib/redis'
import { listAllMissions } from '@/lib/rpMissions'

// TEMPORARY — remove after diagnosing why a targeted mission wasn't showing up for a player.
export async function GET(req: NextRequest) {
  if (!await isGM()) return NextResponse.json({ error: 'Немає доступу' }, { status: 403 })

  const charId = req.nextUrl.searchParams.get('charId')
  if (!charId) return NextResponse.json({ error: 'charId query param required' }, { status: 400 })

  const raw = await redis.get<string>(`char:${charId}`)
  const character = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null
  const ownerMappedId = character ? await redis.get<string>(`char:owner:${character.owner}`) : null

  const missions = await listAllMissions()
  const relevant = missions.filter(m => m.targetCharId === null || m.targetCharId === charId)

  return NextResponse.json({
    requestedCharId: charId,
    character: character ? { id: character.id, name: character.name, owner: character.owner, status: character.status, dead: character.dead } : null,
    ownerMappedId,
    idMatchesOwnerMapping: ownerMappedId === charId,
    relevantMissions: relevant.map(m => ({ id: m.id, title: m.title, targetCharId: m.targetCharId, completions: m.completions })),
  })
}
