import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { getSession } from '@/lib/auth'
import { Character } from '@/lib/types'
import { migrateLegacyCharacter } from '@/lib/migrateCharacter'
import { getOrRollWeather } from '@/lib/worldState'
import { runDueDailyTicks } from '@/lib/dailyTick'

export async function GET() {
  const owner = await getSession()
  if (!owner) return NextResponse.json({ error: 'Потрібно увійти' }, { status: 401 })

  const id = await redis.get<string>(`char:owner:${owner}`)
  if (!id) return NextResponse.json({ character: null })

  const raw = await redis.get<string>(`char:${id}`)
  if (!raw) return NextResponse.json({ character: null })

  let character: Character = typeof raw === 'string' ? JSON.parse(raw) : raw
  const migrated = migrateLegacyCharacter(character)
  if (migrated) character = migrated

  let dailyTickLog: string[] = []
  if (character.status === 'approved' && !character.dead) {
    const weather = await getOrRollWeather()
    const tick = runDueDailyTicks(character, weather.temperature)
    dailyTickLog = tick.log
  }

  if (migrated || dailyTickLog.length > 0) {
    await redis.set(`char:${id}`, JSON.stringify(character))
  }

  return NextResponse.json({ character, dailyTickLog })
}
