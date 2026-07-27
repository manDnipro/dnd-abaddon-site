import { NextRequest, NextResponse } from 'next/server'
import { loadOwnCharacter, saveCharacter } from '@/lib/loadCharacter'
import { clampHungerThirst, clampInfection, clampMorale } from '@/lib/types'
import { getItem, isConsumable } from '@/lib/items'
import { removeStack } from '@/lib/stacks'

export async function POST(req: NextRequest) {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId, character } = result

  if (character.status !== 'approved') return NextResponse.json({ error: 'Персонаж ще не затверджений ГМ' }, { status: 403 })
  if (character.dead) return NextResponse.json({ error: 'Персонаж мертвий' }, { status: 403 })

  const { itemId } = await req.json() as { itemId: string }
  const item = getItem(itemId)
  if (!item || !isConsumable(item)) return NextResponse.json({ error: 'Цей предмет не можна використати' }, { status: 400 })

  const stack = character.inventory.find(s => s.itemId === itemId)
  if (!stack || stack.qty < 1) return NextResponse.json({ error: 'Предмета немає в інвентарі' }, { status: 400 })

  const log: string[] = []
  character.inventory = removeStack(character.inventory, itemId, 1)

  if (item.poisonChance && Math.random() * 100 < item.poisonChance) {
    const dmg = Math.ceil(Math.random() * 4) + 1
    character.hp = Math.max(0, character.hp - dmg)
    log.push(`🤢 ${item.name} виявились зіпсованими! -${dmg} ОЗ.`)
    if (character.hp <= 0) { character.dead = true; log.push(`☠️ ${character.name} помер(-ла) від отруєння.`) }
  } else {
    if (item.hungerRestore) { character.hunger = clampHungerThirst(character.hunger + item.hungerRestore); log.push(`🍽️ +${item.hungerRestore} голоду.`) }
    if (item.thirstRestore) { character.thirst = clampHungerThirst(character.thirst + item.thirstRestore); log.push(`💧 +${item.thirstRestore} спраги.`) }
    if (item.healAmount) { character.hp = Math.min(character.maxHp, character.hp + item.healAmount); log.push(`❤️ +${item.healAmount} ОЗ.`) }
    if (item.infectionReduce) { character.infection = clampInfection(character.infection - item.infectionReduce); log.push(`☣️ -${item.infectionReduce} інфекції.`) }
    if (item.moraleRestore) { character.morale = clampMorale(character.morale + item.moraleRestore); log.push(`🥃 +${item.moraleRestore} моралі.`) }
  }

  await saveCharacter(charId, character)
  return NextResponse.json({ character, log })
}
