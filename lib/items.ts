export type ItemType = 'weapon' | 'armor' | 'material' | 'consumable'
export type EquipSlot = 'head' | 'torso' | 'legs' | 'boots' | 'accessory' | 'backpack'
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export type Item = {
  id: string
  name: string
  type: ItemType
  slot?: EquipSlot
  warmth?: number // armor pieces
  armor?: number // armor pieces
  damage?: string // weapon dice, e.g. "1d6"
  statReq?: keyof import('./types').Stats
  backpackSlots?: number // backpack only: total inventory slots it grants
  value: number // combat/defense value, drives rarity
}

export function rarityOf(value: number): Rarity {
  if (value >= 20) return 'legendary'
  if (value >= 14) return 'epic'
  if (value >= 9) return 'rare'
  if (value >= 4) return 'uncommon'
  return 'common'
}

export const RARITY_LABELS: Record<Rarity, string> = {
  common: '⚪ Звичайна',
  uncommon: '🟢 Незвичайна',
  rare: '🔵 Рідкісна',
  epic: '🟣 Епічна',
  legendary: '🟠 Легендарна',
}

export const EQUIP_SLOT_LABELS: Record<EquipSlot, string> = {
  head: 'Голова',
  torso: 'Торс',
  legs: 'Ноги',
  boots: 'Взуття',
  accessory: 'Аксесуар',
  backpack: 'Рюкзак',
}

export const ITEMS: Item[] = [
  // Armor — head
  { id: 'cap_civilian', name: 'Цивільна кепка', type: 'armor', slot: 'head', warmth: 1, armor: 0, value: 1 },
  { id: 'helmet_tactical', name: 'Тактичний шолом', type: 'armor', slot: 'head', warmth: 2, armor: 5, value: 8 },
  { id: 'helmet_military', name: 'Військовий шолом', type: 'armor', slot: 'head', warmth: 3, armor: 9, value: 15 },

  // Armor — torso
  { id: 'jacket_civilian', name: 'Цивільна куртка', type: 'armor', slot: 'torso', warmth: 3, armor: 1, value: 2 },
  { id: 'vest_tactical', name: 'Тактичний жилет', type: 'armor', slot: 'torso', warmth: 2, armor: 6, value: 9 },
  { id: 'armor_military', name: 'Військова броня', type: 'armor', slot: 'torso', warmth: 4, armor: 12, value: 18 },

  // Armor — legs
  { id: 'pants_civilian', name: 'Звичайні штани', type: 'armor', slot: 'legs', warmth: 2, armor: 0, value: 1 },
  { id: 'pants_tactical', name: 'Тактичні штани', type: 'armor', slot: 'legs', warmth: 2, armor: 4, value: 6 },

  // Armor — boots
  { id: 'boots_civilian', name: 'Звичайні черевики', type: 'armor', slot: 'boots', warmth: 1, armor: 0, value: 1 },
  { id: 'boots_military', name: 'Берці', type: 'armor', slot: 'boots', warmth: 2, armor: 3, value: 5 },

  // Backpacks
  { id: 'backpack_none', name: 'Без рюкзака', type: 'armor', slot: 'backpack', value: 0, backpackSlots: 6 },
  { id: 'backpack_small', name: 'Малий рюкзак', type: 'armor', slot: 'backpack', value: 2, backpackSlots: 8 },
  { id: 'backpack_large', name: 'Великий рюкзак', type: 'armor', slot: 'backpack', value: 5, backpackSlots: 10 },
  { id: 'backpack_military', name: 'Військовий рюкзак', type: 'armor', slot: 'backpack', value: 10, backpackSlots: 15 },

  // Melee weapons
  { id: 'pipe', name: 'Труба', type: 'weapon', damage: '1d4', statReq: 'strength', value: 1 },
  { id: 'knife', name: 'Ніж', type: 'weapon', damage: '1d4', statReq: 'agility', value: 2 },
  { id: 'machete', name: 'Мачете', type: 'weapon', damage: '1d6', statReq: 'agility', value: 5 },
  { id: 'axe', name: 'Сокира', type: 'weapon', damage: '1d8', statReq: 'strength', value: 8 },
  { id: 'katana', name: 'Катана', type: 'weapon', damage: '1d10', statReq: 'agility', value: 16 },
  { id: 'sledgehammer', name: 'Кувалда', type: 'weapon', damage: '1d12', statReq: 'strength', value: 20 },

  // Ranged weapons
  { id: 'pistol', name: 'Пістолет', type: 'weapon', damage: '1d6', statReq: 'perception', value: 4 },
  { id: 'shotgun', name: 'Обріз', type: 'weapon', damage: '1d10', statReq: 'perception', value: 10 },
  { id: 'rifle', name: 'Гвинтівка', type: 'weapon', damage: '1d10', statReq: 'perception', value: 12 },
  { id: 'sniper', name: 'Снайперська гвинтівка', type: 'weapon', damage: '1d12', statReq: 'perception', value: 22 },

  // Materials
  { id: 'scrap', name: 'Металобрухт', type: 'material', value: 1 },
  { id: 'ammo_9mm', name: 'Набої 9мм', type: 'material', value: 1 },
  { id: 'bandage', name: 'Бинт', type: 'consumable', value: 1 },
  { id: 'medkit', name: 'Аптечка', type: 'consumable', value: 3 },
  { id: 'canned_food', name: 'Консерви', type: 'consumable', value: 1 },
]

export function getItem(id: string): Item | undefined {
  return ITEMS.find(i => i.id === id)
}
