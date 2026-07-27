import { NextRequest, NextResponse } from 'next/server'
import { isGM } from '@/lib/auth'
import { addWorldEvent } from '@/lib/worldState'

export async function POST(req: NextRequest) {
  if (!await isGM()) return NextResponse.json({ error: 'Немає доступу' }, { status: 403 })

  const { text } = await req.json() as { text: string }
  if (!text?.trim()) return NextResponse.json({ error: 'Порожній текст події' }, { status: 400 })

  await addWorldEvent(text.trim())
  return NextResponse.json({ ok: true })
}
