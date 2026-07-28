import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { addGMLetter } from '@/lib/gmInbox'

export async function POST(req: NextRequest) {
  const nickname = await getSession()
  if (!nickname) return NextResponse.json({ error: 'Потрібно увійти' }, { status: 401 })

  const { text } = await req.json() as { text: string }
  if (!text?.trim()) return NextResponse.json({ error: 'Порожній лист' }, { status: 400 })

  await addGMLetter({ type: 'message', from: nickname, text: text.trim().slice(0, 1000), at: Date.now() })
  return NextResponse.json({ ok: true })
}
