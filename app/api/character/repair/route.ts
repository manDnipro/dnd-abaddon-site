import { NextRequest, NextResponse } from 'next/server'
import { loadOwnCharacter, saveCharacter } from '@/lib/loadCharacter'
import { getItem } from '@/lib/items'
import { getDurability, MAX_DURABILITY, repairScrapCost } from '@/lib/durability'
import { countOf, removeStack } from '@/lib/stacks'

export async function POST(req: NextRequest) {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId, character } = result

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

  character.durability = { ...character.durability, [itemKey]: MAX_DURABILITY }

  await saveCharacter(charId, character)
  return NextResponse.json({ character, log: [`🔧 ${item.name} відремонтовано за ${cost} металобрухту.`] })
}
