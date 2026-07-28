import { redis } from './redis'

export interface CharacterLogEntry { text: string; at: number }

export async function appendCharacterLog(charId: string, lines: string[]) {
  if (lines.length === 0) return
  const entries = lines.map(text => JSON.stringify({ text, at: Date.now() }))
  await redis.rpush(`char:log:${charId}`, ...(entries as [string, ...string[]]))
  await redis.ltrim(`char:log:${charId}`, -30, -1)
}

export async function getCharacterLog(charId: string): Promise<CharacterLogEntry[]> {
  const raw = await redis.lrange<string>(`char:log:${charId}`, -10, -1)
  return raw.map(r => typeof r === 'string' ? JSON.parse(r) : r).reverse()
}
