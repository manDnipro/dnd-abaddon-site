import { redis } from './redis'
import { getSession } from './auth'
import { Character } from './types'

export async function loadOwnCharacter(): Promise<{ owner: string; charId: string; character: Character } | { error: string; status: number }> {
  const owner = await getSession()
  if (!owner) return { error: 'Потрібно увійти', status: 401 }

  const charId = await redis.get<string>(`char:owner:${owner}`)
  if (!charId) return { error: 'Персонажа не знайдено', status: 404 }

  const raw = await redis.get<string>(`char:${charId}`)
  if (!raw) return { error: 'Персонажа не знайдено', status: 404 }
  const character: Character = typeof raw === 'string' ? JSON.parse(raw) : raw

  return { owner, charId, character }
}

export async function saveCharacter(charId: string, character: Character) {
  await redis.set(`char:${charId}`, JSON.stringify(character))
}
