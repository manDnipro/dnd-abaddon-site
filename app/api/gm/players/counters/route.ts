import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { isGM } from '@/lib/auth'
import { Character } from '@/lib/types'

type CounterKey = 'expeditionsCompleted' | 'zombiesKilled' | 'playersSaved'
const COUNTER_KEYS: CounterKey[] = ['expeditionsCompleted', 'zombiesKilled', 'playersSaved']

// expeditionsCompleted/zombiesKilled increment automatically from game logic (expedition return,
// combat kill) — this route exists so the GM can correct them, and is the ONLY way playersSaved
// changes at all, since there's no in-game "save a player" mechanic yet.
export async function POST(req: NextRequest) {
  if (!await isGM()) return NextResponse.json({ error: 'Немає доступу' }, { status: 403 })

  const { charId, counter, value } = await req.json() as { charId: string; counter: CounterKey; value: number }
  if (!COUNTER_KEYS.includes(counter)) return NextResponse.json({ error: 'Невідомий лічильник' }, { status: 400 })

  const raw = await redis.get<string>(`char:${charId}`)
  if (!raw) return NextResponse.json({ error: 'Персонажа не знайдено' }, { status: 404 })
  const character: Character = typeof raw === 'string' ? JSON.parse(raw) : raw

  character[counter] = Math.max(0, Math.round(value))

  await redis.set(`char:${charId}`, JSON.stringify(character))
  return NextResponse.json(character)
}
