import { redis } from './redis'

export interface GMLetter {
  type: 'message' | 'report'
  from: string
  targetName?: string
  text: string
  at: number
}

export async function addGMLetter(letter: GMLetter) {
  await redis.rpush('gm:inbox', JSON.stringify(letter))
  await redis.ltrim('gm:inbox', -100, -1)
}

export async function listGMInbox(): Promise<GMLetter[]> {
  const raw = await redis.lrange<string>('gm:inbox', 0, -1)
  return raw.map(r => typeof r === 'string' ? JSON.parse(r) : r).reverse()
}
