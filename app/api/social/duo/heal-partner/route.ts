import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { loadOwnCharacter, saveCharacter } from '@/lib/loadCharacter'
import { Character, clampInfection } from '@/lib/types'
import { getItem } from '@/lib/items'
import { removeStack } from '@/lib/stacks'
import { appendCharacterLog } from '@/lib/characterLog'
import { pushExpeditionLog } from '@/lib/expeditionLog'

export async function POST(req: NextRequest) {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId, character } = result

  if (character.status !== 'approved') return NextResponse.json({ error: 'Персонаж ще не затверджений ГМ' }, { status: 403 })
  if (character.dead) return NextResponse.json({ error: 'Персонаж мертвий' }, { status: 403 })
  if (!character.duoPartnerId) return NextResponse.json({ error: 'У тебе немає напарника на вилазці' }, { status: 400 })

  const { itemId } = await req.json() as { itemId: string }
  const item = getItem(itemId)
  if (!item || item.type !== 'medical') return NextResponse.json({ error: 'Цим не можна лікувати' }, { status: 400 })

  const stack = character.inventory.find(s => s.itemId === itemId)
  if (!stack || stack.qty < 1) return NextResponse.json({ error: 'Предмета немає в інвентарі' }, { status: 400 })

  const partnerRaw = await redis.get<string>(`char:${character.duoPartnerId}`)
  if (!partnerRaw) return NextResponse.json({ error: 'Напарника не знайдено' }, { status: 404 })
  const partner: Character = typeof partnerRaw === 'string' ? JSON.parse(partnerRaw) : partnerRaw
  if (partner.duoPartnerId !== charId) return NextResponse.json({ error: 'Ви більше не разом на вилазці' }, { status: 400 })
  if (partner.dead) return NextResponse.json({ error: `${partner.name} вже мертвий(-а)` }, { status: 400 })

  character.inventory = removeStack(character.inventory, itemId, 1)

  const partnerLog: string[] = []
  if (item.healAmount) {
    const before = partner.hp
    partner.hp = Math.min(partner.maxHp, partner.hp + item.healAmount)
    partnerLog.push(`🩹 ${character.name} підлікував(-ла) тебе (${item.name}): ${before} → ${partner.hp} ОЗ.`)
  }
  if (item.infectionReduce) {
    partner.infection = clampInfection(partner.infection - item.infectionReduce)
    partnerLog.push(`☣️ ${character.name} зменшив(-ла) твою інфекцію на ${item.infectionReduce} (${item.name}).`)
  }
  if (partnerLog.length === 0) partnerLog.push(`🩹 ${character.name} використав(-ла) на тебе ${item.name}, але ефекту не було.`)

  const ownLog = [`🩹 ${character.name} використав(-ла) ${item.name} на ${partner.name}.`]

  if (partner.expedition) pushExpeditionLog(partner, partnerLog)

  await saveCharacter(charId, character)
  await saveCharacter(character.duoPartnerId, partner)
  await appendCharacterLog(charId, ownLog)
  await appendCharacterLog(character.duoPartnerId, partnerLog)

  return NextResponse.json({ character, log: ownLog })
}
