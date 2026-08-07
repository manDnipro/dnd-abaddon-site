import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { loadOwnCharacter } from '@/lib/loadCharacter'
import { Character } from '@/lib/types'
import { getCharacterLog } from '@/lib/characterLog'

export async function GET() {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { character } = result

  if (!character.duoPartnerId) return NextResponse.json({ partner: null })

  const raw = await redis.get<string>(`char:${character.duoPartnerId}`)
  if (!raw) return NextResponse.json({ partner: null })
  const partner: Character = typeof raw === 'string' ? JSON.parse(raw) : raw

  const log = await getCharacterLog(character.duoPartnerId)

  return NextResponse.json({
    partner: {
      name: partner.name,
      dead: partner.dead,
      hp: partner.hp,
      maxHp: partner.maxHp,
      expedition: partner.expedition,
      inCombat: Boolean(partner.combat),
      enemyLabel: partner.combat?.enemyLabel ?? null,
      log: log.slice(0, 20),
    },
  })
}
