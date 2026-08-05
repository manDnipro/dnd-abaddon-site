import { Character, clampHungerThirst, clampMorale } from './types'
import { HUT_REGEN_PER_HOUR, HUT_MAX_CATCHUP_HOURS } from './hut'

const HOUR_MS = 60 * 60 * 1000

/** Lazy catch-up, same pattern as lib/dailyTick.ts's runDueDailyTicks — while inHut is true, every
 *  elapsed hour since the last tick heals +1 HP/hunger/thirst/morale (capped at max, and at
 *  HUT_MAX_CATCHUP_HOURS so an abandoned session doesn't grant unbounded free healing). Only runs
 *  once the hut is fully built; inHut can't be set true otherwise (enforced at the API layer). */
export function runDueHutTicks(character: Character): string[] {
  const log: string[] = []
  if (!character.inHut || character.dead) return log

  const now = Date.now()
  const hoursElapsed = Math.floor((now - character.lastHutTickAt) / HOUR_MS)
  if (hoursElapsed < 1) return log

  const hours = Math.min(hoursElapsed, HUT_MAX_CATCHUP_HOURS)
  const before = { hp: character.hp, hunger: character.hunger, thirst: character.thirst, morale: character.morale }
  character.hp = Math.min(character.maxHp, character.hp + HUT_REGEN_PER_HOUR * hours)
  character.hunger = clampHungerThirst(character.hunger + HUT_REGEN_PER_HOUR * hours)
  character.thirst = clampHungerThirst(character.thirst + HUT_REGEN_PER_HOUR * hours)
  character.morale = clampMorale(character.morale + HUT_REGEN_PER_HOUR * hours)
  character.lastHutTickAt = now

  const gained = character.hp - before.hp + (character.hunger - before.hunger) + (character.thirst - before.thirst) + (character.morale - before.morale)
  if (gained > 0) {
    log.push(`🏠 Відпочинок у хібарі (${hours} год): ОЗ ${before.hp}→${character.hp}, голод ${before.hunger}→${character.hunger}, спрага ${before.thirst}→${character.thirst}, мораль ${before.morale}→${character.morale}.`)
  }
  return log
}
