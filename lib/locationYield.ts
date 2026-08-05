import { Character } from './types'

const WINDOW_MS = 4 * 60 * 60 * 1000
const DC_STEP_PER_USE = 4
// Camp checks always roll a plain d20 (unlike expeditions/combat/missions, which scale die size with
// stat tier) — so the escalated DC can never climb past the die's own max, or repeat farming would
// make success mathematically impossible rather than just increasingly unlikely.
const MAX_DC = 20

/** Diminishing returns via the dice, not a payout table — repeated farming of the same 0-cooldown
 *  camp location raises the DC of the SAME plain-d20 check within a rolling 4h window (first 2
 *  visits at base difficulty, then +4 DC per additional visit, capped at 20). The existing
 *  success/failure outcomes are untouched — a harder roll naturally fails more often, which already
 *  means less loot/reputation without inventing a second, non-dice mechanic on top. */
export function escalatedLocationDC(character: Character, key: string, baseDC: number): number {
  const now = Date.now()
  const uses = (character.locationYieldUses[key] ?? []).filter(t => now - t < WINDOW_MS)
  const priorCount = uses.length
  uses.push(now)
  character.locationYieldUses = { ...character.locationYieldUses, [key]: uses }

  const bonus = Math.max(0, priorCount - 1) * DC_STEP_PER_USE
  return Math.min(MAX_DC, baseDC + bonus)
}
