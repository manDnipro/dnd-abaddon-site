import { redis } from './redis'

const KEY = 'chat:global'
const RETENTION_MS = 48 * 60 * 60 * 1000
const MAX_TEXT_LEN = 500

export interface ChatMessage { from: string; text: string; at: number }

// Same rolling-window pattern as lib/serverLog.ts — a sorted set scored by timestamp instead of a
// capped list, so messages expire individually 48h after they were sent rather than the whole chat
// getting wiped on a schedule or truncated by count during a busy conversation.
export async function postChatMessage(from: string, text: string) {
  const trimmed = text.trim().slice(0, MAX_TEXT_LEN)
  if (!trimmed) return
  const now = Date.now()
  const member = JSON.stringify({ from, text: trimmed, at: now, r: Math.random().toString(36).slice(2, 8) })
  await redis.zadd(KEY, { score: now, member })
  await redis.zremrangebyscore(KEY, 0, now - RETENTION_MS)
}

export async function listChatMessages(): Promise<ChatMessage[]> {
  await redis.zremrangebyscore(KEY, 0, Date.now() - RETENTION_MS)
  const raw = await redis.zrange<string[]>(KEY, 0, -1)
  return raw.map(r => {
    const o = typeof r === 'string' ? JSON.parse(r) : r
    return { from: o.from, text: o.text, at: o.at }
  })
}
