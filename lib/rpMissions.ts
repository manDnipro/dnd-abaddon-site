import { redis } from './redis'
import { Character, StatKey, STAT_LABELS, maxHpForEndurance } from './types'
import { getItem } from './items'
import { addStack } from './stacks'

const STAT_EMOJI: Record<StatKey, string> = { str: '💪', agi: '🤸', end: '🛡️', per: '👁️', int: '🧠', cha: '✨' }
const MAX_STAT_FROM_REWARD = 10

export type MissionRewardType = 'none' | 'item' | 'hp' | 'stat'

export interface MissionRewardItem { itemKey: string; qty: number }

export interface MissionReward {
  type: MissionRewardType
  items?: MissionRewardItem[] // for type 'item' — can be several different items at once
  hpAmount?: number
  statKey?: StatKey
  statAmount?: number
}

export interface MissionCompletion {
  success: boolean
  at: number
}

export interface RPMission {
  id: string
  title: string
  text: string
  targetCharId: string | null // null = every approved player
  targetName: string | null // snapshot for GM display, since a character could later be renamed/removed
  checkStat: StatKey | null // null = no roll, resolves as an automatic success
  checkDC: number
  reward: MissionReward
  createdAt: number
  completions: Record<string, MissionCompletion> // charId -> outcome
}

const HASH_KEY = 'rp:missions'

export async function createRPMission(input: Omit<RPMission, 'id' | 'createdAt' | 'completions'>): Promise<RPMission> {
  const id = String(await redis.incr('rp:mission:id'))
  const mission: RPMission = { ...input, id, createdAt: Date.now(), completions: {} }
  await redis.hset(HASH_KEY, { [id]: JSON.stringify(mission) })
  return mission
}

export async function listAllMissions(): Promise<RPMission[]> {
  const all = await redis.hgetall<Record<string, string>>(HASH_KEY)
  if (!all) return []
  return Object.values(all)
    .map(v => (typeof v === 'string' ? JSON.parse(v) : v) as RPMission)
    .sort((a, b) => b.createdAt - a.createdAt)
}

export async function getMission(id: string): Promise<RPMission | null> {
  const raw = await redis.hget<string>(HASH_KEY, id)
  if (!raw) return null
  return typeof raw === 'string' ? JSON.parse(raw) : raw
}

export async function saveMission(mission: RPMission) {
  await redis.hset(HASH_KEY, { [mission.id]: JSON.stringify(mission) })
}

/** Missions relevant to this character that they haven't already resolved. */
export async function listMissionsForChar(charId: string): Promise<RPMission[]> {
  const all = await listAllMissions()
  return all.filter(m => (m.targetCharId === null || m.targetCharId === charId) && !m.completions[charId])
}

/** Human-readable summary of a reward, e.g. "🎁 Бинт ×2, Консерви ×1" or "❤️ +10 ОЗ" — used
 *  wherever a mission is listed (GM panel, homepage, PDA) so the display logic lives in one place. */
export function missionRewardSummary(reward: MissionReward): string | null {
  if (reward.type === 'item' && reward.items && reward.items.length > 0) {
    return `🎁 ${reward.items.map(i => `${getItem(i.itemKey)?.name ?? i.itemKey} ×${i.qty}`).join(', ')}`
  }
  if (reward.type === 'hp' && reward.hpAmount) return `❤️ +${reward.hpAmount} ОЗ`
  if (reward.type === 'stat' && reward.statKey && reward.statAmount) return `${STAT_LABELS[reward.statKey]} +${reward.statAmount}`
  return null
}

/** Applies a mission reward directly (this is a GM-granted, one-shot reward for a completed check —
 *  not the same as the win-weighted trainStat used for organic activity, since the roll that gated
 *  this reward already was the dice moment). Mutates `character` and appends flavor to `log`. */
export function applyMissionReward(character: Character, reward: MissionReward, log: string[]) {
  if (reward.type === 'item' && reward.items && reward.items.length > 0) {
    for (const { itemKey, qty } of reward.items) {
      const amount = Math.max(1, qty)
      addStack(character.inventory, itemKey, amount)
      log.push(`🎁 Нагорода: ${getItem(itemKey)?.name ?? itemKey} ×${amount}`)
    }
  } else if (reward.type === 'hp' && reward.hpAmount) {
    const before = character.hp
    character.hp = Math.min(character.maxHp, character.hp + reward.hpAmount)
    log.push(`❤️ Нагорода: відновлено ${character.hp - before} ОЗ (${character.hp}/${character.maxHp}).`)
  } else if (reward.type === 'stat' && reward.statKey && reward.statAmount) {
    const key = reward.statKey
    const before = character.stats[key]
    const after = Math.min(MAX_STAT_FROM_REWARD, before + reward.statAmount)
    if (after > before) {
      character.stats = { ...character.stats, [key]: after }
      if (key === 'end') {
        const newMaxHp = maxHpForEndurance(after)
        character.hp = Math.min(newMaxHp, character.hp + (newMaxHp - character.maxHp))
        character.maxHp = newMaxHp
      }
      log.push(`${STAT_EMOJI[key]} Нагорода: ${STAT_LABELS[key]} зростає: ${before} → ${after}!`)
    }
  }
}
