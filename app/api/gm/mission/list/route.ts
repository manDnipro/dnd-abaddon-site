import { NextResponse } from 'next/server'
import { isGM } from '@/lib/auth'
import { listAllMissions } from '@/lib/rpMissions'

export async function GET() {
  if (!await isGM()) return NextResponse.json({ error: 'Немає доступу' }, { status: 403 })
  const missions = await listAllMissions()
  return NextResponse.json(missions)
}
