import { NextRequest, NextResponse } from 'next/server'
import { isGM } from '@/lib/auth'
import { redis } from '@/lib/redis'
import { Character, StatKey } from '@/lib/types'
import { createRPMission, MissionReward, MissionRewardType, MissionRewardItem } from '@/lib/rpMissions'
import { getItem } from '@/lib/items'

export async function POST(req: NextRequest) {
  if (!await isGM()) return NextResponse.json({ error: 'Немає доступу' }, { status: 403 })

  const body = await req.json() as {
    title: string; text: string; targetCharId: string | null
    checkStat: StatKey | null; checkDC: number
    rewardType: MissionRewardType; items?: MissionRewardItem[]; hpAmount?: number; statKey?: StatKey; statAmount?: number
  }
  const { title, text, targetCharId, checkStat, checkDC, rewardType } = body
  if (!title?.trim() || !text?.trim()) return NextResponse.json({ error: 'Заповни назву й опис місії' }, { status: 400 })

  let targetName: string | null = null
  if (targetCharId) {
    const raw = await redis.get<string>(`char:${targetCharId}`)
    if (!raw) return NextResponse.json({ error: 'Персонажа-ціль не знайдено' }, { status: 400 })
    const target: Character = typeof raw === 'string' ? JSON.parse(raw) : raw
    targetName = target.name
  }

  const reward: MissionReward = { type: rewardType }
  if (rewardType === 'item') {
    const items = (body.items ?? []).filter(i => i.itemKey && getItem(i.itemKey))
    if (items.length === 0) return NextResponse.json({ error: 'Обери хоча б один предмет для нагороди' }, { status: 400 })
    reward.items = items.map(i => ({ itemKey: i.itemKey, qty: Math.max(1, Math.floor(i.qty || 1)) }))
  } else if (rewardType === 'hp') {
    if (!body.hpAmount || body.hpAmount <= 0) return NextResponse.json({ error: 'Вкажи скільки ОЗ відновити' }, { status: 400 })
    reward.hpAmount = Math.floor(body.hpAmount)
  } else if (rewardType === 'stat') {
    if (!body.statKey || !body.statAmount || body.statAmount <= 0) return NextResponse.json({ error: 'Вкажи характеристику й на скільки її підняти' }, { status: 400 })
    reward.statKey = body.statKey
    reward.statAmount = Math.floor(body.statAmount)
  }

  const mission = await createRPMission({
    title: title.trim(), text: text.trim(), targetCharId: targetCharId || null, targetName,
    checkStat: checkStat || null, checkDC: checkStat ? Math.max(1, Math.floor(checkDC || 10)) : 0, reward,
  })
  return NextResponse.json(mission)
}
