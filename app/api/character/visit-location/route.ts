import { NextRequest, NextResponse } from 'next/server'
import { loadOwnCharacter, saveCharacter, blockIfOnExpedition } from '@/lib/loadCharacter'
import { clampHungerThirst, clampInfection, clampMorale, clampReputation, statModifier, STAT_LABELS } from '@/lib/types'
import { rollCheck } from '@/lib/dice'
import { dieSizeForStat, scaleDcForSides } from '@/lib/statLevels'
import { getCampLocation } from '@/lib/campLocations'
import { reputationTier, CANTEEN_MAX_USES } from '@/lib/reputation'
import { getItem } from '@/lib/items'
import { addStack } from '@/lib/stacks'
import { appendCharacterLog } from '@/lib/characterLog'
import { trainStat } from '@/lib/statTraining'
import { applyLocationYield } from '@/lib/locationYield'

const DAY_MS = 24 * 60 * 60 * 1000

export async function POST(req: NextRequest) {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId, character } = result
  const guard = blockIfOnExpedition(character)
  if (guard) return guard

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

  if (location.cooldownMinutes) {
    const lastUsed = character.locationCooldowns[location.key]
    const cooldownMs = location.cooldownMinutes * 60_000
    if (lastUsed && Date.now() - lastUsed < cooldownMs) {
      const minsLeft = Math.ceil((cooldownMs - (Date.now() - lastUsed)) / 60_000)
      return NextResponse.json({ error: `${location.name} — ще зарано повертатися сюди, спробуй через ${minsLeft} хв.` }, { status: 400 })
    }
    character.locationCooldowns = { ...character.locationCooldowns, [location.key]: Date.now() }
  }

  let checkSuccess = true
  if (location.stat !== null) {
    const sides = dieSizeForStat(character.stats[location.stat])
    const dc = scaleDcForSides(location.dc, sides)
    const roll = rollCheck(sides, statModifier(character.stats[location.stat]))
    checkSuccess = roll.total >= dc
    log.push(`🎲 ${STAT_LABELS[location.stat]}: ${roll.total} проти СК ${dc}${checkSuccess ? ' — успіх!' : ' — невдача.'}`)
  }
  const rawOutcome = checkSuccess ? location.success : location.failure

  if (rawOutcome.text) log.push(`${location.name}: ${rawOutcome.text}`)
  if (location.stat !== null) {
    const growth = trainStat(character, location.stat, checkSuccess)
    if (growth) log.push(growth)
  }

  // Diminishing returns instead of a hard cooldown for locations that hand out reputation/materials
  // on success — copy the outcome first, CAMP_LOCATIONS entries are shared module-level objects and
  // must not be mutated in place (every future visit from any character reuses the same object).
  let outcome = rawOutcome
  if (checkSuccess && (rawOutcome.reputationDelta || rawOutcome.materialReward)) {
    const yieldResult = applyLocationYield(character, location.key)
    outcome = { ...rawOutcome }
    if (yieldResult.backfire) {
      if (outcome.reputationDelta) outcome.reputationDelta = -1
      outcome.materialReward = undefined
    } else if (yieldResult.multiplier < 1) {
      if (outcome.reputationDelta) outcome.reputationDelta = Math.max(1, Math.round(outcome.reputationDelta * yieldResult.multiplier))
      if (outcome.materialReward) outcome.materialReward = { ...outcome.materialReward, quantity: Math.max(1, Math.round(outcome.materialReward.quantity * yieldResult.multiplier)) }
    }
    if (yieldResult.note) log.push(`📉 ${yieldResult.note}`)
  }

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
  await appendCharacterLog(charId, log)
  return NextResponse.json({ character, log })
}
