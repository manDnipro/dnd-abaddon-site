import { NextRequest, NextResponse } from 'next/server'
import { loadOwnCharacter, blockIfOnExpedition } from '@/lib/loadCharacter'
import { redis } from '@/lib/redis'
import { Character } from '@/lib/types'
import { createDuoInvite } from '@/lib/socialStore'
import { getExpeditionLevel } from '@/lib/expedition'

export async function POST(req: NextRequest) {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId, character } = result
  const guard = blockIfOnExpedition(character)
  if (guard) return guard

  if (character.dead) return NextResponse.json({ error: 'Твій персонаж мертвий' }, { status: 403 })
  if (character.expedition) return NextResponse.json({ error: 'Запрошувати можна лише з табору' }, { status: 400 })

  const { targetCharId, levelKey } = await req.json() as { targetCharId: string; levelKey: string }
  const level = getExpeditionLevel(levelKey)
  if (!level) return NextResponse.json({ error: 'Невідомий рівень складності' }, { status: 400 })

  const raw = await redis.get<string>(`char:${targetCharId}`)
  if (!raw) return NextResponse.json({ error: 'Персонажа не знайдено' }, { status: 404 })
  const target: Character = typeof raw === 'string' ? JSON.parse(raw) : raw
  if (target.status !== 'approved' || target.dead) return NextResponse.json({ error: 'Цей гравець недоступний' }, { status: 400 })
  if (target.expedition) return NextResponse.json({ error: 'Цей гравець зараз не в таборі' }, { status: 400 })

  const invite = await createDuoInvite({
    fromCharId: charId, fromName: character.name, toCharId: targetCharId, toName: target.name, levelKey,
  })
  return NextResponse.json(invite)
}
