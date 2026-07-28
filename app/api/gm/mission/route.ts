import { NextRequest, NextResponse } from 'next/server'
import { isGM } from '@/lib/auth'
import { addWorldMission } from '@/lib/worldState'

export async function POST(req: NextRequest) {
  if (!await isGM()) return NextResponse.json({ error: 'Немає доступу' }, { status: 403 })

  const { title, text } = await req.json() as { title: string; text: string }
  if (!title?.trim() || !text?.trim()) return NextResponse.json({ error: 'Заповни назву й опис місії' }, { status: 400 })

  await addWorldMission(title.trim(), text.trim())
  return NextResponse.json({ ok: true })
}
