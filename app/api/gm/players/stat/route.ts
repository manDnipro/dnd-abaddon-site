import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { isGM } from '@/lib/auth'
import { Character, StatKey, maxHpForEndurance } from '@/lib/types'

export async function POST(req: NextRequest) {
  if (!await isGM()) return NextResponse.json({ error: 'Немає доступу' }, { status: 403 })

  const { charId, stat, value } = await req.json() as { charId: string; stat: StatKey; value: number }
  const raw = await redis.get<string>(`char:${charId}`)
  if (!raw) return NextResponse.json({ error: 'Персонажа не знайдено' }, { status: 404 })
  const character: Character = typeof raw === 'string' ? JSON.parse(raw) : raw

  character.stats = { ...character.stats, [stat]: Math.max(1, Math.round(value)) }
  if (stat === 'end') {
    const newMax = maxHpForEndurance(character.stats.end)
    character.hp = Math.min(newMax, character.hp + (newMax - character.maxHp))
    character.maxHp = newMax
  }

  await redis.set(`char:${charId}`, JSON.stringify(character))
  return NextResponse.json(character)
}
