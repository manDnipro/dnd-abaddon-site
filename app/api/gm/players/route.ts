import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { isGM } from '@/lib/auth'
import { Character } from '@/lib/types'

export async function GET() {
  if (!await isGM()) return NextResponse.json({ error: 'Немає доступу' }, { status: 403 })

  const ids = await redis.smembers('char:approved')
  const players: Character[] = []
  for (const id of ids) {
    const raw = await redis.get<string>(`char:${id}`)
    if (!raw) continue
    const c: Character = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (c.status === 'approved') players.push(c)
  }
  players.sort((a, b) => a.name.localeCompare(b.name))
  return NextResponse.json(players)
}
