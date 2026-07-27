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

export type SearchResult = {
  log: string[]
  died: boolean
}

function addToInventory(character: Character, itemId: string, qty: number, log: string[]) {
  if (character.inventory.some(s => s.itemId === itemId) || character.inventory.length < inventoryCapacity(character)) {
    const stack = character.inventory.find(s => s.itemId === itemId)
    if (stack) stack.qty += qty
    else character.inventory.push({ itemId, qty })
    const item = getItem(itemId)
    log.push(`🎒 Знайдено: ${item?.name ?? itemId} ×${qty}`)
  } else {
    log.push(`🎒 Інвентар повний — знахідку довелось залишити.`)
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
      best = { id: item.key, damageDice: item.damageDice ?? '1d4', statMod: statModifier(character.stats[item.statUsed ?? 'str']) }
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

function fightZombie(character: Character, level: ExpeditionLevel, log: string[]): boolean {
  const zombie = zombieStatsForLevel(level.index)
  const weapon = bestWeapon(character)
  let zombieHp = zombie.hp
  log.push(`🧟 Зомбі напав! (ОЗ зомбі: ${zombieHp})`)

  for (let round = 1; round <= 20; round++) {
    const playerAttack = resolveAttack(weapon.statMod, DEFAULT_DEFENSE, weapon.damageDice)
    if (playerAttack.hit) {
      zombieHp -= playerAttack.damage
      log.push(`⚔️ Атака (${weapon.id === 'fists' ? 'голі руки' : getItem(weapon.id)?.name}): ${playerAttack.critical ? 'КРИТ! ' : ''}${playerAttack.damage} шкоди зомбі. Залишилось ОЗ зомбі: ${Math.max(0, zombieHp)}`)
    } else {
      log.push(`⚔️ Промах по зомбі (кидок ${playerAttack.attackRoll.total}).`)
    }
    if (zombieHp <= 0) {
      log.push(`✅ Зомбі знищено!`)
      return false
    }

    const zombieAttack = resolveAttack(0, DEFAULT_DEFENSE + Math.floor(equippedArmorTotal(character) / 2), zombie.damageDice)
    if (zombieAttack.hit) {
      const died = applyDamage(character, zombieAttack.damage, log, 'укус зомбі')
      if (died) return true
      if (rollInfectionCheck(zombie.infectionChance)) {
        character.infection = clampInfection(character.infection + infectionAmountForLevel(level.index))
        log.push(`☣️ Укус заразив ${character.name}! Інфекція: ${character.infection}/100`)
      }
    } else {
      log.push(`🧟 Зомбі промахнувся.`)
    }
  }
  return false
}

function applyRisk(character: Character, level: ExpeditionLevel, log: string[]): boolean {
  const risk = rollRiskType()
  switch (risk) {
    case 'ambush':
      return fightZombie(character, level, log)
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
    log.push(`🎲 Пошук: ${searchRoll.total} проти СК ${level.dc} — успіх!`)
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
