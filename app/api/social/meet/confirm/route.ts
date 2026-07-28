import { NextRequest, NextResponse } from 'next/server'
import { loadOwnCharacter, blockIfOnExpedition } from '@/lib/loadCharacter'
import { redis } from '@/lib/redis'
import { getPendingMeetFor, resolveMeetRequest } from '@/lib/socialStore'
import { STAT_LABELS, Stats } from '@/lib/types'

export async function POST(req: NextRequest) {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId, character } = result
  const guard = blockIfOnExpedition(character)
  if (guard) return guard

  const { action } = await req.json() as { action: 'confirm' | 'decline' }
  const meet = await getPendingMeetFor(charId)
  if (!meet) return NextResponse.json({ error: 'Немає запиту на знайомство' }, { status: 400 })
  if (meet.targetCharId !== charId) return NextResponse.json({ error: 'Це не твій запит' }, { status: 403 })

  await resolveMeetRequest(meet.id, action === 'confirm' ? 'confirmed' : 'declined')

  if (action === 'decline') {
    return NextResponse.json({ log: [`❌ ${character.name} не відповів(-ла) на привітання.`] })
  }

  const statsSummary = (Object.entries(character.stats) as [keyof Stats, number][])
    .map(([k, v]) => `${STAT_LABELS[k]} ${v}`).join(', ')
  const profile = `👋 ${character.name} вітається у відповідь! Профіль: ${statsSummary}. Репутація: ${character.reputation}. Статус: ${character.dead ? 'загинув(-ла)' : 'живий(-а)'}.`

  await redis.rpush(`social:reveals:${meet.requesterCharId}`, profile)
  await redis.ltrim(`social:reveals:${meet.requesterCharId}`, -10, -1)

  return NextResponse.json({ log: [profile] })
}
