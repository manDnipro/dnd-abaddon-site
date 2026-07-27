import { ITEM_CATALOG, WEAPON_UPGRADE_SUFFIX, estimateTradeValue, isConsumable } from './items'

export interface CraftIngredient { itemKey: string; quantity: number }
export interface CraftRecipe {
  key: string
  resultKey: string
  resultQuantity: number
  ingredients: CraftIngredient[]
  requiredTool?: string
}

export const CRAFT_RECIPES: CraftRecipe[] = [
  { key: 'bandage', resultKey: 'bandage', resultQuantity: 1, ingredients: [{ itemKey: 'cloth', quantity: 2 }] },
  { key: 'medkit', resultKey: 'medkit', resultQuantity: 1, ingredients: [{ itemKey: 'bandage', quantity: 2 }, { itemKey: 'cloth', quantity: 1 }, { itemKey: 'scrap', quantity: 1 }] },
  { key: 'ammo_pistol', resultKey: 'ammo_pistol', resultQuantity: 5, ingredients: [{ itemKey: 'casings', quantity: 5 }, { itemKey: 'gunpowder', quantity: 2 }], requiredTool: 'reloading_press' },
  { key: 'ammo_rifle', resultKey: 'ammo_rifle', resultQuantity: 4, ingredients: [{ itemKey: 'casings_rifle', quantity: 4 }, { itemKey: 'gunpowder', quantity: 2 }], requiredTool: 'reloading_press' },
  { key: 'ammo_bolt', resultKey: 'ammo_bolt', resultQuantity: 3, ingredients: [{ itemKey: 'scrap', quantity: 2 }, { itemKey: 'cloth', quantity: 1 }] },
  { key: 'ammo_arrow', resultKey: 'ammo_arrow', resultQuantity: 3, ingredients: [{ itemKey: 'scrap', quantity: 1 }, { itemKey: 'cloth', quantity: 2 }] },
  { key: 'ammo_357', resultKey: 'ammo_357', resultQuantity: 5, ingredients: [{ itemKey: 'casings', quantity: 5 }, { itemKey: 'gunpowder', quantity: 3 }], requiredTool: 'reloading_press' },
  { key: 'ammo_shotgun', resultKey: 'ammo_shotgun', resultQuantity: 4, ingredients: [{ itemKey: 'scrap', quantity: 3 }, { itemKey: 'gunpowder', quantity: 2 }], requiredTool: 'reloading_press' },
  { key: 'improvised_backpack', resultKey: 'improvised_backpack', resultQuantity: 1, ingredients: [{ itemKey: 'cloth', quantity: 3 }, { itemKey: 'scrap', quantity: 2 }] },
  { key: 'cap', resultKey: 'cap', resultQuantity: 1, ingredients: [{ itemKey: 'cloth', quantity: 2 }] },
  { key: 'gloves', resultKey: 'gloves', resultQuantity: 1, ingredients: [{ itemKey: 'cloth', quantity: 2 }, { itemKey: 'scrap', quantity: 1 }] },
  { key: 'tear_dress', resultKey: 'cloth', resultQuantity: 3, ingredients: [{ itemKey: 'old_dress', quantity: 1 }] },
  { key: 'tear_blanket', resultKey: 'cloth', resultQuantity: 4, ingredients: [{ itemKey: 'blanket', quantity: 1 }] },
  { key: 'tear_bedsheet', resultKey: 'cloth', resultQuantity: 3, ingredients: [{ itemKey: 'bedsheet', quantity: 1 }] },
  { key: 'rope', resultKey: 'rope', resultQuantity: 1, ingredients: [{ itemKey: 'cloth', quantity: 3 }] },
  { key: 'belt', resultKey: 'belt', resultQuantity: 1, ingredients: [{ itemKey: 'cloth', quantity: 2 }, { itemKey: 'rope', quantity: 1 }] },
  { key: 'crossbow', resultKey: 'crossbow', resultQuantity: 1, ingredients: [{ itemKey: 'scrap', quantity: 5 }, { itemKey: 'rope', quantity: 2 }] },
]

const WEAPON_UPGRADE_RECIPES: CraftRecipe[] = Object.values(ITEM_CATALOG)
  .filter(item => (item.type === 'weapon_melee' || item.type === 'weapon_ranged') && !item.key.endsWith(WEAPON_UPGRADE_SUFFIX))
  .map(base => {
    const scrapCost = Math.max(2, Math.ceil(estimateTradeValue(base) / 3))
    const ingredients: CraftIngredient[] = [{ itemKey: base.key, quantity: 1 }, { itemKey: 'scrap', quantity: scrapCost }]
    if (base.type === 'weapon_ranged') ingredients.push({ itemKey: 'gunpowder', quantity: 1 })
    return { key: `upgrade_${base.key}`, resultKey: `${base.key}${WEAPON_UPGRADE_SUFFIX}`, resultQuantity: 1, ingredients, requiredTool: 'workbench' }
  })
CRAFT_RECIPES.push(...WEAPON_UPGRADE_RECIPES)

export function getRecipe(key: string): CraftRecipe | undefined {
  return CRAFT_RECIPES.find(r => r.key === key)
}

export { isConsumable }
