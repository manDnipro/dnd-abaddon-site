import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { getSession } from '@/lib/auth'
import { Character } from '@/lib/types'
import { getExpeditionLevel, travelMinutesForLevel } from '@/lib/expedition'
import { pushExpeditionLog } from '@/lib/expeditionLog'

export async function POST(req: NextRequest) {
  const owner = await getSession()
  if (!owner) return NextResponse.json({ error: 'Потрібно увійти' }, { status: 401 })

  const charId = await redis.get<string>(`char:owner:${owner}`)
  if (!charId) return NextResponse.json({ error: 'Персонажа не знайдено' }, { status: 404 })
  const raw = await redis.get<string>(`char:${charId}`)
  if (!raw) return NextResponse.json({ error: 'Персонажа не знайдено' }, { status: 404 })
  const character: Character = typeof raw === 'string' ? JSON.parse(raw) : raw

  if (character.status !== 'approved') return NextResponse.json({ error: 'Персонаж ще не затверджений ГМ' }, { status: 403 })
  if (character.dead) return NextResponse.json({ error: 'Персонаж мертвий' }, { status: 403 })
  if (character.expedition) return NextResponse.json({ error: 'Ви вже на вилазці' }, { status: 409 })

  const { levelKey } = await req.json() as { levelKey: string }
  const level = getExpeditionLevel(levelKey)
  if (!level) return NextResponse.json({ error: 'Невідомий рівень складності' }, { status: 400 })

  const travelMs = travelMinutesForLevel(level.index) * 60_000
  character.expedition = { levelKey, phase: 'traveling_out', arrivesAt: Date.now() + travelMs }
  character.recentExpeditionTimestamps = [...character.recentExpeditionTimestamps, Date.now()].filter(t => Date.now() - t < 30 * 60_000)
  character.currentExpeditionLog = []
  pushExpeditionLog(character, [`🚩 ${character.name} вирушає на вилазку: ${level.label}`])

  await redis.set(`char:${charId}`, JSON.stringify(character))
  return NextResponse.json(character)
}
