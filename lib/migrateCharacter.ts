import { Character, EMPTY_EQUIPPED, ExpeditionLogEntry, LUCK_MAX, maxHpForEndurance } from './types'

// Every entry used to be a bare string with no timestamp — wrap old ones as best-effort at the
// character's creation time (better than crashing on `.text`/`.at` of a string, or silently
// dropping the whole trip's log) so old records survive the switch to timestamped entries.
function toLogEntries(raw: unknown, fallbackAt: number): ExpeditionLogEntry[] {
  if (!Array.isArray(raw)) return []
  return raw.map(item => (typeof item === 'string' ? { text: item, at: fallbackAt } : item as ExpeditionLogEntry))
}

// Very first version of the site stored stats under full Ukrainian-transliterated English names
// (strength/agility/endurance/perception/intellect/charisma) instead of the bot's short keys — old
// characters still have that shape in Redis, which makes stats.end etc. undefined → NaN everywhere.
const LEGACY_STAT_MAP: Record<string, keyof Character['stats']> = {
  strength: 'str', agility: 'agi', endurance: 'end', perception: 'per', intellect: 'int', charisma: 'cha',
}

// Backfills fields added after this character was first created, so old records don't show blank/NaN stats.
export function migrateLegacyCharacter(c: Character): Character | null {
  let changed = false
  const patched: Character = { ...c }

  const rawStats = patched.stats as unknown as Record<string, number>
  if (rawStats) {
    const hasLegacyKeys = Object.keys(LEGACY_STAT_MAP).some(k => typeof rawStats[k] === 'number')
    if (hasLegacyKeys || typeof rawStats.end !== 'number') {
      // Rebuild from scratch with only the 6 short keys — a previous version of this migration
      // copied the old full-name keys into the new object instead of replacing them, leaving both
      // sets present (12 entries instead of 6) and rendering as unlabeled extra stat boxes.
      const clean: Record<string, number> = {}
      for (const [oldKey, newKey] of Object.entries(LEGACY_STAT_MAP)) {
        if (typeof rawStats[oldKey] === 'number') clean[newKey] = rawStats[oldKey]
        else if (typeof rawStats[newKey] === 'number') clean[newKey] = rawStats[newKey]
      }
      if (Object.keys(clean).length === 6) {
        patched.stats = clean as unknown as Character['stats']
        changed = true
      }
    }
  }

  if (patched.maxHp === undefined || Number.isNaN(patched.maxHp)) {
    patched.maxHp = maxHpForEndurance(patched.stats.end ?? 3)
    changed = true
  }
  if (patched.hp === undefined || Number.isNaN(patched.hp)) { patched.hp = patched.maxHp; changed = true }
  if (patched.hunger === undefined) { patched.hunger = 100; changed = true }
  if (patched.thirst === undefined) { patched.thirst = 100; changed = true }
  if (patched.morale === undefined) { patched.morale = 70; changed = true }
  if (patched.infection === undefined) { patched.infection = 0; changed = true }
  if (patched.reputation === undefined) { patched.reputation = 5; changed = true }
  if (patched.dead === undefined) { patched.dead = false; changed = true }
  if (patched.equipped === undefined) { patched.equipped = EMPTY_EQUIPPED; changed = true }
  if (patched.inventory === undefined) { patched.inventory = []; changed = true }
  if (patched.expedition === undefined) { patched.expedition = null; changed = true }
  if (patched.recentExpeditionTimestamps === undefined) { patched.recentExpeditionTimestamps = []; changed = true }
  if (patched.storageBox === undefined) { patched.storageBox = []; changed = true }
  if (patched.huntingProf === undefined) { patched.huntingProf = 0; changed = true }
  if (patched.huntsSinceLevel === undefined) { patched.huntsSinceLevel = 0; changed = true }
  if (patched.avatar === undefined) { patched.avatar = null; changed = true }
  if (patched.canteenUses === undefined) { patched.canteenUses = []; changed = true }
  if (patched.locationCooldowns === undefined) { patched.locationCooldowns = {}; changed = true }
  if (patched.xp === undefined) { patched.xp = 0; changed = true }
  if (patched.meleeProf === undefined) { patched.meleeProf = 0; changed = true }
  if (patched.firearmProf === undefined) { patched.firearmProf = 0; changed = true }
  if (patched.lastDailyTickAt === undefined) { patched.lastDailyTickAt = Date.now(); changed = true }
  if (patched.durability === undefined) { patched.durability = {}; changed = true }
  if (patched.bio === undefined) { patched.bio = ''; changed = true }
  if (patched.combat === undefined) { patched.combat = null; changed = true }
  if (patched.currentExpeditionLog === undefined) { patched.currentExpeditionLog = []; changed = true }
  else if (patched.currentExpeditionLog.some(e => typeof e === 'string')) {
    patched.currentExpeditionLog = toLogEntries(patched.currentExpeditionLog, patched.createdAt)
    changed = true
  }
  if (patched.lastExpeditionLog === undefined) { patched.lastExpeditionLog = []; changed = true }
  else if (patched.lastExpeditionLog.some(e => typeof e === 'string')) {
    patched.lastExpeditionLog = toLogEntries(patched.lastExpeditionLog, patched.createdAt)
    changed = true
  }
  if (patched.expeditionsCompleted === undefined) { patched.expeditionsCompleted = 0; changed = true }
  if (patched.zombiesKilled === undefined) { patched.zombiesKilled = 0; changed = true }
  if (patched.playersSaved === undefined) { patched.playersSaved = 0; changed = true }
  if (patched.maxLuck === undefined) { patched.maxLuck = LUCK_MAX; changed = true }
  if (patched.luck === undefined) { patched.luck = LUCK_MAX; changed = true }

  return changed ? patched : null
}
