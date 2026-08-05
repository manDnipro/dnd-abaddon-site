import { NextRequest, NextResponse } from 'next/server'
import { loadOwnCharacter, saveCharacter, blockIfInCombat } from '@/lib/loadCharacter'
import { getItem } from '@/lib/items'
import { getDurability, MAX_DURABILITY, repairScrapCost, repairDC, REPAIR_FAIL_RESTORE_FRACTION } from '@/lib/durability'
import { countOf, removeStack } from '@/lib/stacks'
import { statModifier } from '@/lib/types'
import { rollCheck } from '@/lib/dice'
import { dieSizeForStat, scaleDcForSides } from '@/lib/statLevels'
import { repairLine } from '@/lib/flavor'
import { trainStat } from '@/lib/statTraining'

export async function POST(req: NextRequest) {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId, character } = result
  const guard = blockIfInCombat(character)
  if (guard) return guard

  if (character.status !== 'approved') return NextResponse.json({ error: 'Персонаж ще не затверджений ГМ' }, { status: 403 })
  if (character.dead) return NextResponse.json({ error: 'Персонаж мертвий' }, { status: 403 })

  const { itemKey } = await req.json() as { itemKey: string }
  const item = getItem(itemKey)
  if (!item) return NextResponse.json({ error: 'Невідомий предмет' }, { status: 400 })

  const current = getDurability(character, itemKey)
  if (current >= MAX_DURABILITY) return NextResponse.json({ error: 'Цей предмет вже справний' }, { status: 400 })

  const cost = repairScrapCost(item)
  const available = countOf(character.inventory, 'scrap') + countOf(character.storageBox, 'scrap')
  if (available < cost) return NextResponse.json({ error: `Не вистачає металобрухту (потрібно ${cost}, є ${available})` }, { status: 400 })

  let remaining = cost
  const fromInv = Math.min(remaining, countOf(character.inventory, 'scrap'))
  character.inventory = removeStack(character.inventory, 'scrap', fromInv)
  remaining -= fromInv
  if (remaining > 0) character.storageBox = removeStack(character.storageBox, 'scrap', remaining)

  const sides = dieSizeForStat(character.stats.per)
  const dc = scaleDcForSides(repairDC(item), sides)
  const roll = rollCheck(sides, statModifier(character.stats.per))
  const success = roll.total >= dc
  const log = [`🎲 Ремонт (${item.name}): ${roll.total} проти СК ${dc}${success ? ' — впорався!' : ' — не все вдалось з першого разу.'}`]

  if (success) {
    character.durability = { ...character.durability, [itemKey]: MAX_DURABILITY }
  } else {
    const restored = Math.round((MAX_DURABILITY - current) * REPAIR_FAIL_RESTORE_FRACTION)
    character.durability = { ...character.durability, [itemKey]: Math.min(MAX_DURABILITY, current + restored) }
  }
  log.push(repairLine(character.name, item.name, success))

  const growth = trainStat(character, 'per', success)
  if (growth) log.push(growth)

  await saveCharacter(charId, character)
  return NextResponse.json({ character, log })
}
