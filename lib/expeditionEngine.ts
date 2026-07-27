import { Character, clampHungerThirst, clampInfection, clampMorale, statModifier } from './types'
import { getItem, ITEM_CATALOG } from './items'
import { rollD20, rollDice } from './dice'
import { resolveAttack, rollInfectionCheck, DEFAULT_DEFENSE } from './combat'
import {
  ExpeditionLevel, rollLoot, rollSearchLocation, SPECIAL_ENCOUNTER_CHANCE, rollSpecialEncounterType,
  rollRiskType, injuryDiceForLevel, traumaDiceForLevel, traumaMoraleLossForLevel, infectionAmountForLevel,
  illnessMoraleLossForLevel, illnessEnergyDrainForLevel, zombieStatsForLevel,
} from './expedition'
import { inventoryCapacity } from './inventory'
import { weaponProficiencyPenalty, trainWeaponProficiency } from './weaponProficiency'
import { XP_REWARDS } from './levels'
import { EnemyTypeDef, getEnemyType, rollAmbushEnemyType, SCREAMER_CALL_CHANCE } from './enemyTypes'

export type SearchResult = {
  log: string[]
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

function equippedArmorTotal(character: Character): number {
  let total = 0
  for (const itemId of Object.values(character.equipped)) {
    if (!itemId) continue
    const item = getItem(itemId)
    total += item?.armor ?? 0
  }
  return total
}

function bestWeapon(character: Character): { id: string; damageDice: string; statMod: number } {
  let best: { id: string; damageDice: string; statMod: number } | null = null
  let bestAvg = -1
  for (const stack of character.inventory) {
    const item = getItem(stack.itemId)
    if (!item || (item.type !== 'weapon_melee' && item.type !== 'weapon_ranged')) continue
    const avg = averageDice(item.damageDice ?? '1d4')
    if (avg > bestAvg) {
      bestAvg = avg
      const baseMod = statModifier(character.stats[item.statUsed ?? 'str'])
      best = { id: item.key, damageDice: item.damageDice ?? '1d4', statMod: baseMod + weaponProficiencyPenalty(character, item) }
    }
  }
  return best ?? { id: 'fists', damageDice: '1d2', statMod: statModifier(character.stats.str) }
}

function averageDice(dice: string): number {
  const m = /^(\d*)d(\d+)([+-]\d+)?$/i.exec(dice)
  if (!m) return 2
  const count = m[1] ? parseInt(m[1]) : 1
  const sides = parseInt(m[2])
  const bonus = m[3] ? parseInt(m[3]) : 0
  return count * ((sides + 1) / 2) + bonus
}

function applyDamage(character: Character, dmg: number, log: string[], cause: string): boolean {
  character.hp = Math.max(0, character.hp - dmg)
  log.push(`💥 ${character.name} втрачає ${dmg} ОЗ (${cause}). ОЗ: ${character.hp}/${character.maxHp}`)
  if (character.hp <= 0) {
    character.dead = true
    log.push(`☠️ ${character.name} гине: ${cause}.`)
    return true
  }
  return false
}

function fightOne(character: Character, level: ExpeditionLevel, enemyType: EnemyTypeDef, log: string[]): boolean {
  const base = zombieStatsForLevel(level.index)
  const weapon = bestWeapon(character)
  let enemyHp = enemyType.hpModifier(base.hp)
  const label = enemyType.key === 'mass' ? 'Зомбі' : `${enemyType.namePrefix} (${enemyType.flavor})`
  log.push(`${enemyType.emoji} ${label} напав! (ОЗ: ${enemyHp})`)

  const weaponItem = weapon.id === 'fists' ? undefined : getItem(weapon.id)
  let calledHorde = false

  for (let round = 1; round <= 20; round++) {
    const playerAttack = resolveAttack(weapon.statMod, enemyType.defense, weapon.damageDice)
    if (playerAttack.hit) {
      enemyHp -= playerAttack.damage
      log.push(`⚔️ Атака (${weapon.id === 'fists' ? 'голі руки' : weaponItem?.name}): ${playerAttack.critical ? 'КРИТ! ' : ''}${playerAttack.damage} шкоди. Залишилось ОЗ: ${Math.max(0, enemyHp)}`)
    } else {
      log.push(`⚔️ Промах (кидок ${playerAttack.attackRoll.total} проти захисту ${enemyType.defense}).`)
    }
    const profGain = trainWeaponProficiency(character, weaponItem)
    if (profGain) log.push(profGain)

    if (enemyHp <= 0) {
      character.xp += XP_REWARDS.combatWin
      log.push(`✅ ${label} знищено! (+${XP_REWARDS.combatWin} XP)`)
      return false
    }

    if (enemyType.special === 'call_horde' && !calledHorde && Math.random() < SCREAMER_CALL_CHANCE) {
      calledHorde = true
      log.push(`📢 Крикун кличе підмогу!`)
      const died = fightOne(character, level, getEnemyType('mass')!, log)
      if (died) return true
    }

    const enemyAttack = resolveAttack(enemyType.attackBonus, DEFAULT_DEFENSE + Math.floor(equippedArmorTotal(character) / 2), base.damageDice)
    if (enemyAttack.hit) {
      const died = applyDamage(character, enemyAttack.damage, log, `атака (${label})`)
      if (died) return true
      if (rollInfectionCheck(base.infectionChance)) {
        character.infection = clampInfection(character.infection + infectionAmountForLevel(level.index))
        log.push(`☣️ Укус заразив ${character.name}! Інфекція: ${character.infection}/100`)
      }
    } else {
      log.push(`${enemyType.emoji} Ворог промахнувся.`)
    }
  }
  return false
}

function fightZombie(character: Character, level: ExpeditionLevel, log: string[]): boolean {
  return fightOne(character, level, getEnemyType('mass')!, log)
}

function fightAmbush(character: Character, level: ExpeditionLevel, log: string[]): boolean {
  return fightOne(character, level, rollAmbushEnemyType(level.index), log)
}

function applyRisk(character: Character, level: ExpeditionLevel, log: string[]): boolean {
  const risk = rollRiskType()
  switch (risk) {
    case 'ambush':
      return fightAmbush(character, level, log)
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

export function performSearch(character: Character, level: ExpeditionLevel): SearchResult {
  const log: string[] = []

  character.hunger = clampHungerThirst(character.hunger - level.hungerCost)
  character.thirst = clampHungerThirst(character.thirst - level.thirstCost)

  const location = rollSearchLocation()
  log.push(`🔍 ${character.name} ${location}...`)

  if (Math.random() < SPECIAL_ENCOUNTER_CHANCE) {
    const type = rollSpecialEncounterType()
    if (type === 'weak_zombie') {
      const died = fightZombie(character, { ...level, index: Math.max(1, level.index - 1) }, log)
      if (died) return { log, died: true }
    } else if (type === 'friendly_npc') {
      log.push(`🤝 Зустрів дружнього вцілілого — обмінялись новинами, нічого не сталось.`)
    } else {
      log.push(`👀 Знайшов цікаве місце — там може бути додатковий лут.`)
      const loot = rollLoot(level.index)
      addToInventory(character, loot.itemKey, loot.quantity, log)
    }
  }

  const searchRoll = rollD20(statModifier(character.stats.per))
  const success = searchRoll.total >= level.dc

  if (success) {
    const xpGain = XP_REWARDS.expeditionByTier[level.index] ?? 5
    character.xp += xpGain
    log.push(`🎲 Пошук: ${searchRoll.total} проти СК ${level.dc} — успіх! (+${xpGain} XP)`)
    const loot = rollLoot(level.index)
    addToInventory(character, loot.itemKey, loot.quantity, log)
  } else {
    log.push(`🎲 Пошук: ${searchRoll.total} проти СК ${level.dc} — невдача.`)
    if (Math.random() < level.riskChance) {
      const died = applyRisk(character, level, log)
      if (died) return { log, died: true }
    }
  }

  if (character.hunger === 0 || character.thirst === 0) {
    const dmg = rollDice('1d4').total
    const died = applyDamage(character, dmg, log, character.hunger === 0 ? 'виснаження від голоду' : 'зневоднення')
    if (died) return { log, died: true }
  }

  return { log, died: false }
}

export const ITEM_LOOKUP = ITEM_CATALOG
