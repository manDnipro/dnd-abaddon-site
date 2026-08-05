import { NextRequest, NextResponse } from 'next/server'
import { isGM } from '@/lib/auth'
import { redis } from '@/lib/redis'
import { Character } from '@/lib/types'
import { getCharacterLog } from '@/lib/characterLog'

// TEMPORARY — remove after diagnosing the "luck reroll doesn't work" report.
export async function GET(req: NextRequest) {
  if (!await isGM()) return NextResponse.json({ error: 'Немає доступу' }, { status: 403 })

  const name = req.nextUrl.searchParams.get('name')
  if (!name) return NextResponse.json({ error: 'name query param required' }, { status: 400 })

  const maxId = await redis.get<number>('char:id')
  let found: Character | null = null
  if (maxId) {
    for (let i = 1; i <= maxId; i++) {
      const raw = await redis.get<string>(`char:${i}`)
      if (!raw) continue
      const c: Character = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (c.name.toLowerCase().includes(name.toLowerCase())) { found = c; break }
    }
  }
  if (!found) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const log = await getCharacterLog(found.id)
  const relevantLog = log.filter(e =>
    e.text.includes('🍀') || e.text.includes('Пошук') || e.text.includes('удач')
  ).slice(0, 30)

  return NextResponse.json({
    id: found.id, name: found.name,
    luck: found.luck, maxLuck: found.maxLuck,
    lastDailyTickAt: found.lastDailyTickAt, lastDailyTickAgoHours: Math.round((Date.now() - found.lastDailyTickAt) / 3_600_000 * 10) / 10,
    relevantLog,
  })
}
