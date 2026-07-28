import { redis } from './redis'

export interface PlayerMessage {
  id: string
  from: string
  text: string
  at: number
  read: boolean
}

const KEY = (charId: string) => `char:inbox:${charId}`

export async function addPlayerMessage(charId: string, from: string, text: string) {
  const id = String(await redis.incr('player:message:id'))
  const msg: PlayerMessage = { id, from, text, at: Date.now(), read: false }
  await redis.rpush(KEY(charId), JSON.stringify(msg))
  await redis.ltrim(KEY(charId), -50, -1)
}

export async function listPlayerMessages(charId: string): Promise<PlayerMessage[]> {
  const raw = await redis.lrange<string>(KEY(charId), 0, -1)
  return raw.map(r => (typeof r === 'string' ? JSON.parse(r) : r) as PlayerMessage).reverse()
}

export async function markAllRead(charId: string) {
  const raw = await redis.lrange<string>(KEY(charId), 0, -1)
  if (raw.length === 0) return
  const updated = raw.map(r => {
    const msg = (typeof r === 'string' ? JSON.parse(r) : r) as PlayerMessage
    return JSON.stringify({ ...msg, read: true })
  })
  await redis.del(KEY(charId))
  if (updated.length > 0) await redis.rpush(KEY(charId), ...(updated as [string, ...string[]]))
}
