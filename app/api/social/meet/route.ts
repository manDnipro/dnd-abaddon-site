import { NextRequest, NextResponse } from 'next/server'
import { loadOwnCharacter, blockIfOnExpedition } from '@/lib/loadCharacter'
import { redis } from '@/lib/redis'
import { Character } from '@/lib/types'
import { createMeetRequest } from '@/lib/socialStore'

export async function POST(req: NextRequest) {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId, character } = result
  const guard = blockIfOnExpedition(character)
  if (guard) return guard

  if (character.dead) return NextResponse.json({ error: 'Твій персонаж мертвий' }, { status: 403 })
  if (character.expedition) return NextResponse.json({ error: 'Знайомитися можна лише в таборі' }, { status: 400 })

  const { targetCharId } = await req.json() as { targetCharId: string }
  const raw = await redis.get<string>(`char:${targetCharId}`)
  if (!raw) return NextResponse.json({ error: 'Персонажа не знайдено' }, { status: 404 })
  const target: Character = typeof raw === 'string' ? JSON.parse(raw) : raw
  if (target.status !== 'approved' || target.dead) return NextResponse.json({ error: 'Цей гравець недоступний' }, { status: 400 })
  if (target.expedition) return NextResponse.json({ error: 'Цей гравець зараз не в таборі' }, { status: 400 })

  const meet = await createMeetRequest({
    requesterCharId: charId, requesterName: character.name, targetCharId, targetName: target.name,
  })
  return NextResponse.json(meet)
}
