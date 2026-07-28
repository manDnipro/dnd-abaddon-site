import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { isGM } from '@/lib/auth'
import { Character } from '@/lib/types'

export async function POST(req: NextRequest) {
  if (!await isGM()) return NextResponse.json({ error: 'Немає доступу' }, { status: 403 })

  const { charId } = await req.json() as { charId: string }
  const raw = await redis.get<string>(`char:${charId}`)
  if (!raw) return NextResponse.json({ error: 'Персонажа не знайдено' }, { status: 404 })
  const character: Character = typeof raw === 'string' ? JSON.parse(raw) : raw

  const wasDead = character.dead

  character.dead = false
  character.hp = character.maxHp
  character.hunger = 100
  character.thirst = 100
  character.infection = 0
  character.morale = 100
  // Only clear a stuck expedition when actually reviving from death — a living character being
  // fully healed shouldn't get yanked out of an expedition they're mid-way through.
  if (wasDead) { character.expedition = null; character.combat = null }

  await redis.set(`char:${charId}`, JSON.stringify(character))
  return NextResponse.json(character)
}
