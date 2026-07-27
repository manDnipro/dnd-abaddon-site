import { redis } from './redis'
import { Character } from './types'

/** char:approved only started being populated once this set existed — backfill it lazily by
 *  scanning every character ever created, so approvals from before that still show up. */
export async function getApprovedCharacterIds(): Promise<string[]> {
  let ids = await redis.smembers('char:approved')

  const maxId = await redis.get<number>('char:id')
  if (maxId) {
    const missing: string[] = []
    for (let i = 1; i <= maxId; i++) {
      const id = String(i)
      if (ids.includes(id)) continue
      const raw = await redis.get<string>(`char:${id}`)
      if (!raw) continue
      const c: Character = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (c.status === 'approved') missing.push(id)
    }
    if (missing.length > 0) {
      await redis.sadd('char:approved', ...(missing as [string, ...string[]]))
      ids = [...ids, ...missing]
    }
  }

  return ids
}
