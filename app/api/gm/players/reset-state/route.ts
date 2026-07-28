import { NextRequest, NextResponse } from 'next/server'
import { isGM } from '@/lib/auth'
import { redis } from '@/lib/redis'
import { Character } from '@/lib/types'

/** Unsticks a character stuck mid-expedition or mid-combat (e.g. after a bug or a bad state) —
 *  clears expedition and combat without touching hp/stats/inventory. */
export async function POST(req: NextRequest) {
  if (!await isGM()) return NextResponse.json({ error: 'Немає доступу' }, { status: 403 })

  const { charId } = await req.json() as { charId: string }
  const raw = await redis.get<string>(`char:${charId}`)
  if (!raw) return NextResponse.json({ error: 'Персонажа не знайдено' }, { status: 404 })
  const character: Character = typeof raw === 'string' ? JSON.parse(raw) : raw

  character.expedition = null
  character.combat = null
  character.currentExpeditionLog = []

  await redis.set(`char:${charId}`, JSON.stringify(character))
  return NextResponse.json(character)
}
