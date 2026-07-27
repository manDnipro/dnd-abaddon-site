import { redis } from './redis'
import { InventoryStack } from './types'

export type BarterStatus = 'active' | 'completed' | 'cancelled'

export interface BarterSession {
  id: string
  charAId: string
  charBId: string
  itemsA: InventoryStack[]
  itemsB: InventoryStack[]
  confirmedA: boolean
  confirmedB: boolean
  status: BarterStatus
  createdAt: number
}

const STALE_MS = 30 * 60 * 1000

export async function getBarterSession(id: string): Promise<BarterSession | null> {
  const raw = await redis.get<string>(`barter:${id}`)
  return raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null
}

export async function saveBarterSession(session: BarterSession) {
  await redis.set(`barter:${session.id}`, JSON.stringify(session))
}

export async function getActiveBarterFor(charId: string): Promise<BarterSession | null> {
  const sessionId = await redis.get<string>(`barter:active:${charId}`)
  if (!sessionId) return null
  const session = await getBarterSession(sessionId)
  if (!session || session.status !== 'active') return null
  if (Date.now() - session.createdAt > STALE_MS) {
    session.status = 'cancelled'
    await saveBarterSession(session)
    return null
  }
  return session
}

export async function createBarterSession(charAId: string, charBId: string): Promise<BarterSession> {
  const id = String(await redis.incr('barter:id'))
  const session: BarterSession = {
    id, charAId, charBId, itemsA: [], itemsB: [], confirmedA: false, confirmedB: false,
    status: 'active', createdAt: Date.now(),
  }
  await saveBarterSession(session)
  await redis.set(`barter:active:${charAId}`, id)
  await redis.set(`barter:active:${charBId}`, id)
  return session
}

export async function clearActiveFor(charId: string) {
  await redis.del(`barter:active:${charId}`)
}
