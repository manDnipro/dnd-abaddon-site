import { NextRequest, NextResponse } from 'next/server'
import { createGMSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const ok = await createGMSession(password || '')
  if (!ok) return NextResponse.json({ error: 'Невірний пароль ГМ' }, { status: 401 })
  return NextResponse.json({ ok: true })
}
