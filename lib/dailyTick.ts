import { Character, clampHungerThirst, clampInfection, clampMorale } from './types'
import { rollDice } from './dice'
import { computeTemperaturePenalty, totalWarmth } from './weather'

const DAILY_HUNGER_DECAY = 20
const DAILY_THIRST_DECAY = 30
const DAILY_INFECTION_GROWTH = 5
const SEVERE_TEMPERATURE_THRESHOLD = 15
const SEVERE_TEMPERATURE_INJURY_CHANCE = 0.3
const DAY_MS = 24 * 60 * 60 * 1000
// Safety cap on backlog catch-up for a character who hasn't loaded the site in a long time —
// the bot's real cron would apply every single missed day; we approximate with a cap so an
// abandoned character doesn't require an unbounded loop (site has no background cron of its own).
const MAX_CATCHUP_DAYS = 14

export interface DailyTickOutcome { log: string[]; died: boolean }

function applyOneDay(character: Character, ambientTemp: number, log: string[]): boolean {
  const warmth = totalWarmth(character)
  const penalty = computeTemperaturePenalty(ambientTemp, warmth)

  character.hunger = clampHungerThirst(character.hunger - DAILY_HUNGER_DECAY)
  character.thirst = clampHungerThirst(character.thirst - DAILY_THIRST_DECAY)

  if (penalty.type === 'cold') {
    character.hunger = clampHungerThirst(character.hunger - penalty.severity)
    character.thirst = clampHungerThirst(character.thirst - Math.floor(penalty.severity / 2))
    character.morale = clampMorale(character.morale - penalty.severity)
    log.push(`🥶 ${character.name} мерзне (бракує ${penalty.severity} тепла): додатково голод/спрага, мораль -${penalty.severity}.`)
    if (penalty.severity > SEVERE_TEMPERATURE_THRESHOLD && Math.random() < SEVERE_TEMPERATURE_INJURY_CHANCE) {
      const dmg = rollDice('1d4').total
      character.hp = Math.max(0, character.hp - dmg)
      log.push(`🥶 Обмороження! ${character.name} втрачає ${dmg} ОЗ.`)
    }
  } else if (penalty.type === 'hot') {
    character.thirst = clampHungerThirst(character.thirst - penalty.severity)
    character.morale = clampMorale(character.morale - Math.floor(penalty.severity / 2))
    log.push(`🥵 ${character.name} страждає від спеки: додаткова спрага -${penalty.severity}, мораль -${Math.floor(penalty.severity / 2)}.`)
    if (penalty.severity > SEVERE_TEMPERATURE_THRESHOLD && Math.random() < SEVERE_TEMPERATURE_INJURY_CHANCE) {
      const dmg = rollDice('1d4').total
      character.hp = Math.max(0, character.hp - dmg)
      log.push(`🥵 Тепловий удар! ${character.name} втрачає ${dmg} ОЗ.`)
    }
  }

  if (character.hunger === 0) {
    const dmg = rollDice('1d4').total
    character.hp = Math.max(0, character.hp - dmg)
    log.push(`🍽️ ${character.name} голодує і втрачає ${dmg} ОЗ.`)
  }
  if (character.thirst === 0) {
    const dmg = rollDice('1d6').total
    character.hp = Math.max(0, character.hp - dmg)
    log.push(`💧 ${character.name} страждає від зневоднення і втрачає ${dmg} ОЗ.`)
  }
  if (character.infection > 0) {
    character.infection = clampInfection(character.infection + DAILY_INFECTION_GROWTH)
    log.push(`☣️ Інфекція ${character.name} прогресує (${character.infection}/100).`)
    if (character.infection >= 100) {
      character.dead = true
      log.push(`💀 ${character.name} повністю заражений і перетворюється на зомбі...`)
      return true
    }
  }
  if (character.hunger === 0 || character.thirst === 0) {
    character.morale = clampMorale(character.morale - 10)
  }

  if (character.hp <= 0) {
    character.dead = true
    log.push(`☠️ ${character.name} гине від виснаження.`)
    return true
  }
  return false
}

/** Catches a character up on missed daily ticks since their last visit — the site has no background
 *  cron, so this runs lazily whenever the character is loaded. Uses today's world temperature for
 *  every missed day as an approximation (we don't retroactively store each day's historical weather). */
export function runDueDailyTicks(character: Character, ambientTemp: number): DailyTickOutcome {
  const log: string[] = []
  if (character.dead) return { log, died: false }

  const now = Date.now()
  const daysElapsed = Math.floor((now - character.lastDailyTickAt) / DAY_MS)
  if (daysElapsed < 1) return { log, died: false }

  const days = Math.min(daysElapsed, MAX_CATCHUP_DAYS)
  for (let i = 0; i < days; i++) {
    const died = applyOneDay(character, ambientTemp, log)
    if (died) {
      character.lastDailyTickAt = now
      return { log, died: true }
    }
  }
  if (character.luck < character.maxLuck) {
    character.luck = character.maxLuck
    log.push(`🍀 Новий день — удача відновлена (${character.luck}/${character.maxLuck}).`)
  }
  character.lastDailyTickAt = now
  return { log, died: false }
}
