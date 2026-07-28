import { NextRequest, NextResponse } from 'next/server'
import { isGM } from '@/lib/auth'
import { redis } from '@/lib/redis'

export async function POST(req: NextRequest) {
  if (!await isGM()) return NextResponse.json({ error: 'Немає доступу' }, { status: 403 })
  const { missionId } = await req.json() as { missionId: string }
  await redis.hdel('rp:missions', missionId)
  return NextResponse.json({ ok: true })
}
