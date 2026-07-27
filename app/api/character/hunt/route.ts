import { NextResponse } from 'next/server'
import { loadOwnCharacter, saveCharacter } from '@/lib/loadCharacter'
import { clampHungerThirst, statModifier } from '@/lib/types'
import { rollD20 } from '@/lib/dice'
import { getItem } from '@/lib/items'
import { addStack } from '@/lib/stacks'
import { HUNTING_DC, HUNTING_HUNGER_COST, HUNTING_THIRST_COST, HUNTING_MISHAP_CHANCE, HUNTS_PER_PROFICIENCY, MAX_HUNTING_PROFICIENCY, rollHuntingCatch } from '@/lib/hunting'

export async function POST() {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId, character } = result

  if (character.status !== 'approved') return NextResponse.json({ error: 'Персонаж ще не затверджений ГМ' }, { status: 403 })
  if (character.dead) return NextResponse.json({ error: 'Персонаж мертвий' }, { status: 403 })
  if (character.expedition) return NextResponse.json({ error: 'Не можна полювати під час вилазки' }, { status: 400 })

  const log: string[] = []
  character.hunger = clampHungerThirst(character.hunger - HUNTING_HUNGER_COST)
  character.thirst = clampHungerThirst(character.thirst - HUNTING_THIRST_COST)

  const roll = rollD20(statModifier(character.stats.per) + character.huntingProf)
  const success = roll.total >= HUNTING_DC

  if (success) {
    const catchKey = rollHuntingCatch()
    addStack(character.inventory, catchKey, 1)
    log.push(`🏹 Полювання вдале (${roll.total} проти СК ${HUNTING_DC}): здобуто ${getItem(catchKey)?.name ?? catchKey}.`)
    character.huntsSinceLevel += 1
    if (character.huntsSinceLevel >= HUNTS_PER_PROFICIENCY && character.huntingProf < MAX_HUNTING_PROFICIENCY) {
      character.huntingProf += 1
      character.huntsSinceLevel = 0
      log.push(`🏹 Навик полювання зростає: ${character.huntingProf}/${MAX_HUNTING_PROFICIENCY}!`)
    }
  } else {
    log.push(`🏹 Полювання невдале (${roll.total} проти СК ${HUNTING_DC}).`)
    if (Math.random() < HUNTING_MISHAP_CHANCE) {
      character.hunger = clampHungerThirst(character.hunger - 5)
      log.push(`😮‍💨 Змарнував(-ла) час і сили — додатково -5 голоду.`)
    }
  }

  await saveCharacter(charId, character)
  return NextResponse.json({ character, log })
}
