import { Character, statModifier } from './types'
import { isCritFail, isCritSuccess, rollCheck, RollResult } from './dice'
import { rollLoot } from './expedition'
import { dieSizeForStat, scaleDcForSides } from './statLevels'

export function tradeNegotiationDC(tradeLevel: number): number {
  return 10 + (tradeLevel - 1) * 2
}

export function baseRequiredRatio(tradeLevel: number): number {
  return 1.05 + (tradeLevel - 1) * 0.05
}

export const NPC_STOCK_ROLL_COUNT = 6

export interface TradeStockEntry { itemKey: string; quantity: number }

export function generateNpcStock(tradeLevel: number): TradeStockEntry[] {
  const byKey = new Map<string, number>()
  for (let i = 0; i < NPC_STOCK_ROLL_COUNT; i++) {
    const loot = rollLoot(tradeLevel)
    byKey.set(loot.itemKey, (byKey.get(loot.itemKey) ?? 0) + loot.quantity)
  }
  return Array.from(byKey.entries()).map(([itemKey, quantity]) => ({ itemKey, quantity }))
}

export interface NegotiationResult {
  roll: RollResult
  trustBonus: number
  reputationBonus: number
  totalRoll: number
  dc: number
  success: boolean
  critical: boolean
  fumble: boolean
  requiredRatio: number
}

export function resolveNegotiationRoll(character: Character, tradeLevel: number, trust: number): NegotiationResult {
  const sides = dieSizeForStat(character.stats.cha)
  const roll = rollCheck(sides, statModifier(character.stats.cha))
  const trustBonus = Math.floor(trust / 5)
  const reputationBonus = Math.floor((character.reputation - 50) / 20)
  const totalRoll = roll.total + trustBonus + reputationBonus
  const dc = scaleDcForSides(tradeNegotiationDC(tradeLevel), sides)
  const critical = isCritSuccess(roll)
  const fumble = isCritFail(roll)
  const success = critical || (!fumble && totalRoll >= dc)

  let requiredRatio = baseRequiredRatio(tradeLevel)
  if (critical) requiredRatio -= 0.3
  else if (success) requiredRatio -= 0.15
  else if (fumble) requiredRatio += 0.25
  else requiredRatio += 0.1

  return { roll, trustBonus, reputationBonus, totalRoll, dc, success, critical, fumble, requiredRatio: Math.max(0.5, requiredRatio) }
}

export function clampTrust(value: number): number {
  return Math.max(-20, Math.min(50, value))
}
