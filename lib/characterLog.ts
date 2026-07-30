import { redis } from './redis'
import { logServerActivity } from './serverLog'

export interface CharacterLogEntry { text: string; at: number }

const RETENTION_MS = 24 * 60 * 60 * 1000

// A capped list (old behavior) drops the OLDEST entries once the cap is hit — so a burst of
// unrelated actions (combat, crafting, resting...) could push a mission-completion line out of
// view within minutes. A sorted set scored by timestamp lets every line live for its own full
// 24h, same rolling-window pattern as lib/serverLog.ts, regardless of how much else happens.
export async function appendCharacterLog(charId: string, lines: string[]) {
  if (lines.length === 0) return
  const key = `char:log:${charId}`
  const now = Date.now()
  const members = lines.map(text => JSON.stringify({ text, at: now, r: Math.random().toString(36).slice(2, 8) }))
  const scoreMembers = members.map(member => ({ score: now, member })) as [{ score: number; member: string }, ...{ score: number; member: string }[]]
  await redis.zadd(key, ...scoreMembers)
  await redis.zremrangebyscore(key, 0, now - RETENTION_MS)
  await logServerActivity(`[char ${charId}] ${lines.join(' / ')}`)
}

export async function getCharacterLog(charId: string): Promise<CharacterLogEntry[]> {
  const key = `char:log:${charId}`
  const now = Date.now()
  await redis.zremrangebyscore(key, 0, now - RETENTION_MS)
  const raw = await redis.zrange<string[]>(key, 0, -1, { rev: true })
  return raw.map(r => {
    const o = typeof r === 'string' ? JSON.parse(r) : r
    return { text: o.text, at: o.at }
  })
}
