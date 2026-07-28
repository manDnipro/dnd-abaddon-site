import { NextRequest, NextResponse } from 'next/server'
import { loadOwnCharacter, saveCharacter, blockIfOnExpedition } from '@/lib/loadCharacter'
import { redis } from '@/lib/redis'
import { Character } from '@/lib/types'
import { getPendingDuoFor, resolveDuoInvite } from '@/lib/socialStore'
import { getExpeditionLevel, travelMinutesForLevel } from '@/lib/expedition'

export async function POST(req: NextRequest) {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId, character } = result
  const guard = blockIfOnExpedition(character)
  if (guard) return guard

  const { action } = await req.json() as { action: 'accept' | 'decline' }
  const invite = await getPendingDuoFor(charId)
  if (!invite) return NextResponse.json({ error: 'Немає запрошення' }, { status: 400 })
  if (invite.toCharId !== charId) return NextResponse.json({ error: 'Це не твоє запрошення' }, { status: 403 })

  if (action === 'decline') {
    await resolveDuoInvite(invite.id, 'declined')
    return NextResponse.json({ log: [`❌ ${character.name} відмовився(-лась) від спільної вилазки.`] })
  }

  if (character.expedition) return NextResponse.json({ error: 'Ти вже на вилазці' }, { status: 400 })

  const raw = await redis.get<string>(`char:${invite.fromCharId}`)
  if (!raw) return NextResponse.json({ error: 'Напарника не знайдено' }, { status: 404 })
  const partner: Character = typeof raw === 'string' ? JSON.parse(raw) : raw
  if (partner.expedition) return NextResponse.json({ error: `${partner.name} вже вирушив(-ла) на вилазку` }, { status: 400 })

  const level = getExpeditionLevel(invite.levelKey)!
  const travelMs = travelMinutesForLevel(level.index) * 60_000

  character.expedition = { levelKey: level.key, phase: 'traveling_out', arrivesAt: Date.now() + travelMs }
  partner.expedition = { levelKey: level.key, phase: 'traveling_out', arrivesAt: Date.now() + travelMs }

  await saveCharacter(charId, character)
  await saveCharacter(invite.fromCharId, partner)
  await resolveDuoInvite(invite.id, 'accepted')

  return NextResponse.json({
    character,
    log: [`✅ ${character.name} та ${partner.name} вирушають на вилазку разом (${level.label}). Кожен проходить її на своїй сторінці вилазки — прогрес не спільний, лише час виходу співпав.`],
  })
}
