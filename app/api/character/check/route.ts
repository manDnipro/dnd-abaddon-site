import { NextRequest, NextResponse } from 'next/server'
import { loadOwnCharacter, saveCharacter } from '@/lib/loadCharacter'
import { STAT_LABELS, StatKey, statModifier, formatModifier, maxHpForEndurance } from '@/lib/types'
import { rollD20 } from '@/lib/dice'

const MAX_TRAINED_STAT = 10
const STAT_EMOJI: Record<StatKey, string> = { str: '💪', agi: '🤸', end: '🛡️', per: '👁️', int: '🧠', cha: '✨' }

export async function POST(req: NextRequest) {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId, character } = result

  const { stat } = await req.json() as { stat: StatKey }
  if (!STAT_LABELS[stat]) return NextResponse.json({ error: 'Невідома характеристика' }, { status: 400 })

  const mod = statModifier(character.stats[stat])
  const roll = rollD20(mod)
  const log = [`🎲 Перевірка (${STAT_LABELS[stat]} ${formatModifier(mod)}): кинуто ${roll.rolls[0]} ${formatModifier(mod)} = **${roll.total}**`]

  // Simplified stand-in for the bot's practice/win-streak counters (no persisted per-attempt DB table
  // here): every genuine attempt has a flat chance to nudge the stat up, win or lose, capped at 10.
  if (character.stats[stat] < MAX_TRAINED_STAT && Math.random() < 0.2) {
    character.stats = { ...character.stats, [stat]: character.stats[stat] + 1 }
    log.push(`${STAT_EMOJI[stat]} ${STAT_LABELS[stat]} зростає: ${character.stats[stat] - 1} → ${character.stats[stat]}!`)
    if (stat === 'end') {
      const newMaxHp = maxHpForEndurance(character.stats.end)
      character.hp = Math.min(newMaxHp, character.hp + (newMaxHp - character.maxHp))
      character.maxHp = newMaxHp
    }
    await saveCharacter(charId, character)
  }

  return NextResponse.json({ character, log })
}
