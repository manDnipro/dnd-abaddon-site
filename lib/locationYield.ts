import { Character } from './types'

const WINDOW_MS = 4 * 60 * 60 * 1000

/** Diminishing returns instead of a flat cooldown — a location doesn't lock you out, it just stops
 *  paying out as well the more you lean on it inside a rolling 4h window, and eventually the camp
 *  notices. This keeps the dice check (and stat-training roll) meaningful every time, but drains the
 *  economic payoff (reputation, materials) of grinding the same 0-cooldown spot, without the "why
 *  can't I even try" feel of a timer. */
export interface LocationYield { multiplier: number; backfire: boolean; note: string | null }

export function applyLocationYield(character: Character, key: string): LocationYield {
  const now = Date.now()
  const uses = (character.locationYieldUses[key] ?? []).filter(t => now - t < WINDOW_MS)
  const priorCount = uses.length
  uses.push(now)
  character.locationYieldUses = { ...character.locationYieldUses, [key]: uses }

  if (priorCount <= 1) return { multiplier: 1, backfire: false, note: null }
  if (priorCount <= 3) return { multiplier: 0.5, backfire: false, note: 'Тут уже негусто — рештки зовсім скромні.' }
  return { multiplier: 0, backfire: true, note: 'Хтось у таборі помічає, що ти забагато тягаєш звідси — довіра трохи падає.' }
}
