import { NextResponse } from 'next/server'
import { isGM } from '@/lib/auth'
import { forceAdvanceDay } from '@/lib/worldState'

export async function POST() {
  if (!await isGM()) return NextResponse.json({ error: 'Немає доступу' }, { status: 403 })

  const weather = await forceAdvanceDay()
  return NextResponse.json(weather)
}
