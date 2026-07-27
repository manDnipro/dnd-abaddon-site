import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { verifyPassword, createSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { nickname, password } = await req.json()
  const nick = (nickname || '').trim()

  const raw = await redis.get<string>(`user:${nick.toLowerCase()}`)
  if (!raw) {
    return NextResponse.json({ error: 'Невірний нік або пароль' }, { status: 401 })
  }
  const user = typeof raw === 'string' ? JSON.parse(raw) : raw

  if (!verifyPassword(password || '', user.passwordHash)) {
    return NextResponse.json({ error: 'Невірний нік або пароль' }, { status: 401 })
  }

  await createSession(user.nickname)
  return NextResponse.json({ nickname: user.nickname })
}
