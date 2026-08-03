import { redis } from './redis'
import { Season, nextSeason, rollDailyWeather, SEASON_DURATION_MS } from './weather'
import { logServerActivity } from './serverLog'

const DAY_MS = 24 * 60 * 60 * 1000

export interface WorldWeather {
  season: Season
  seasonStartedAt: number
  weather: string
  label: string
  temperature: number
  rolledAt: number
}

const WORLD_KEY = 'world:weather'

export async function getOrRollWeather(): Promise<WorldWeather> {
  const raw = await redis.get<string>(WORLD_KEY)
  let state: WorldWeather | null = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null

  if (!state) {
    const season: Season = 'spring'
    const rolled = rollDailyWeather(season)
    state = { season, seasonStartedAt: Date.now(), weather: rolled.weather, label: rolled.label, temperature: rolled.temperature, rolledAt: Date.now() }
    await redis.set(WORLD_KEY, JSON.stringify(state))
    return state
  }

  const now = Date.now()
  let changed = false
  let season = state.season
  let seasonStartedAt = state.seasonStartedAt

  if (now - seasonStartedAt >= SEASON_DURATION_MS) {
    season = nextSeason(season)
    seasonStartedAt = now
    changed = true
  }
  if (changed || now - state.rolledAt >= DAY_MS) {
    const rolled = rollDailyWeather(season)
    state = { season, seasonStartedAt, weather: rolled.weather, label: rolled.label, temperature: rolled.temperature, rolledAt: now }
    await redis.set(WORLD_KEY, JSON.stringify(state))
  }

  return state
}

/** GM tool: force tomorrow's weather to roll immediately, without waiting for the 24h window. */
export async function forceAdvanceDay(): Promise<WorldWeather> {
  const raw = await redis.get<string>(WORLD_KEY)
  const state: WorldWeather | null = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null
  if (state) {
    state.rolledAt = 0
    await redis.set(WORLD_KEY, JSON.stringify(state))
  }
  return getOrRollWeather()
}

export interface WorldEvent { text: string; at: number }

const WORLD_EVENTS_KEY = 'world:events'
const WORLD_EVENTS_RETENTION_MS = 48 * 60 * 60 * 1000

// world:events used to be a plain Redis LIST (rpush/ltrim) — running ZADD/ZRANGE against that old
// key shape throws WRONGTYPE (same issue hit with char:log:* in lib/characterLog.ts). Drain it into
// the new sorted-set shape on first touch after this change, best-effort re-dated at "now" since the
// list format never stored a timestamp.
async function migrateIfLegacyList(key: string): Promise<void> {
  let old: string[]
  try {
    old = await redis.lrange<string>(key, 0, -1)
  } catch {
    return
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

// Same rolling-window pattern as lib/serverLog.ts / lib/chat.ts — a sorted set scored by timestamp,
// so each news item expires 48h after it was posted instead of just falling off a capped list of 10
// (which could hide a still-relevant event within minutes during a busy GM session).
export async function addWorldEvent(text: string) {
  await migrateIfLegacyList(WORLD_EVENTS_KEY)
  const now = Date.now()
  const member = JSON.stringify({ text, at: now, r: Math.random().toString(36).slice(2, 8) })
  await redis.zadd(WORLD_EVENTS_KEY, { score: now, member })
  await redis.zremrangebyscore(WORLD_EVENTS_KEY, 0, now - WORLD_EVENTS_RETENTION_MS)
  await logServerActivity(`[world event] ${text}`)
}

export async function listWorldEvents(): Promise<WorldEvent[]> {
  await migrateIfLegacyList(WORLD_EVENTS_KEY)
  await redis.zremrangebyscore(WORLD_EVENTS_KEY, 0, Date.now() - WORLD_EVENTS_RETENTION_MS)
  const raw = await redis.zrange<string[]>(WORLD_EVENTS_KEY, 0, -1, { rev: true })
  return raw.map(r => {
    const o = typeof r === 'string' ? JSON.parse(r) : r
    return { text: o.text, at: o.at }
  })
}

