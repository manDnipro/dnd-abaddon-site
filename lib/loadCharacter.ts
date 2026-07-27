import { redis } from './redis'
import { getSession } from './auth'
import { Character } from './types'
import { migrateLegacyCharacter } from './migrateCharacter'
import { getOrRollWeather } from './worldState'
import { runDueDailyTicks } from './dailyTick'

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
