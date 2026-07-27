import { rollD20, rollDice, CRIT_FAIL, CRIT_SUCCESS, RollResult } from './dice'

export const DEFAULT_DEFENSE = 10

export interface AttackOutcome {
  attackRoll: RollResult
  defenseTarget: number
  hit: boolean
  critical: boolean
  fumble: boolean
  damageRoll?: RollResult
  damage: number
}

export function resolveAttack(attackerStatMod: number, defenseTarget: number, damageDice: string): AttackOutcome {
  const attackRoll = rollD20(attackerStatMod)
  const natural = attackRoll.rolls[0]
  const fumble = natural === CRIT_FAIL
  const critical = natural === CRIT_SUCCESS
  const hit = !fumble && (critical || attackRoll.total >= defenseTarget)

  if (!hit) return { attackRoll, defenseTarget, hit: false, critical: false, fumble, damage: 0 }

  const damageRoll = rollDice(damageDice)
  const damage = critical ? damageRoll.total * 2 : damageRoll.total
  return { attackRoll, defenseTarget, hit: true, critical, fumble: false, damageRoll, damage }
}

export function rollInfectionCheck(infectionChancePercent: number): boolean {
  if (infectionChancePercent <= 0) return false
  return Math.random() * 100 < infectionChancePercent
}
