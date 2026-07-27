import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { getSession } from '@/lib/auth'
import { Character, EMPTY_EQUIPPED, maxHpForEndurance } from '@/lib/types'

export async function GET() {
  const owner = await getSession()
  if (!owner) return NextResponse.json({ error: 'Потрібно увійти' }, { status: 401 })

  const id = await redis.get<string>(`char:owner:${owner}`)
  if (!id) return NextResponse.json({ character: null })

  const raw = await redis.get<string>(`char:${id}`)
  if (!raw) return NextResponse.json({ character: null })

  let character: Character = typeof raw === 'string' ? JSON.parse(raw) : raw
  const migrated = migrateLegacyCharacter(character)
  if (migrated) {
    character = migrated
    await redis.set(`char:${id}`, JSON.stringify(character))
  }

  return NextResponse.json({ character })
}

// Backfills fields added after this character was first created, so old records don't show blank stats.
function migrateLegacyCharacter(c: Character): Character | null {
  let changed = false
  const patched: Character = { ...c }

  if (patched.maxHp === undefined) {
    patched.maxHp = maxHpForEndurance(patched.stats.end ?? 3)
    changed = true
  }
  if (patched.hp === undefined) { patched.hp = patched.maxHp; changed = true }
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

  return changed ? patched : null
}
