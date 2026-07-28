import { NextRequest, NextResponse } from 'next/server'
import { loadOwnCharacter, blockIfOnExpedition } from '@/lib/loadCharacter'
import { STAT_LABELS, StatKey, statModifier, formatModifier } from '@/lib/types'
import { rollD20 } from '@/lib/dice'

export async function POST(req: NextRequest) {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { character } = result
  const guard = blockIfOnExpedition(character)
  if (guard) return guard

  const { stat } = await req.json() as { stat: StatKey }
  if (!STAT_LABELS[stat]) return NextResponse.json({ error: 'Невідома характеристика' }, { status: 400 })

  // A freeform roleplay roll — mirrors the bot's p:check:stat exactly: just the dice, no DC, no
  // mechanical reward. The GM judges the outcome in-scene; growth here would be an unearned freebie
  // since nothing was actually won or lost. Stats only grow through checks that have real stakes
  // (combat, hunting, weapon proficiency), same as the bot's practice/win-streak counters.
  const mod = statModifier(character.stats[stat])
  const roll = rollD20(mod)
  const log = [`🎯 Перевірка (${STAT_LABELS[stat]} ${formatModifier(mod)}): кинуто ${roll.rolls[0]} ${formatModifier(mod)} = **${roll.total}**`]

  return NextResponse.json({ character, log })
}
