import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { isGM } from '@/lib/auth'
import { Character } from '@/lib/types'

export async function POST(req: NextRequest) {
  if (!await isGM()) return NextResponse.json({ error: 'Немає доступу' }, { status: 403 })

  const { charId, hp } = await req.json() as { charId: string; hp: number }
  const raw = await redis.get<string>(`char:${charId}`)
  if (!raw) return NextResponse.json({ error: 'Персонажа не знайдено' }, { status: 404 })
  const character: Character = typeof raw === 'string' ? JSON.parse(raw) : raw

  character.hp = Math.max(0, Math.min(character.maxHp, Math.round(hp)))
  character.dead = character.hp <= 0

  await redis.set(`char:${charId}`, JSON.stringify(character))
  return NextResponse.json(character)
}
