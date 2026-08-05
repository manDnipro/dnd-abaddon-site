// Trained stats no longer cap at 10 — every 10 points past that moves a character onto a bigger
// die for checks that use that specific stat (d20 -> d30 -> d40 -> d50), matching
// lib/statTraining.ts's new MAX_TRAINED_STAT. DCs scale proportionally with the die (see
// scaleDcForSides) so a stronger character isn't just flatly more likely to succeed than the
// designed baseline — they're rolling bigger, swingier dice at correspondingly bigger targets.
const TIER_SIZE = 10
const BASE_DIE = 20
const DIE_STEP = 10

export function dieSizeForStat(statValue: number): number {
  const tier = Math.max(0, Math.floor((statValue - 1) / TIER_SIZE))
  return BASE_DIE + tier * DIE_STEP
}

export function scaleDcForSides(baseDc: number, sides: number): number {
  return Math.round(baseDc * (sides / BASE_DIE))
}
