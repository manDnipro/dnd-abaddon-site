import { NextRequest, NextResponse } from 'next/server'
import { isGM } from '@/lib/auth'
import { redis } from '@/lib/redis'
import { addPlayerMessage } from '@/lib/playerInbox'

export async function POST(req: NextRequest) {
  if (!await isGM()) return NextResponse.json({ error: 'Немає доступу' }, { status: 403 })

  const { charId, text } = await req.json() as { charId: string; text: string }
  if (!text?.trim()) return NextResponse.json({ error: 'Порожнє повідомлення' }, { status: 400 })

  const raw = await redis.get<string>(`char:${charId}`)
  if (!raw) return NextResponse.json({ error: 'Персонажа не знайдено' }, { status: 404 })

  await addPlayerMessage(charId, 'ГМ', text.trim().slice(0, 1000))
  return NextResponse.json({ ok: true })
}
