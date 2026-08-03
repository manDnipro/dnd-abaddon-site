import { NextRequest, NextResponse } from 'next/server'
import { isGM } from '@/lib/auth'
import { removeWorldEvent } from '@/lib/worldState'

export async function POST(req: NextRequest) {
  if (!await isGM()) return NextResponse.json({ error: 'Немає доступу' }, { status: 403 })

  const { id } = await req.json() as { id: string }
  if (!id) return NextResponse.json({ error: 'Не вказано подію' }, { status: 400 })

  await removeWorldEvent(id)
  return NextResponse.json({ ok: true })
}
