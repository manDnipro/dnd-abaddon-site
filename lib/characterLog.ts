import { redis } from './redis'
import { logServerActivity } from './serverLog'

export interface CharacterLogEntry { text: string; at: number }

export async function appendCharacterLog(charId: string, lines: string[]) {
  if (lines.length === 0) return
  const entries = lines.map(text => JSON.stringify({ text, at: Date.now() }))
  await redis.rpush(`char:log:${charId}`, ...(entries as [string, ...string[]]))
  await redis.ltrim(`char:log:${charId}`, -15, -1)
  await logServerActivity(`[char ${charId}] ${lines.join(' / ')}`)
}

export async function getCharacterLog(charId: string): Promise<CharacterLogEntry[]> {
  const raw = await redis.lrange<string>(`char:log:${charId}`, -10, -1)
  return raw.map(r => typeof r === 'string' ? JSON.parse(r) : r).reverse()
}
