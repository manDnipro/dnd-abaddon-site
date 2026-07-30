import { redis } from './redis'
import { logServerActivity } from './serverLog'

export interface CharacterLogEntry { text: string; at: number }

const RETENTION_MS = 24 * 60 * 60 * 1000

/** Before this rolling-window rewrite, char:log:{charId} was a plain Redis LIST (rpush/ltrim).
 *  Old characters still have that key in that shape, and running ZADD/ZRANGE against a LIST key
 *  throws WRONGTYPE — so on first touch after the rewrite, drain the old list (best-effort, no
 *  per-entry timestamp since the list format never stored one) and replace it with a sorted set
 *  seeded at "now" so history isn't lost, just re-dated. Safe to call even if the key doesn't
 *  exist or is already a sorted set (no-op in both cases). */
async function migrateIfLegacyList(key: string): Promise<void> {
  let old: string[]
  try {
    old = await redis.lrange<string>(key, 0, -1)
  } catch {
    return // not a list (either missing or already a sorted set) — nothing to migrate
  }
  if (old.length === 0) return
  await redis.del(key)
  const now = Date.now()
  const scoreMembers = old.map(entry => {
    const text = (() => { try { const o = typeof entry === 'string' ? JSON.parse(entry) : entry; return o?.text ?? String(entry) } catch { return String(entry) } })()
    return { score: now, member: JSON.stringify({ text, at: now, r: Math.random().toString(36).slice(2, 8) }) }
  }) as [{ score: number; member: string }, ...{ score: number; member: string }[]]
  await redis.zadd(key, ...scoreMembers)
}

// A capped list (old behavior) drops the OLDEST entries once the cap is hit — so a burst of
// unrelated actions (combat, crafting, resting...) could push a mission-completion line out of
// view within minutes. A sorted set scored by timestamp lets every line live for its own full
// 24h, same rolling-window pattern as lib/serverLog.ts, regardless of how much else happens.
export async function appendCharacterLog(charId: string, lines: string[]) {
  if (lines.length === 0) return
  const key = `char:log:${charId}`
  await migrateIfLegacyList(key)
  const now = Date.now()
  const members = lines.map(text => JSON.stringify({ text, at: now, r: Math.random().toString(36).slice(2, 8) }))
  const scoreMembers = members.map(member => ({ score: now, member })) as [{ score: number; member: string }, ...{ score: number; member: string }[]]
  await redis.zadd(key, ...scoreMembers)
  await redis.zremrangebyscore(key, 0, now - RETENTION_MS)
  await logServerActivity(`[char ${charId}] ${lines.join(' / ')}`)
}

export async function getCharacterLog(charId: string): Promise<CharacterLogEntry[]> {
  const key = `char:log:${charId}`
  await migrateIfLegacyList(key)
  const now = Date.now()
  await redis.zremrangebyscore(key, 0, now - RETENTION_MS)
  const raw = await redis.zrange<string[]>(key, 0, -1, { rev: true })
  return raw.map(r => {
    const o = typeof r === 'string' ? JSON.parse(r) : r
    return { text: o.text, at: o.at }
  })
}
