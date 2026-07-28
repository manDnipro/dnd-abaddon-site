import { redis } from './redis'
import { logToDiscord } from './discordLog'

export interface CharacterLogEntry { text: string; at: number }

export async function appendCharacterLog(charId: string, lines: string[]) {
  if (lines.length === 0) return
  const entries = lines.map(text => JSON.stringify({ text, at: Date.now() }))
  await redis.rpush(`char:log:${charId}`, ...(entries as [string, ...string[]]))
  // Redis only needs to hold what the "Історія персонажа" feed actually displays (last 10) plus a
  // small buffer — Discord is the durable full history now, no need to keep growing this list.
  await redis.ltrim(`char:log:${charId}`, -15, -1)
  await logToDiscord(`**[char ${charId}]**\n${lines.join('\n')}`)
}

export async function getCharacterLog(charId: string): Promise<CharacterLogEntry[]> {
  const raw = await redis.lrange<string>(`char:log:${charId}`, -10, -1)
  return raw.map(r => typeof r === 'string' ? JSON.parse(r) : r).reverse()
}
