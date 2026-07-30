import { Character, CombatState, clampInfection, statModifier } from './types'
import { getItem, ItemDefinition } from './items'
import { resolveAttack, rollInfectionCheck, DEFAULT_DEFENSE } from './combat'
import { rollDice } from './dice'
import { EnemyTypeDef, SCREAMER_CALL_CHANCE } from './enemyTypes'
import { zombieStatsForLevel } from './expedition'
import { ENEMY_IMAGES } from './enemyImages'
import { weaponProficiencyPenalty, trainWeaponProficiency } from './weaponProficiency'
import { getDurability, isBroken, wearWeaponOnUse, wearArmorOnHit, PROTECTIVE_SLOTS } from './durability'
import { XP_REWARDS } from './levels'
import { infectionAmountForLevel } from './expedition'

function averageDice(dice: string): number {
  const m = /^(\d*)d(\d+)([+-]\d+)?$/i.exec(dice)
  if (!m) return 2
  const count = m[1] ? parseInt(m[1]) : 1
  const sides = parseInt(m[2])
  const bonus = m[3] ? parseInt(m[3]) : 0
  return count * ((sides + 1) / 2) + bonus
}

export function bestWeapon(character: Character): { id: string; damageDice: string; statMod: number } {
  let best: { id: string; damageDice: string; statMod: number } | null = null
  let bestAvg = -1
  for (const stack of character.inventory) {
    const item = getItem(stack.itemId)
    if (!item || (item.type !== 'weapon_melee' && item.type !== 'weapon_ranged')) continue
    if (isBroken(getDurability(character, item.key))) continue
    const avg = averageDice(item.damageDice ?? '1d4')
    if (avg > bestAvg) {
      bestAvg = avg
      const baseMod = statModifier(character.stats[item.statUsed ?? 'str'])
      best = { id: item.key, damageDice: item.damageDice ?? '1d4', statMod: baseMod + weaponProficiencyPenalty(character, item) }
    }
  }
  return best ?? { id: 'fists', damageDice: '1d2', statMod: statModifier(character.stats.str) }
}

export function equippedArmorTotal(character: Character): number {
  let total = 0
  for (const slot of PROTECTIVE_SLOTS) {
    const itemId = character.equipped[slot]
    if (!itemId || isBroken(getDurability(character, itemId))) continue
    const item = getItem(itemId)
    total += item?.armor ?? 0
  }
  return total
}

export function applyDamage(character: Character, dmg: number, log: string[], cause: string): boolean {
  character.hp = Math.max(0, character.hp - dmg)
  log.push(`💥 ${character.name} втрачає ${dmg} ОЗ (${cause}). ОЗ: ${character.hp}/${character.maxHp}`)
  if (character.hp <= 0) {
    character.dead = true
    log.push(`☠️ ${character.name} гине: ${cause}.`)
    return true
  }
  return false
}

export function startCombatState(enemyType: EnemyTypeDef, levelIndex: number, weakened: boolean): CombatState {
  const statsLevel = weakened ? Math.max(1, levelIndex - 1) : levelIndex
  const base = zombieStatsForLevel(statsLevel)
  const hp = Math.max(4, enemyType.hpModifier(weakened ? base.hp - 2 : base.hp))
  return {
    enemyKey: enemyType.key,
    enemyLabel: enemyType.key === 'mass' ? 'Зомбі' : `${enemyType.namePrefix} (${enemyType.flavor})`,
    enemyEmoji: enemyType.emoji,
    image: ENEMY_IMAGES[enemyType.key] ?? null,
    hp, maxHp: hp,
    defense: enemyType.defense,
    attackBonus: enemyType.attackBonus,
    damageDice: base.damageDice,
    infectionChance: weakened ? Math.max(5, base.infectionChance - 10) : base.infectionChance,
    levelIndex,
    special: enemyType.special,
    hordeCalled: false,
  }
}

export interface AttackRoundResult { log: string[]; enemyDied: boolean; hit: boolean }

/** Resolves the player's own attack this round (weapon wear + proficiency growth included). */
export function resolvePlayerAttack(character: Character, combat: CombatState, sneak: boolean): AttackRoundResult {
  const log: string[] = []
  const weapon = bestWeapon(character)
  const weaponItem: ItemDefinition | undefined = weapon.id === 'fists' ? undefined : getItem(weapon.id)
  const weaponName = weapon.id === 'fists' ? 'голі руки' : weaponItem?.name ?? weapon.id

  const attack = resolveAttack(weapon.statMod, sneak ? combat.defense - 4 : combat.defense, weapon.damageDice)
  let damage = attack.damage
  if (attack.hit && sneak) damage *= 2

  if (attack.hit) {
    combat.hp = Math.max(0, combat.hp - damage)
    log.push(sneak
      ? `🗡️ Скритна атака (${weaponName}): ${attack.critical ? 'КРИТ! ' : ''}${damage} шкоди! Залишилось ОЗ: ${combat.hp}/${combat.maxHp}`
      : `⚔️ Атака (${weaponName}): ${attack.critical ? 'КРИТ! ' : ''}${damage} шкоди. Залишилось ОЗ: ${combat.hp}/${combat.maxHp}`)
  } else {
    log.push(sneak
      ? `🤫 Не вдалось підкрастися непоміченим — ворог насторожі.`
      : `⚔️ Промах (кидок ${attack.attackRoll.total} проти захисту ${combat.defense}).`)
  }

  if (weapon.id !== 'fists') {
    wearWeaponOnUse(character, weapon.id)
    if (isBroken(getDurability(character, weapon.id))) log.push(`🔧 ${weaponName} зламалась від зносу!`)
  }
  const profGain = trainWeaponProficiency(character, weaponItem, attack.hit)
  if (profGain) log.push(profGain)

  if (combat.hp <= 0) {
    character.xp += XP_REWARDS.combatWin
    character.zombiesKilled += 1
    log.push(`✅ ${combat.enemyLabel} знищено! (+${XP_REWARDS.combatWin} XP)`)
    return { log, enemyDied: true, hit: attack.hit }
  }

  if (combat.special === 'call_horde' && !combat.hordeCalled && Math.random() < SCREAMER_CALL_CHANCE) {
    combat.hordeCalled = true
    const reinforcement = Math.round(combat.maxHp * 0.5)
    combat.maxHp += reinforcement
    combat.hp += reinforcement
    log.push(`📢 Крикун кличе підмогу! До бою приєднується орда (+${reinforcement} ОЗ ворога).`)
  }

  return { log, enemyDied: false, hit: attack.hit }
}

export interface EnemyRoundResult { log: string[]; playerDied: boolean }

const SPRINTER_FLURRY_CHANCE = 0.35

/** opts.bonus/opts.cause let callers make the enemy's counterattack sharper when the player made a
 *  mistake (missed swing, botched stealth, failed flee) — the enemy reacts to the opening, not just
 *  swings on a fixed schedule. allowFlurry gates the sprinter's chance at a second, immediate strike
 *  (guarded so it can only trigger once, not recursively). */
export function resolveEnemyAttack(character: Character, combat: CombatState, opts?: { bonus?: number; cause?: string }, allowFlurry = true): EnemyRoundResult {
  const log: string[] = []
  const armor = equippedArmorTotal(character)
  const bonus = opts?.bonus ?? 0
  const attack = resolveAttack(combat.attackBonus + bonus, DEFAULT_DEFENSE + Math.floor(armor / 2), combat.damageDice)
  const verb = opts?.cause ? `${opts.cause} — контратака` : 'атака'
  if (attack.hit) {
    wearArmorOnHit(character)
    const died = applyDamage(character, attack.damage, log, `${verb} (${combat.enemyLabel})`)
    if (died) return { log, playerDied: true }
    if (rollInfectionCheck(combat.infectionChance)) {
      character.infection = clampInfection(character.infection + infectionAmountForLevel(combat.levelIndex))
      log.push(`☣️ Укус заразив ${character.name}! Інфекція: ${character.infection}/100`)
    }
  } else {
    log.push(`${combat.enemyEmoji} ${combat.enemyLabel} промахнувся${opts?.cause ? ' у контратаці' : ''}.`)
  }

  if (allowFlurry && combat.enemyKey === 'sprinter' && character.hp > 0 && Math.random() < SPRINTER_FLURRY_CHANCE) {
    log.push(`⚡ ${combat.enemyLabel} блискавично б'є вдруге!`)
    const second = resolveEnemyAttack(character, combat, undefined, false)
    log.push(...second.log)
    if (second.playerDied) return { log, playerDied: true }
  }

  return { log, playerDied: false }
}
