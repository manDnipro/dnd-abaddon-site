import { redis } from './redis'

export interface MeetRequest {
  id: string
  requesterCharId: string
  requesterName: string
  targetCharId: string
  targetName: string
  status: 'pending' | 'confirmed' | 'declined'
  createdAt: number
}

export async function createMeetRequest(req: Omit<MeetRequest, 'id' | 'status' | 'createdAt'>): Promise<MeetRequest> {
  const id = String(await redis.incr('meet:id'))
  const full: MeetRequest = { ...req, id, status: 'pending', createdAt: Date.now() }
  await redis.set(`meet:${id}`, JSON.stringify(full))
  await redis.set(`meet:pending:${req.targetCharId}`, id)
  return full
}

export async function getPendingMeetFor(targetCharId: string): Promise<MeetRequest | null> {
  const id = await redis.get<string>(`meet:pending:${targetCharId}`)
  if (!id) return null
  const raw = await redis.get<string>(`meet:${id}`)
  if (!raw) return null
  const req: MeetRequest = typeof raw === 'string' ? JSON.parse(raw) : raw
  return req.status === 'pending' ? req : null
}

export async function resolveMeetRequest(id: string, status: 'confirmed' | 'declined') {
  const raw = await redis.get<string>(`meet:${id}`)
  if (!raw) return null
  const req: MeetRequest = typeof raw === 'string' ? JSON.parse(raw) : raw
  req.status = status
  await redis.set(`meet:${id}`, JSON.stringify(req))
  await redis.del(`meet:pending:${req.targetCharId}`)
  return req
}

export interface DuoInvite {
  id: string
  fromCharId: string
  fromName: string
  toCharId: string
  toName: string
  levelKey: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: number
}

export async function createDuoInvite(inv: Omit<DuoInvite, 'id' | 'status' | 'createdAt'>): Promise<DuoInvite> {
  const id = String(await redis.incr('duo:id'))
  const full: DuoInvite = { ...inv, id, status: 'pending', createdAt: Date.now() }
  await redis.set(`duo:${id}`, JSON.stringify(full))
  await redis.set(`duo:pending:${inv.toCharId}`, id)
  return full
}

export async function getPendingDuoFor(charId: string): Promise<DuoInvite | null> {
  const id = await redis.get<string>(`duo:pending:${charId}`)
  if (!id) return null
  const raw = await redis.get<string>(`duo:${id}`)
  if (!raw) return null
  const inv: DuoInvite = typeof raw === 'string' ? JSON.parse(raw) : raw
  return inv.status === 'pending' ? inv : null
}

export async function resolveDuoInvite(id: string, status: 'accepted' | 'declined') {
  const raw = await redis.get<string>(`duo:${id}`)
  if (!raw) return null
  const inv: DuoInvite = typeof raw === 'string' ? JSON.parse(raw) : raw
  inv.status = status
  await redis.set(`duo:${id}`, JSON.stringify(inv))
  await redis.del(`duo:pending:${inv.toCharId}`)
  return inv
}
