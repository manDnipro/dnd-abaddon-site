import { Character } from './types'

const WINDOW_MS = 4 * 60 * 60 * 1000
const DC_STEP_PER_USE = 4
const MAX_DC_BONUS = 20

/** Diminishing returns via the dice, not a payout table — everything in this game should come down
 *  to a roll, so repeated farming of the same 0-cooldown location doesn't flatly shrink the reward,
 *  it raises the DC of the SAME check each time within a rolling 4h window (first 2 visits at base
 *  difficulty, then +4 DC per additional visit, capped). The existing success/failure outcomes are
 *  untouched — a harder roll naturally fails more often, which already means less loot/reputation
 *  without inventing a second, non-dice mechanic on top. */
export function locationDcEscalation(character: Character, key: string): number {
  const now = Date.now()
  const uses = (character.locationYieldUses[key] ?? []).filter(t => now - t < WINDOW_MS)
  const priorCount = uses.length
  uses.push(now)
  character.locationYieldUses = { ...character.locationYieldUses, [key]: uses }

  const bonus = Math.max(0, priorCount - 1) * DC_STEP_PER_USE
  return Math.min(MAX_DC_BONUS, bonus)
}
