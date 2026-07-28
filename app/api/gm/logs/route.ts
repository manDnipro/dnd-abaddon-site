import { NextResponse } from 'next/server'
import { isGM } from '@/lib/auth'
import { listServerActivity } from '@/lib/serverLog'

export async function GET() {
  if (!await isGM()) return NextResponse.json({ error: 'Немає доступу' }, { status: 403 })
  const logs = await listServerActivity()
  return NextResponse.json(logs)
}
