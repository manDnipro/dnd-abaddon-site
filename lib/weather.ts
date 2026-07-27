import { Character, ClothingSlot } from './types'
import { getItem } from './items'

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export const SEASON_LABELS: Record<Season, string> = {
  spring: '🌱 Весна', summer: '☀️ Літо', autumn: '🍂 Осінь', winter: '❄️ Зима',
}
const SEASON_ORDER: Season[] = ['spring', 'summer', 'autumn', 'winter']
export const SEASON_DURATION_MS = 7 * 24 * 60 * 60 * 1000

export function nextSeason(season: Season): Season {
  return SEASON_ORDER[(SEASON_ORDER.indexOf(season) + 1) % SEASON_ORDER.length]
}

interface WeatherScenario { key: string; label: string; tempMin: number; tempMax: number; weight: number }

const SEASON_WEATHER_SCENARIOS: Record<Season, WeatherScenario[]> = {
  spring: [
    { key: 'clear', label: '☀️ Ясно', tempMin: 10, tempMax: 20, weight: 20 },
    { key: 'cloudy', label: '☁️ Хмарно', tempMin: 8, tempMax: 16, weight: 20 },
    { key: 'rain', label: '🌧️ Дощ', tempMin: 6, tempMax: 14, weight: 25 },
    { key: 'fog', label: '🌫️ Туман', tempMin: 4, tempMax: 12, weight: 15 },
    { key: 'storm', label: '⛈️ Гроза', tempMin: 6, tempMax: 14, weight: 10 },
    { key: 'heatwave', label: '🥵 Спека', tempMin: 25, tempMax: 30, weight: 5 },
    { key: 'frost', label: '🥶 Мороз', tempMin: -5, tempMax: 0, weight: 5 },
  ],
  summer: [
    { key: 'clear', label: '☀️ Ясно', tempMin: 20, tempMax: 30, weight: 35 },
    { key: 'heatwave', label: '🥵 Спека', tempMin: 30, tempMax: 40, weight: 20 },
    { key: 'cloudy', label: '☁️ Хмарно', tempMin: 18, tempMax: 26, weight: 15 },
    { key: 'storm', label: '⛈️ Гроза', tempMin: 18, tempMax: 26, weight: 15 },
    { key: 'rain', label: '🌧️ Дощ', tempMin: 16, tempMax: 24, weight: 10 },
    { key: 'fog', label: '🌫️ Туман', tempMin: 15, tempMax: 22, weight: 5 },
  ],
  autumn: [
    { key: 'cloudy', label: '☁️ Хмарно', tempMin: 8, tempMax: 16, weight: 25 },
    { key: 'rain', label: '🌧️ Дощ', tempMin: 5, tempMax: 13, weight: 25 },
    { key: 'fog', label: '🌫️ Туман', tempMin: 3, tempMax: 10, weight: 20 },
    { key: 'clear', label: '☀️ Ясно', tempMin: 8, tempMax: 16, weight: 15 },
    { key: 'storm', label: '⛈️ Гроза', tempMin: 5, tempMax: 12, weight: 8 },
    { key: 'frost', label: '🥶 Мороз', tempMin: -8, tempMax: -1, weight: 7 },
  ],
  winter: [
    { key: 'frost', label: '🥶 Мороз', tempMin: -20, tempMax: -5, weight: 30 },
    { key: 'snow', label: '❄️ Сніг', tempMin: -18, tempMax: -3, weight: 25 },
    { key: 'cloudy', label: '☁️ Хмарно', tempMin: -5, tempMax: 3, weight: 20 },
    { key: 'fog', label: '🌫️ Туман', tempMin: -8, tempMax: 2, weight: 15 },
    { key: 'clear', label: '☀️ Ясно', tempMin: -10, tempMax: 0, weight: 10 },
  ],
}

export interface RolledWeather { weather: string; label: string; temperature: number }

export function rollDailyWeather(season: Season): RolledWeather {
  const scenarios = SEASON_WEATHER_SCENARIOS[season]
  const totalWeight = scenarios.reduce((sum, s) => sum + s.weight, 0)
  let roll = Math.random() * totalWeight
  let scenario = scenarios[scenarios.length - 1]
  for (const s of scenarios) {
    roll -= s.weight
    if (roll <= 0) { scenario = s; break }
  }
  const temperature = scenario.tempMin + Math.floor(Math.random() * (scenario.tempMax - scenario.tempMin + 1))
  return { weather: scenario.key, label: scenario.label, temperature }
}

const SLOTS: ClothingSlot[] = ['head', 'torso', 'legs', 'feet', 'accessory', 'backpack']

export function totalWarmth(character: Character): number {
  return SLOTS.reduce((sum, slot) => {
    const key = character.equipped[slot]
    const def = key ? getItem(key) : undefined
    return sum + (def?.warmth ?? 0)
  }, 0)
}

export function totalArmor(character: Character): number {
  return SLOTS.reduce((sum, slot) => {
    const key = character.equipped[slot]
    const def = key ? getItem(key) : undefined
    return sum + (def?.armor ?? 0)
  }, 0)
}

const COMFORT_MIN = 12
const COMFORT_MAX = 26

export interface TemperaturePenalty { type: 'cold' | 'hot' | 'none'; severity: number }

export function computeTemperaturePenalty(ambientTemp: number, warmth: number): TemperaturePenalty {
  if (ambientTemp < COMFORT_MIN) {
    const severity = Math.max(0, COMFORT_MIN - ambientTemp - warmth)
    return { type: severity > 0 ? 'cold' : 'none', severity }
  }
  if (ambientTemp > COMFORT_MAX) {
    const severity = ambientTemp - COMFORT_MAX + Math.floor(warmth / 10)
    return { type: 'hot', severity }
  }
  return { type: 'none', severity: 0 }
}
