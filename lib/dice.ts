export interface RollResult {
  expression: string
  rolls: number[]
  modifier: number
  total: number
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
  return { expression: trimmed, rolls, modifier, total }
}

export function rollD20(modifier = 0): RollResult {
  const roll = rollOne(20)
  return { expression: `1d20${modifier >= 0 ? '+' : ''}${modifier}`, rolls: [roll], modifier, total: roll + modifier }
}

export const CRIT_SUCCESS = 20
export const CRIT_FAIL = 1
