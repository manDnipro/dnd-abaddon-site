import { redis } from './redis'

const KEY = 'server:activity'
const RETENTION_MS = 48 * 60 * 60 * 1000

export interface ServerLogEntry { at: number; text: string }

/** Rolling 48h server activity log, visible to the GM in-panel — no external dependency (Discord
 *  webhooks proved unreliable to wire up), just the same Redis every other feature already uses.
 *  A sorted set (score = timestamp) gives a true rolling window: old entries are trimmed off by
 *  score on every write/read instead of the whole key expiring at once. */
export async function logServerActivity(text: string) {
  const now = Date.now()
  const entry = JSON.stringify({ text, at: now, r: Math.random().toString(36).slice(2, 8) })
  await redis.zadd(KEY, { score: now, member: entry })
  await redis.zremrangebyscore(KEY, 0, now - RETENTION_MS)
}

export async function listServerActivity(): Promise<ServerLogEntry[]> {
  await redis.zremrangebyscore(KEY, 0, Date.now() - RETENTION_MS)
  const raw = await redis.zrange<string[]>(KEY, 0, -1, { rev: true })
  return raw.map(r => {
    const o = typeof r === 'string' ? JSON.parse(r) : r
    return { at: o.at, text: o.text }
  })
}
