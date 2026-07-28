import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { isGM } from '@/lib/auth'
import { Character, EMPTY_EQUIPPED, Stats, maxHpForEndurance, validateStatSpread } from '@/lib/types'

export async function POST(req: NextRequest) {
  if (!await isGM()) return NextResponse.json({ error: 'Немає доступу' }, { status: 403 })

  const { name, owner, stats } = await req.json() as { name: string; owner: string; stats: Stats }

  const charName = (name || '').trim()
  if (charName.length < 2 || charName.length > 30) {
    return NextResponse.json({ error: 'Імʼя персонажа має бути від 2 до 30 символів' }, { status: 400 })
  }
  const ownerName = (owner || 'ГМ').trim()

  const statError = validateStatSpread(stats)
  if (statError) return NextResponse.json({ error: statError }, { status: 400 })

  const id = await redis.incr('char:id')
  const maxHp = maxHpForEndurance(stats.end)

  const character: Character = {
    id: String(id),
    owner: ownerName,
    name: charName,
    stats,
    status: 'approved',
    createdAt: Date.now(),
    reviewedAt: Date.now(),
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
  }

  await redis.set(`char:${id}`, JSON.stringify(character))
  await redis.sadd('char:approved', String(id))

  // If this name matches a real registered account with no character yet, link it so that
  // player can actually see and use the card. Otherwise it's just an NPC-style entry GM controls.
  const userExists = await redis.get(`user:${ownerName.toLowerCase()}`)
  const alreadyHasChar = await redis.get(`char:owner:${ownerName}`)
  if (userExists && !alreadyHasChar) {
    await redis.set(`char:owner:${ownerName}`, String(id))
  }

  return NextResponse.json(character)
}
