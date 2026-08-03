import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { getSession } from '@/lib/auth'
import { Character, EMPTY_EQUIPPED, LUCK_MAX, Stats, maxHpForEndurance, validateStatSpread } from '@/lib/types'
import { getOwnerCharId } from '@/lib/ownerChar'

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

  const existingId = await getOwnerCharId(owner)
  if (existingId) {
    const existingRaw = await redis.get<string>(`char:${existingId}`)
    const existing: Character | null = existingRaw ? (typeof existingRaw === 'string' ? JSON.parse(existingRaw) : existingRaw) : null
    if (existing && !existing.dead) {
      return NextResponse.json({ error: 'У вас вже є персонаж' }, { status: 409 })
    }
    // Their previous character died — a fresh one gets a brand new id (never reused) and the
    // account mapping moves to point at it; the dead one stays in Redis as-is, an untouched record.
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
    combat: null,
    currentExpeditionLog: [],
    lastExpeditionLog: [],
    recentExpeditionTimestamps: [],
    huntingProf: 0,
    huntsSinceLevel: 0,
    avatar: null,
    canteenUses: [],
    xp: 0,
    meleeProf: 0,
    firearmProf: 0,
    lastDailyTickAt: Date.now(),
    durability: {},
    bio: '',
    expeditionsCompleted: 0,
    zombiesKilled: 0,
    playersSaved: 0,
    luck: LUCK_MAX,
    maxLuck: LUCK_MAX,
  }

  await redis.set(`char:${id}`, JSON.stringify(character))
  await redis.set(`char:owner:${owner}`, String(id))
  await redis.rpush('char:pending', String(id))

  return NextResponse.json(character)
}
