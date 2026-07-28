import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { getSession } from '@/lib/auth'
import { Character } from '@/lib/types'
import { getExpeditionLevel } from '@/lib/expedition'
import { performSearch } from '@/lib/expeditionEngine'
import { tryCampJob } from '@/lib/campJobEngine'
import { appendCharacterLog } from '@/lib/characterLog'

export async function POST() {
  const owner = await getSession()
  if (!owner) return NextResponse.json({ error: 'Потрібно увійти' }, { status: 401 })

  const charId = await redis.get<string>(`char:owner:${owner}`)
  if (!charId) return NextResponse.json({ error: 'Персонажа не знайдено' }, { status: 404 })
  const raw = await redis.get<string>(`char:${charId}`)
  if (!raw) return NextResponse.json({ error: 'Персонажа не знайдено' }, { status: 404 })
  const character: Character = typeof raw === 'string' ? JSON.parse(raw) : raw

  if (!character.expedition) return NextResponse.json({ error: 'Ви не на вилазці' }, { status: 400 })
  if (Date.now() < character.expedition.arrivesAt) {
    return NextResponse.json({ error: 'Ще в дорозі', arrivesAt: character.expedition.arrivesAt }, { status: 400 })
  }

  const level = getExpeditionLevel(character.expedition.levelKey)!
  let log: string[] = []
  let images: string[] = []

  if (character.expedition.phase === 'traveling_out') {
    log.push(`🚶 ${character.name} прибув(-ла) на локацію: ${level.label}`)
    const result = performSearch(character, level)
    log = log.concat(result.log)
    images = result.images
    if (result.died) {
      character.expedition = null
    } else {
      character.expedition = { ...character.expedition, phase: 'on_site', arrivesAt: 0 }
    }
  } else if (character.expedition.phase === 'traveling_back') {
    log.push(`🏕️ ${character.name} повернувся(-лась) в табір.`)
    character.expedition = null
    const job = tryCampJob(character)
    log = log.concat(job.log)
    if (job.image) images.push(job.image)
  }

  await redis.set(`char:${charId}`, JSON.stringify(character))
  await appendCharacterLog(charId, log)
  return NextResponse.json({ character, log, images })
}
