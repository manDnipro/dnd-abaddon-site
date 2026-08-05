import { Character, StatKey, STAT_LABELS, maxHpForEndurance } from './types'

// Was 10 — raised 4x so a stat can climb through all four die tiers (d20/d30/d40/d50, see
// lib/statLevels.ts) instead of topping out right as the system starts to get interesting.
// Growth odds (GROWTH_CHANCE_ON_SUCCESS/FAILURE below) are unchanged — reaching 40 is meant to take
// a real stretch of active play, not a single session.
export const MAX_TRAINED_STAT = 40
const STAT_EMOJI: Record<StatKey, string> = { str: '💪', agi: '🤸', end: '🛡️', per: '👁️', int: '🧠', cha: '✨' }

// Bot ties stat growth to persisted practice/win-streak counters (practice_count>=5 OR a 3-win
// streak trains the stat). No per-attempt DB table here, so this approximates it with a flat roll —
// but a real check (one with an actual DC) always needs to weight success over failure, or the dice
// that decided the check stop having anything to do with whether the character actually improves.
const GROWTH_CHANCE_ON_SUCCESS = 0.3
const GROWTH_CHANCE_ON_FAILURE = 0.08

/** Only call this for checks with real stakes (a DC was actually rolled against) — a freeform/
 *  GM-judged roll with no DC has no "won" to weight against and shouldn't grant free growth. */
export function trainStat(character: Character, stat: StatKey, won: boolean): string | null {
  if (character.stats[stat] >= MAX_TRAINED_STAT) return null
  if (Math.random() > (won ? GROWTH_CHANCE_ON_SUCCESS : GROWTH_CHANCE_ON_FAILURE)) return null
  const before = character.stats[stat]
  character.stats = { ...character.stats, [stat]: before + 1 }
  if (stat === 'end') {
    const newMaxHp = maxHpForEndurance(character.stats.end)
    character.hp = Math.min(newMaxHp, character.hp + (newMaxHp - character.maxHp))
    character.maxHp = newMaxHp
  }
  return `${STAT_EMOJI[stat]} ${STAT_LABELS[stat]} зростає: ${before} → ${before + 1}!`
}
