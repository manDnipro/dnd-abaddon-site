import { Character } from './types'

/** Accumulates lines into the in-progress expedition's own log — separate from the general
 *  character activity feed (which caps at 10 lines and mixes in every other action), so the player
 *  can always see everything that happened on their current/most recent trip in one place. */
export function pushExpeditionLog(character: Character, lines: string[]) {
  if (lines.length === 0) return
  const at = Date.now()
  character.currentExpeditionLog = [...character.currentExpeditionLog, ...lines.map(text => ({ text, at }))]
}

/** Call when an expedition ends (returned to camp, or died) — snapshots the accumulated log as
 *  "last expedition" and clears the in-progress one for the next trip. Also drops any duo link:
 *  whichever partner finishes first stops being "together" for live-status purposes, even though
 *  the other one might still be out there. */
export function finalizeExpeditionLog(character: Character) {
  if (character.currentExpeditionLog.length > 0) {
    character.lastExpeditionLog = character.currentExpeditionLog
  }
  character.currentExpeditionLog = []
  character.duoPartnerId = null
}
