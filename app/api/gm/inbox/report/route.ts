import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { redis } from '@/lib/redis'
import { Character } from '@/lib/types'
import { addGMLetter } from '@/lib/gmInbox'

export async function POST(req: NextRequest) {
  const nickname = await getSession()
  if (!nickname) return NextResponse.json({ error: 'Потрібно увійти' }, { status: 401 })

  const { targetCharId, reason } = await req.json() as { targetCharId: string; reason: string }
  if (!reason?.trim()) return NextResponse.json({ error: 'Опиши причину скарги' }, { status: 400 })

  const raw = await redis.get<string>(`char:${targetCharId}`)
  if (!raw) return NextResponse.json({ error: 'Гравця не знайдено' }, { status: 404 })
  const target: Character = typeof raw === 'string' ? JSON.parse(raw) : raw

  await addGMLetter({ type: 'report', from: nickname, targetName: target.name, text: reason.trim().slice(0, 1000), at: Date.now() })
  return NextResponse.json({ ok: true })
}
