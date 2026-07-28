import { NextRequest, NextResponse } from 'next/server'
import { loadOwnCharacter, saveCharacter } from '@/lib/loadCharacter'
import { getRecipe } from '@/lib/crafting'
import { getItem } from '@/lib/items'
import { addStack, countOf, removeStack } from '@/lib/stacks'
import { XP_REWARDS } from '@/lib/levels'
import { appendCharacterLog } from '@/lib/characterLog'

export async function POST(req: NextRequest) {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId, character } = result

  if (character.status !== 'approved') return NextResponse.json({ error: 'Персонаж ще не затверджений ГМ' }, { status: 403 })
  if (character.dead) return NextResponse.json({ error: 'Персонаж мертвий' }, { status: 403 })

  const { recipeKey } = await req.json() as { recipeKey: string }
  const recipe = getRecipe(recipeKey)
  if (!recipe) return NextResponse.json({ error: 'Невідомий рецепт' }, { status: 400 })

  if (recipe.requiredTool) {
    const hasTool = countOf(character.inventory, recipe.requiredTool) > 0 || countOf(character.storageBox, recipe.requiredTool) > 0
    if (!hasTool) return NextResponse.json({ error: `Потрібен інструмент: ${getItem(recipe.requiredTool)?.name ?? recipe.requiredTool}` }, { status: 400 })
  }

  for (const ing of recipe.ingredients) {
    const have = countOf(character.inventory, ing.itemKey) + countOf(character.storageBox, ing.itemKey)
    if (have < ing.quantity) {
      return NextResponse.json({ error: `Не вистачає: ${getItem(ing.itemKey)?.name ?? ing.itemKey} (потрібно ${ing.quantity}, є ${have})` }, { status: 400 })
    }
  }

  for (const ing of recipe.ingredients) {
    let remaining = ing.quantity
    const fromInv = Math.min(remaining, countOf(character.inventory, ing.itemKey))
    character.inventory = removeStack(character.inventory, ing.itemKey, fromInv)
    remaining -= fromInv
    if (remaining > 0) character.storageBox = removeStack(character.storageBox, ing.itemKey, remaining)
  }

  addStack(character.inventory, recipe.resultKey, recipe.resultQuantity)
  character.xp += XP_REWARDS.craft

  await saveCharacter(charId, character)
  const resultItem = getItem(recipe.resultKey)
  const log = [`🔨 Виготовлено: ${resultItem?.name ?? recipe.resultKey} ×${recipe.resultQuantity} (+${XP_REWARDS.craft} XP)`]
  await appendCharacterLog(charId, log)
  return NextResponse.json({ character, log })
}
