import { NextResponse } from 'next/server'
import { redis } from './redis'
import { getSession } from './auth'
import { Character } from './types'
import { migrateLegacyCharacter } from './migrateCharacter'
import { getOrRollWeather } from './worldState'
import { runDueDailyTicks } from './dailyTick'

/** Some things (hunting, visiting a camp location, the personal storage box, trading, socializing)
 *  only make sense while physically at camp — not out on an expedition. Personal actions like
 *  resting, crafting, repairing, or using an item are NOT gated this way (you have your gear and
 *  yourself with you in the field too) — see blockIfInCombat for what actually stops those. */
export function blockIfOnExpedition(character: Character): NextResponse | null {
  if (!character.expedition) return null
  return NextResponse.json({ error: '🚶 Ти зараз на вилазці — це недоступно, поки не повернешся в табір.' }, { status: 409 })
}

/** Mid-fight, you can't stop to eat a sandwich or lash together a repair — resolve the combat first. */
export function blockIfInCombat(character: Character): NextResponse | null {
  if (!character.combat) return null
  return NextResponse.json({ error: '⚔️ Ти зараз у бою — спершу розберись з ворогом.' }, { status: 409 })
}

export async function loadOwnCharacter(): Promise<{ owner: string; charId: string; character: Character; dailyTickLog: string[] } | { error: string; status: number }> {
  const owner = await getSession()
  if (!owner) return { error: 'Потрібно увійти', status: 401 }

  const charId = await redis.get<string>(`char:owner:${owner}`)
  if (!charId) return { error: 'Персонажа не знайдено', status: 404 }

  const raw = await redis.get<string>(`char:${charId}`)
  if (!raw) return { error: 'Персонажа не знайдено', status: 404 }
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
    await redis.set(`char:${charId}`, JSON.stringify(character))
  }

  return { owner, charId, character, dailyTickLog }
}

export async function saveCharacter(charId: string, character: Character) {
  await redis.set(`char:${charId}`, JSON.stringify(character))
}
