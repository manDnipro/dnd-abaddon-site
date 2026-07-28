import { NextResponse } from 'next/server'
import { isGM } from '@/lib/auth'
import { listGMInbox } from '@/lib/gmInbox'

export async function GET() {
  if (!await isGM()) return NextResponse.json({ error: 'Немає доступу' }, { status: 403 })
  const letters = await listGMInbox()
  return NextResponse.json(letters)
}
