import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { hashPassword, createSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { nickname, password } = await req.json()

  const nick = (nickname || '').trim()
  if (nick.length < 3 || nick.length > 24) {
    return NextResponse.json({ error: 'Нік має бути від 3 до 24 символів' }, { status: 400 })
  }
  if (!password || password.length < 4) {
    return NextResponse.json({ error: 'Пароль має бути мінімум 4 символи' }, { status: 400 })
  }

  const key = `user:${nick.toLowerCase()}`
  const exists = await redis.get(key)
  if (exists) {
    return NextResponse.json({ error: 'Такий нік вже зайнятий' }, { status: 409 })
  }

  await redis.set(key, JSON.stringify({ nickname: nick, passwordHash: hashPassword(password), createdAt: Date.now() }))
  await createSession(nick)

  return NextResponse.json({ nickname: nick })
}
