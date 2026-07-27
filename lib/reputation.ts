export type ReputationTierKey = 'outcast' | 'stranger' | 'regular' | 'trusted' | 'hero'

export interface ReputationTierInfo { key: ReputationTierKey; label: string; minReputation: number }

export const REPUTATION_TIERS: ReputationTierInfo[] = [
  { key: 'outcast', label: '🔴 Вигнанець', minReputation: 0 },
  { key: 'stranger', label: '🟠 Чужий', minReputation: 20 },
  { key: 'regular', label: '🟡 Свій', minReputation: 40 },
  { key: 'trusted', label: '🟢 Довірений', minReputation: 60 },
  { key: 'hero', label: '🔵 Герой табору', minReputation: 80 },
]

export function reputationTier(reputation: number): ReputationTierInfo {
  let current = REPUTATION_TIERS[0]
  for (const tier of REPUTATION_TIERS) if (reputation >= tier.minReputation) current = tier
  return current
}

export const REST_HEAL_DICE: Record<ReputationTierKey, string> = {
  outcast: '1d4', stranger: '1d6', regular: '1d6', trusted: '1d8', hero: '1d10',
}

export const REST_HUNGER_COST = 8
export const REST_THIRST_COST = 8
