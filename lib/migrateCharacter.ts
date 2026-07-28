import { Character, EMPTY_EQUIPPED, maxHpForEndurance } from './types'

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
  if (rawStats && typeof rawStats.end !== 'number') {
    const converted = { ...patched.stats }
    let any = false
    for (const [oldKey, newKey] of Object.entries(LEGACY_STAT_MAP)) {
      if (typeof rawStats[oldKey] === 'number') {
        (converted as unknown as Record<string, number>)[newKey] = rawStats[oldKey]
        any = true
      }
    }
    if (any) { patched.stats = converted; changed = true }
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
  if (patched.xp === undefined) { patched.xp = 0; changed = true }
  if (patched.meleeProf === undefined) { patched.meleeProf = 0; changed = true }
  if (patched.firearmProf === undefined) { patched.firearmProf = 0; changed = true }
  if (patched.lastDailyTickAt === undefined) { patched.lastDailyTickAt = Date.now(); changed = true }
  if (patched.durability === undefined) { patched.durability = {}; changed = true }
  if (patched.bio === undefined) { patched.bio = ''; changed = true }

  return changed ? patched : null
}
