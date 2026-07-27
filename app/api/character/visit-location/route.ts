import { NextRequest, NextResponse } from 'next/server'
import { loadOwnCharacter, saveCharacter } from '@/lib/loadCharacter'
import { clampHungerThirst, clampInfection, clampMorale, clampReputation, statModifier } from '@/lib/types'
import { rollD20 } from '@/lib/dice'
import { getCampLocation } from '@/lib/campLocations'
import { reputationTier, CANTEEN_MAX_USES } from '@/lib/reputation'
import { getItem } from '@/lib/items'
import { addStack } from '@/lib/stacks'

const DAY_MS = 24 * 60 * 60 * 1000

export async function POST(req: NextRequest) {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId, character } = result

  if (character.status !== 'approved') return NextResponse.json({ error: 'Персонаж ще не затверджений ГМ' }, { status: 403 })
  if (character.dead) return NextResponse.json({ error: 'Персонаж мертвий' }, { status: 403 })
  if (character.expedition) return NextResponse.json({ error: 'Ви не в таборі' }, { status: 400 })

  const { key } = await req.json() as { key: string }
  const location = getCampLocation(key)
  if (!location) return NextResponse.json({ error: 'Невідома локація' }, { status: 400 })

  const log: string[] = []

  if (location.key === 'canteen') {
    const tier = reputationTier(character.reputation)
    const maxUses = CANTEEN_MAX_USES[tier.key]
    character.canteenUses = character.canteenUses.filter(t => Date.now() - t < DAY_MS)
    if (character.canteenUses.length >= maxUses) {
      return NextResponse.json({ error: `Їдальня сьогодні вже нагодувала тебе достатньо разів (${maxUses}/24г при статусі ${tier.label}).` }, { status: 400 })
    }
    character.canteenUses.push(Date.now())
  }

  const outcome = location.stat === null
    ? location.success
    : rollD20(statModifier(character.stats[location.stat])).total >= location.dc
      ? location.success
      : location.failure

  if (outcome.text) log.push(`${location.name}: ${outcome.text}`)
  if (outcome.moraleDelta) character.morale = clampMorale(character.morale + outcome.moraleDelta)
  if (outcome.reputationDelta) character.reputation = clampReputation(character.reputation + outcome.reputationDelta)
  if (outcome.infectionDelta) character.infection = clampInfection(character.infection + outcome.infectionDelta)
  if (outcome.thirstDelta) character.thirst = clampHungerThirst(character.thirst + outcome.thirstDelta)
  if (outcome.hungerDelta) character.hunger = clampHungerThirst(character.hunger + outcome.hungerDelta)
  if (outcome.materialReward) {
    addStack(character.inventory, outcome.materialReward.itemKey, outcome.materialReward.quantity)
    log.push(`🎒 Отримано: ${getItem(outcome.materialReward.itemKey)?.name ?? outcome.materialReward.itemKey} ×${outcome.materialReward.quantity}`)
  }

  await saveCharacter(charId, character)
  return NextResponse.json({ character, log })
}
