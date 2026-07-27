import { NextResponse } from 'next/server'
import { loadOwnCharacter, saveCharacter } from '@/lib/loadCharacter'
import { clampHungerThirst, statModifier } from '@/lib/types'
import { rollDice } from '@/lib/dice'
import { reputationTier, REST_HEAL_DICE, REST_HUNGER_COST, REST_THIRST_COST } from '@/lib/reputation'
import { restLine } from '@/lib/flavor'

export async function POST() {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId, character } = result

  if (character.status !== 'approved') return NextResponse.json({ error: 'Персонаж ще не затверджений ГМ' }, { status: 403 })
  if (character.dead) return NextResponse.json({ error: 'Персонаж мертвий' }, { status: 403 })
  if (character.expedition) return NextResponse.json({ error: 'Не можна відпочивати під час вилазки' }, { status: 400 })

  const tier = reputationTier(character.reputation)
  const healRoll = rollDice(REST_HEAL_DICE[tier.key])
  const heal = Math.max(1, healRoll.total + statModifier(character.stats.end))

  character.hp = Math.min(character.maxHp, character.hp + heal)
  character.hunger = clampHungerThirst(character.hunger - REST_HUNGER_COST)
  character.thirst = clampHungerThirst(character.thirst - REST_THIRST_COST)

  await saveCharacter(charId, character)
  return NextResponse.json({ character, log: [restLine(character.name, tier.label, heal, character.hp, character.maxHp)] })
}
