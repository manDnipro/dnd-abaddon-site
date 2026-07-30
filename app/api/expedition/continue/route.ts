import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { getSession } from '@/lib/auth'
import { Character } from '@/lib/types'
import { getExpeditionLevel } from '@/lib/expedition'
import { performSearch } from '@/lib/expeditionEngine'
import { appendCharacterLog } from '@/lib/characterLog'
import { pushExpeditionLog, finalizeExpeditionLog } from '@/lib/expeditionLog'
import { getOwnerCharId } from '@/lib/ownerChar'

export async function POST() {
  const owner = await getSession()
  if (!owner) return NextResponse.json({ error: 'Потрібно увійти' }, { status: 401 })

  const charId = await getOwnerCharId(owner)
  if (!charId) return NextResponse.json({ error: 'Персонажа не знайдено' }, { status: 404 })
  const raw = await redis.get<string>(`char:${charId}`)
  if (!raw) return NextResponse.json({ error: 'Персонажа не знайдено' }, { status: 404 })
  const character: Character = typeof raw === 'string' ? JSON.parse(raw) : raw

  if (!character.expedition || character.expedition.phase !== 'on_site') {
    return NextResponse.json({ error: 'Ви не на місці вилазки' }, { status: 400 })
  }
  if (character.combat) return NextResponse.json({ error: 'Спершу розберись з ворогом' }, { status: 409 })

  const level = getExpeditionLevel(character.expedition.levelKey)!
  const result = performSearch(character, level)
  pushExpeditionLog(character, result.log)
  if (result.died) {
    character.expedition = null
    finalizeExpeditionLog(character)
  }

  await redis.set(`char:${charId}`, JSON.stringify(character))
  await appendCharacterLog(charId, result.log)
  return NextResponse.json({ character, log: result.log, images: result.images })
}
