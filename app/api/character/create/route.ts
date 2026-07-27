import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { getSession } from '@/lib/auth'
import { Character, EMPTY_EQUIPPED, Stats, maxHpForEndurance, validateStatSpread } from '@/lib/types'

export async function POST(req: NextRequest) {
  const owner = await getSession()
  if (!owner) return NextResponse.json({ error: 'Потрібно увійти' }, { status: 401 })

  const { name, stats } = await req.json() as { name: string; stats: Stats }

  const charName = (name || '').trim()
  if (charName.length < 2 || charName.length > 30) {
    return NextResponse.json({ error: 'Імʼя персонажа має бути від 2 до 30 символів' }, { status: 400 })
  }

  const statError = validateStatSpread(stats)
  if (statError) return NextResponse.json({ error: statError }, { status: 400 })

  const existing = await redis.get<string>(`char:owner:${owner}`)
  if (existing) {
    return NextResponse.json({ error: 'У вас вже є персонаж' }, { status: 409 })
  }

  const id = await redis.incr('char:id')
  const maxHp = maxHpForEndurance(stats.end)

  const character: Character = {
    id: String(id),
    owner,
    name: charName,
    stats,
    status: 'pending',
    createdAt: Date.now(),
    hp: maxHp,
    maxHp,
    hunger: 100,
    thirst: 100,
    morale: 70,
    infection: 0,
    reputation: 5,
    dead: false,
    inventory: [
      { itemId: 'pipe', qty: 1 },
      { itemId: 'bandage', qty: 2 },
      { itemId: 'canned_food', qty: 2 },
      { itemId: 'water_bottle', qty: 2 },
    ],
    equipped: EMPTY_EQUIPPED,
    storageBox: [],
    expedition: null,
    recentExpeditionTimestamps: [],
    huntingProf: 0,
    huntsSinceLevel: 0,
  }

  await redis.set(`char:${id}`, JSON.stringify(character))
  await redis.set(`char:owner:${owner}`, String(id))
  await redis.rpush('char:pending', String(id))

  return NextResponse.json(character)
}
