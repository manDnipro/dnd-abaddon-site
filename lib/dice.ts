export interface RollResult {
  expression: string
  rolls: number[]
  modifier: number
  total: number
  sides: number
}

const DICE_PATTERN = /^(\d*)d(\d+)([+-]\d+)?$/i

function rollOne(sides: number): number {
  return Math.floor(Math.random() * sides) + 1
}

export function rollDice(expression: string): RollResult {
  const trimmed = expression.trim().replace(/\s+/g, '')
  const match = DICE_PATTERN.exec(trimmed)
  if (!match) throw new Error(`Невірний формат кидка: "${expression}"`)
  const count = match[1] ? parseInt(match[1], 10) : 1
  const sides = parseInt(match[2], 10)
  const modifier = match[3] ? parseInt(match[3], 10) : 0
  const rolls = Array.from({ length: count }, () => rollOne(sides))
  const total = rolls.reduce((s, r) => s + r, 0) + modifier
  return { expression: trimmed, rolls, modifier, total, sides }
}

/** The general "check" roll — always a single die (unlike rollDice, which can be a pool/damage
 *  expression) — sized per lib/statLevels.ts's tiers so a high enough stat moves a character off
 *  d20 onto d30/d40/d50 for THAT specific check. */
export function rollCheck(sides: number, modifier = 0): RollResult {
  const roll = rollOne(sides)
  return { expression: `1d${sides}${modifier >= 0 ? '+' : ''}${modifier}`, rolls: [roll], modifier, total: roll + modifier, sides }
}

export function rollD20(modifier = 0): RollResult {
  return rollCheck(20, modifier)
}

// Natural max/min on whatever die was actually rolled — not a fixed "20"/"1" — so crit detection
// stays correct once a check moves to a bigger die. Kept CRIT_SUCCESS/CRIT_FAIL around only for the
// handful of spots that explicitly want the classic d20 values (e.g. a fixed d20 sub-roll unrelated
// to a character stat).
export function isCritSuccess(roll: RollResult): boolean { return roll.rolls[0] === roll.sides }
export function isCritFail(roll: RollResult): boolean { return roll.rolls[0] === 1 }

export const CRIT_SUCCESS = 20
export const CRIT_FAIL = 1
