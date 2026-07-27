import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { getSession } from '@/lib/auth'
import { Character, STAT_POINTS_TOTAL, Stats } from '@/lib/types'

export async function POST(req: NextRequest) {
  const owner = await getSession()
  if (!owner) return NextResponse.json({ error: 'Потрібно увійти' }, { status: 401 })

  const { name, stats } = await req.json() as { name: string; stats: Stats }

  const charName = (name || '').trim()
  if (charName.length < 2 || charName.length > 30) {
    return NextResponse.json({ error: 'Імʼя персонажа має бути від 2 до 30 символів' }, { status: 400 })
  }

  const values = Object.values(stats || {})
  if (values.length !== 6 || values.some(v => !Number.isInteger(v) || v < 1)) {
    return NextResponse.json({ error: 'Некоректні характеристики' }, { status: 400 })
  }
  const sum = values.reduce((a, b) => a + b, 0)
  if (sum !== STAT_POINTS_TOTAL) {
    return NextResponse.json({ error: `Сума характеристик має дорівнювати ${STAT_POINTS_TOTAL} (зараз ${sum})` }, { status: 400 })
  }

  const existing = await redis.get<string>(`char:owner:${owner}`)
  if (existing) {
    return NextResponse.json({ error: 'У вас вже є персонаж' }, { status: 409 })
  }

  const id = await redis.incr('char:id')
  const character: Character = {
    id: String(id),
    owner,
    name: charName,
    stats,
    status: 'pending',
    createdAt: Date.now(),
  }

  await redis.set(`char:${id}`, JSON.stringify(character))
  await redis.set(`char:owner:${owner}`, String(id))
  await redis.rpush('char:pending', String(id))

  return NextResponse.json(character)
}
