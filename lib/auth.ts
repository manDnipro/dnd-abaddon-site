import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'crypto'
import { cookies } from 'next/headers'

const SESSION_SECRET = process.env.SESSION_SECRET!
const GM_PASSWORD = process.env.GM_PASSWORD!

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':')
  const check = scryptSync(password, salt, 64)
  const original = Buffer.from(hash, 'hex')
  return original.length === check.length && timingSafeEqual(original, check)
}

function sign(value: string) {
  const sig = createHmac('sha256', SESSION_SECRET).update(value).digest('hex')
  return `${value}.${sig}`
}

function unsign(signed: string): string | null {
  const idx = signed.lastIndexOf('.')
  if (idx === -1) return null
  const value = signed.slice(0, idx)
  const sig = signed.slice(idx + 1)
  const expected = createHmac('sha256', SESSION_SECRET).update(value).digest('hex')
  if (sig.length !== expected.length) return null
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) ? value : null
}

export async function createSession(nickname: string) {
  const store = await cookies()
  store.set('session', sign(nickname), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function getSession(): Promise<string | null> {
  const store = await cookies()
  const raw = store.get('session')?.value
  if (!raw) return null
  return unsign(raw)
}

export async function destroySession() {
  const store = await cookies()
  store.delete('session')
}

export async function isGM(): Promise<boolean> {
  const store = await cookies()
  return store.get('gm_session')?.value === sign(GM_PASSWORD)
}

export async function createGMSession(password: string): Promise<boolean> {
  if (password !== GM_PASSWORD) return false
  const store = await cookies()
  store.set('gm_session', sign(GM_PASSWORD), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  return true
}
