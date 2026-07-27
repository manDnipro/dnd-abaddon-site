import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { isGM } from '@/lib/auth'
import { Character } from '@/lib/types'

export async function GET() {
  if (!await isGM()) return NextResponse.json({ error: 'Немає доступу' }, { status: 403 })

  const ids = await redis.lrange<string>('char:pending', 0, -1)
  const chars: Character[] = []
  for (const id of ids) {
    const raw = await redis.get<string>(`char:${id}`)
    if (!raw) continue
    const c: Character = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (c.status === 'pending') chars.push(c)
  }
  return NextResponse.json(chars)
}

export async function POST(req: NextRequest) {
  if (!await isGM()) return NextResponse.json({ error: 'Немає доступу' }, { status: 403 })

  const { id, action, note } = await req.json() as { id: string; action: 'approve' | 'reject'; note?: string }
  const raw = await redis.get<string>(`char:${id}`)
  if (!raw) return NextResponse.json({ error: 'Персонажа не знайдено' }, { status: 404 })

  const character: Character = typeof raw === 'string' ? JSON.parse(raw) : raw
  character.status = action === 'approve' ? 'approved' : 'rejected'
  character.reviewedAt = Date.now()
  if (note) character.reviewNote = note

  await redis.set(`char:${id}`, JSON.stringify(character))
  await redis.lrem('char:pending', 0, id)

  if (action === 'reject') {
    await redis.del(`char:owner:${character.owner}`)
  } else {
    await redis.sadd('char:approved', id)
  }

  return NextResponse.json(character)
}
