import { NextRequest, NextResponse } from 'next/server'
import { loadOwnCharacter, saveCharacter, blockIfOnExpedition } from '@/lib/loadCharacter'
import { countOf, removeStack } from '@/lib/stacks'
import { getItem } from '@/lib/items'
import { appendCharacterLog } from '@/lib/characterLog'
import { HUT_UNLOCK_REPUTATION, nextHutStage } from '@/lib/hut'

export async function POST(req: NextRequest) {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId, character } = result
  const guard = blockIfOnExpedition(character)
  if (guard) return guard

  if (character.status !== 'approved') return NextResponse.json({ error: 'Персонаж ще не затверджений ГМ' }, { status: 403 })
  if (character.dead) return NextResponse.json({ error: 'Персонаж мертвий' }, { status: 403 })

  if (character.reputation >= HUT_UNLOCK_REPUTATION) character.hutUnlocked = true
  if (!character.hutUnlocked) {
    return NextResponse.json({ error: `Хібара стає доступною при репутації ${HUT_UNLOCK_REPUTATION}.` }, { status: 403 })
  }

  const stage = nextHutStage(character.hutProgress)
  if (!stage) return NextResponse.json({ error: 'Хібару вже добудовано.' }, { status: 400 })

  const { itemKey, qty } = await req.json() as { itemKey: string; qty: number }
  const costLine = stage.cost.find(c => c.itemKey === itemKey)
  if (!costLine) return NextResponse.json({ error: 'Цей матеріал не потрібен на поточному етапі.' }, { status: 400 })

  const contribKey = `${stage.key}:${itemKey}`
  const already = character.hutContributions[contribKey] ?? 0
  const stillNeeded = Math.max(0, costLine.quantity - already)
  if (stillNeeded === 0) return NextResponse.json({ error: 'Цього матеріалу вже достатньо для етапу.' }, { status: 400 })

  const available = countOf(character.inventory, itemKey)
  const give = Math.max(0, Math.min(Math.floor(qty) || 0, stillNeeded, available))
  if (give <= 0) return NextResponse.json({ error: 'Немає стільки цього матеріалу з собою.' }, { status: 400 })

  character.inventory = removeStack(character.inventory, itemKey, give)
  character.hutContributions = { ...character.hutContributions, [contribKey]: already + give }

  const log: string[] = [`🏠 Внесено в будівництво (${stage.label}): ${getItem(itemKey)?.name ?? itemKey} ×${give}.`]

  const stageComplete = stage.cost.every(c => (character.hutContributions[`${stage.key}:${c.itemKey}`] ?? 0) >= c.quantity)
  if (stageComplete) {
    character.hutProgress = stage.progressAt
    log.push(`🏗️ Етап "${stage.label}" завершено! Прогрес будівництва: ${character.hutProgress}%.`)
    if (character.hutProgress >= 100) log.push(`🎉 Хібару добудовано! Тепер можна заходити відпочивати.`)
  }

  await saveCharacter(charId, character)
  await appendCharacterLog(charId, log)
  return NextResponse.json({ character, log })
}
