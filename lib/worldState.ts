import { redis } from './redis'
import { Season, nextSeason, rollDailyWeather, SEASON_DURATION_MS } from './weather'

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

export async function addWorldEvent(text: string) {
  await redis.rpush('world:events', JSON.stringify({ text, at: Date.now() }))
  await redis.ltrim('world:events', -20, -1)
}

export async function listWorldEvents(): Promise<WorldEvent[]> {
  const raw = await redis.lrange<string>('world:events', -10, -1)
  return raw.map(r => typeof r === 'string' ? JSON.parse(r) : r).reverse()
}
