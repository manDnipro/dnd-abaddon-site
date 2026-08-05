import { Character, clampReputation, statModifier } from './types'
import { rollCheck } from './dice'
import { dieSizeForStat, scaleDcForSides } from './statLevels'
import { rollLoot } from './expedition'
import { getItem } from './items'
import { addStack } from './stacks'
import { XP_REWARDS } from './levels'
import { CAMP_JOB_CHANCE, CAMP_JOB_DC, CAMP_JOB_REPUTATION_GAIN, CAMP_JOB_REPUTATION_LOSS, rollJobFlavor, rollJobStat } from './campJob'
import { STAT_LABELS } from './types'

export interface CampJobOutcome { log: string[]; image: string | null }

/** Rolled on every return to camp (auto or manual) — the bot's camp leader occasionally has a small job. */
export function tryCampJob(character: Character): CampJobOutcome {
  if (Math.random() >= CAMP_JOB_CHANCE) return { log: [], image: null }

  const flavor = rollJobFlavor()
  const stat = rollJobStat()
  const sides = dieSizeForStat(character.stats[stat])
  const dc = scaleDcForSides(CAMP_JOB_DC, sides)
  const roll = rollCheck(sides, statModifier(character.stats[stat]))
  const log = [`👴 Голова табору просить ${flavor}. Перевірка ${STAT_LABELS[stat]}: ${roll.total} проти СК ${dc}.`]

  if (roll.total >= dc) {
    character.reputation = clampReputation(character.reputation + CAMP_JOB_REPUTATION_GAIN)
    character.xp += XP_REWARDS.campJob
    if (Math.random() < 0.5) {
      character.hp = character.maxHp
      character.hunger = 100
      character.thirst = 100
      log.push(`✅ Впорався(-лась)! Репутація +${CAMP_JOB_REPUTATION_GAIN}, а голова табору дозволив(-ла) повністю відпочити.`)
    } else {
      const loot = rollLoot(1)
      addStack(character.inventory, loot.itemKey, loot.quantity)
      log.push(`✅ Впорався(-лась)! Репутація +${CAMP_JOB_REPUTATION_GAIN}, і отримано: ${getItem(loot.itemKey)?.name ?? loot.itemKey} ×${loot.quantity}.`)
    }
  } else {
    character.reputation = clampReputation(character.reputation - CAMP_JOB_REPUTATION_LOSS)
    log.push(`❌ Не впорався(-лась). Репутація -${CAMP_JOB_REPUTATION_LOSS}.`)
  }

  return { log, image: '/camp/camp-leader.png' }
}
