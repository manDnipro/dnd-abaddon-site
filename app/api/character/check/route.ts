import { NextRequest, NextResponse } from 'next/server'
import { loadOwnCharacter } from '@/lib/loadCharacter'
import { STAT_LABELS, StatKey, statModifier, formatModifier } from '@/lib/types'
import { rollD20 } from '@/lib/dice'

export async function POST(req: NextRequest) {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { character } = result

  const { stat } = await req.json() as { stat: StatKey }
  if (!STAT_LABELS[stat]) return NextResponse.json({ error: 'Невідома характеристика' }, { status: 400 })

  const mod = statModifier(character.stats[stat])
  const roll = rollD20(mod)

  return NextResponse.json({
    log: [`🎲 Перевірка (${STAT_LABELS[stat]} ${formatModifier(mod)}): кинуто ${roll.rolls[0]} ${formatModifier(mod)} = **${roll.total}**`],
  })
}
