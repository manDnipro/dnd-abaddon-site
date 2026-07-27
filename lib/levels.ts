export const MAX_LEVEL = 100
const XP_BASE = 30
const XP_PER_LEVEL = 2
function xpToNext(level: number): number { return XP_BASE + XP_PER_LEVEL * level }

const LEVEL_THRESHOLDS: number[] = (() => {
  const thresholds = [0]
  for (let level = 1; level < MAX_LEVEL; level++) thresholds.push(thresholds[thresholds.length - 1] + xpToNext(level))
  return thresholds
})()

export function levelFromXp(xp: number): number {
  let level = 1
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1
    else break
  }
  return Math.min(MAX_LEVEL, level)
}

export interface XpProgress { level: number; xpIntoLevel: number; xpForNext: number | null }
export function xpProgress(xp: number): XpProgress {
  const level = levelFromXp(xp)
  if (level >= MAX_LEVEL) return { level, xpIntoLevel: xp - LEVEL_THRESHOLDS[MAX_LEVEL - 1], xpForNext: null }
  const currentThreshold = LEVEL_THRESHOLDS[level - 1]
  const nextThreshold = LEVEL_THRESHOLDS[level]
  return { level, xpIntoLevel: xp - currentThreshold, xpForNext: nextThreshold - currentThreshold }
}

export function levelTitle(level: number): string {
  return level >= MAX_LEVEL ? '🌟 Легенда ABADDON' : `Рівень ${level}`
}

export const XP_REWARDS = {
  expeditionByTier: { 1: 5, 2: 8, 3: 12, 4: 18 } as Record<number, number>,
  combatWin: 8,
  craft: 4,
  campJob: 6,
  npcTrade: 6,
  mission: 15,
  hunt: 5,
}
