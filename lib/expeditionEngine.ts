import { Character, clampHungerThirst, clampInfection, clampMorale, statModifier } from './types'
import { getItem, ITEM_CATALOG } from './items'
import { CRIT_FAIL, rollD20, rollDice } from './dice'
import {
  ExpeditionLevel, rollLoot, rollSearchLocation, SPECIAL_ENCOUNTER_CHANCE, rollSpecialEncounterType,
  rollRiskType, injuryDiceForLevel, traumaDiceForLevel, traumaMoraleLossForLevel, infectionAmountForLevel,
  illnessMoraleLossForLevel, illnessEnergyDrainForLevel,
  fatigueThreshold, fatigueExcessCount, fatigueSaveDC, fatigueInjuryDice, fatigueIllnessAmount,
  rollFatigueEffect, FATIGUE_WINDOW_MINUTES, rollInterestingLocation, rollFriendlyNpcTemplate,
  rollFriendlyNpcLine, rollZombieIntroLine,
} from './expedition'
import { inventoryCapacity } from './inventory'
import { XP_REWARDS, levelFromXp } from './levels'
import { getEnemyType, rollAmbushEnemyType } from './enemyTypes'
import { applyDamage, startCombatState } from './combatEngine'

export type SearchResult = {
  log: string[]
  images: string[]
  died: boolean
}

// Loot never vanishes — a full inventory overflows into the personal camp storage box instead,
// matching the bot's addItemWithOverflow behavior.
function addToInventory(character: Character, itemId: string, qty: number, log: string[]) {
  const item = getItem(itemId)
  const alreadyCarried = character.inventory.some(s => s.itemId === itemId)
  if (alreadyCarried || character.inventory.length < inventoryCapacity(character)) {
    const stack = character.inventory.find(s => s.itemId === itemId)
    if (stack) stack.qty += qty
    else character.inventory.push({ itemId, qty })
    log.push(`🎒 Знайдено: ${item?.name ?? itemId} ×${qty}`)
  } else {
    const boxStack = character.storageBox.find(s => s.itemId === itemId)
    if (boxStack) boxStack.qty += qty
    else character.storageBox.push({ itemId, qty })
    log.push(`🎒 Знайдено: ${item?.name ?? itemId} ×${qty} — інвентар повний, відправлено в особистий ящик.`)
  }
}

/** Non-combat risk outcomes (ambush is handled separately — it opens interactive combat instead). */
function applyNonCombatRisk(character: Character, level: ExpeditionLevel, log: string[], risk: 'injury' | 'infection' | 'illness' | 'trauma'): boolean {
  switch (risk) {
    case 'injury': {
      const dmg = rollDice(injuryDiceForLevel(level.index)).total
      return applyDamage(character, dmg, log, 'поранення на вилазці')
    }
    case 'infection': {
      const amount = infectionAmountForLevel(level.index)
      character.infection = clampInfection(character.infection + amount)
      log.push(`☣️ ${character.name} заразився! Інфекція: ${character.infection}/100`)
      return false
    }
    case 'illness': {
      character.morale = clampMorale(character.morale - illnessMoraleLossForLevel(level.index))
      character.hunger = clampHungerThirst(character.hunger - illnessEnergyDrainForLevel(level.index))
      log.push(`🤒 ${character.name} захворів: мораль -${illnessMoraleLossForLevel(level.index)}, голод -${illnessEnergyDrainForLevel(level.index)}.`)
      return false
    }
    case 'trauma': {
      const dmg = rollDice(traumaDiceForLevel(level.index)).total
      character.morale = clampMorale(character.morale - traumaMoraleLossForLevel(level.index))
      log.push(`💢 Важка травма: мораль -${traumaMoraleLossForLevel(level.index)}.`)
      return applyDamage(character, dmg, log, 'важка травма')
    }
  }
}

const NPC_PORTRAIT_COUNTS: Record<'male' | 'female', number> = { male: 17, female: 9 }
function randomNpcPortrait(gender?: 'male' | 'female'): string {
  const g = gender ?? (Math.random() < 0.5 ? 'male' : 'female')
  const n = 1 + Math.floor(Math.random() * NPC_PORTRAIT_COUNTS[g])
  return `/npc/${g}/portrait_${n}.png`
}

/** Fatigue save + starvation damage — runs at the end of a search attempt that didn't open combat,
 *  and again once a fight (that opened instead) is won or fled from, since it was skipped meanwhile. */
export function runPostSearchChecks(character: Character, level: ExpeditionLevel, log: string[]): { died: boolean } {
  const charLevel = levelFromXp(character.xp)
  // recentExpeditionTimestamps already includes the current expedition's own start timestamp
  // (pushed by /api/expedition/start before this search runs), so the count of PRIOR expeditions
  // in the window is one less than the raw array length.
  const priorCount = Math.max(0, character.recentExpeditionTimestamps.filter(t => Date.now() - t < FATIGUE_WINDOW_MINUTES * 60_000).length - 1)
  if (priorCount >= fatigueThreshold(charLevel)) {
    const excessCount = fatigueExcessCount(priorCount, charLevel)
    const saveDC = fatigueSaveDC(excessCount)
    const saveRoll = rollD20(statModifier(character.stats.end))
    const resisted = saveRoll.total >= saveDC
    if (resisted) {
      log.push(`💪 Втома накопичується (${priorCount + 1}-ма вилазка за ${FATIGUE_WINDOW_MINUTES} хв), але організм встояв: ${saveRoll.total} проти СК ${saveDC}.`)
    } else {
      log.push(`😩 Виснаження бере своє (${priorCount + 1}-ма вилазка за ${FATIGUE_WINDOW_MINUTES} хв): ${saveRoll.total} проти СК ${saveDC} — не вдалось встояти!`)
      if (rollFatigueEffect() === 'injury') {
        const dmg = rollDice(fatigueInjuryDice(excessCount)).total
        if (applyDamage(character, dmg, log, 'виснаження')) return { died: true }
      } else {
        const amount = fatigueIllnessAmount(excessCount)
        character.morale = clampMorale(character.morale - amount)
        character.hunger = clampHungerThirst(character.hunger - amount)
        character.thirst = clampHungerThirst(character.thirst - amount)
        log.push(`🤢 Легка хвороба від виснаження: мораль -${amount}, додатково голод/спрага -${amount}.`)
      }
    }
  }

  if (character.hunger === 0 || character.thirst === 0) {
    const dmg = rollDice('1d4').total
    if (applyDamage(character, dmg, log, character.hunger === 0 ? 'виснаження від голоду' : 'зневоднення')) return { died: true }
  }

  return { died: false }
}

export function performSearch(character: Character, level: ExpeditionLevel, opts?: { useLuck?: boolean }): SearchResult {
  const log: string[] = []
  const images: string[] = []

  character.hunger = clampHungerThirst(character.hunger - level.hungerCost)
  character.thirst = clampHungerThirst(character.thirst - level.thirstCost)

  const location = rollSearchLocation()
  log.push(`🔍 ${character.name} ${location}...`)

  if (Math.random() < SPECIAL_ENCOUNTER_CHANCE) {
    const type = rollSpecialEncounterType()
    if (type === 'weak_zombie') {
      const enemyType = getEnemyType('mass')!
      character.combat = startCombatState(enemyType, level.index, true)
      log.push(`${enemyType.emoji} ${character.combat.enemyLabel} ${rollZombieIntroLine()}! (ОЗ: ${character.combat.hp})`)
      if (character.combat.image) images.push(character.combat.image)
      return { log, images, died: false }
    } else if (type === 'friendly_npc') {
      const npc = rollFriendlyNpcTemplate()
      images.push(randomNpcPortrait(npc.gender))
      character.morale = clampMorale(character.morale + 5)
      log.push(`🤝 Назустріч трапляється ${npc.name.toLowerCase()} — ${rollFriendlyNpcLine()}. Коротка розмова піднімає настрій (мораль +5).`)
    } else {
      const spot = rollInterestingLocation()
      log.push(`👀 На очі трапляється ${spot} — варто перевірити.`)
      const loot = rollLoot(level.index)
      addToInventory(character, loot.itemKey, loot.quantity, log)
    }
  }

  let searchRoll = rollD20(statModifier(character.stats.per))
  let success = searchRoll.total >= level.dc
  // A natural 1 on the un-rerolled roll is a critical fumble regardless of the reroll below — the
  // danger dial always bites on the worst possible outcome, luck or no luck.
  const criticalFumble = searchRoll.rolls[0] === CRIT_FAIL

  if (!success && opts?.useLuck && character.luck > 0) {
    character.luck -= 1
    const rerolled = rollD20(statModifier(character.stats.per))
    log.push(`🍀 Не пощастило: ${searchRoll.total} проти СК ${level.dc} — витрачено очко удачі (${character.luck}/${character.maxLuck}), перекидаємо!`)
    searchRoll = rerolled
    success = searchRoll.total >= level.dc
  }

  if (success) {
    const xpGain = XP_REWARDS.expeditionByTier[level.index] ?? 5
    character.xp += xpGain
    log.push(`🎲 Пошук: ${searchRoll.total} проти СК ${level.dc} — успіх! (+${xpGain} XP)`)
    const loot = rollLoot(level.index)
    addToInventory(character, loot.itemKey, loot.quantity, log)

    // Danger dial: even a clean success on a high-risk location carries a small chance that
    // something still goes wrong nearby — scaled off the same per-level riskChance used for
    // failures, just much rarer, and never an ambush (that would undercut the success itself).
    if (Math.random() < level.riskChance * 0.2) {
      const risk = Math.random() < 0.5 ? 'infection' : 'illness'
      log.push(`⚠️ Втім, щось тут не так...`)
      applyNonCombatRisk(character, level, log, risk)
    }
  } else {
    log.push(`🎲 Пошук: ${searchRoll.total} проти СК ${level.dc} — невдача.`)
    if (criticalFumble || Math.random() < level.riskChance) {
      if (criticalFumble) log.push(`💢 Критичний провал (натуральна 1) — гірше нікуди.`)
      const risk = rollRiskType()
      if (risk === 'ambush') {
        const enemyType = rollAmbushEnemyType(level.index)
        character.combat = startCombatState(enemyType, level.index, false)
        log.push(`⚠️ ${enemyType.emoji} ${character.combat.enemyLabel} ${rollZombieIntroLine()}! (ОЗ: ${character.combat.hp})`)
        if (character.combat.image) images.push(character.combat.image)
        return { log, images, died: false }
      }
      if (applyNonCombatRisk(character, level, log, risk)) return { log, images, died: true }
    }
  }

  const tail = runPostSearchChecks(character, level, log)
  if (tail.died) return { log, images, died: true }
  return { log, images, died: false }
}

export const ITEM_LOOKUP = ITEM_CATALOG
