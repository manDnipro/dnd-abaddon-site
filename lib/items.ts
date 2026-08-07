import { ClothingSlot, StatKey } from './types'

export type ItemType = 'weapon_melee' | 'weapon_ranged' | 'food' | 'water' | 'medical' | 'material' | 'clothing' | 'misc'

export interface ItemDefinition {
  key: string
  name: string
  type: ItemType
  description: string
  damageDice?: string
  statUsed?: StatKey
  ammoKey?: string
  hungerRestore?: number
  thirstRestore?: number
  healAmount?: number
  infectionReduce?: number
  moraleRestore?: number
  poisonChance?: number
  slot?: ClothingSlot
  warmth?: number
  armor?: number
  /** Doesn't restore hunger/thirst directly — grants this many future searches during which
   *  ExpeditionLevel.hungerCost/thirstCost are skipped entirely (see lib/expeditionEngine.ts and
   *  Character.energyChargesLeft). A stimulant, not a meal. */
  energyCharges?: number
}

export const ITEM_CATALOG: Record<string, ItemDefinition> = {
  bat: { key: 'bat', name: 'Бейсбольна бита', type: 'weapon_melee', description: 'Проста, надійна, тиха.', damageDice: '1d6', statUsed: 'str' },
  knife: { key: 'knife', name: 'Ніж', type: 'weapon_melee', description: 'Легкий і швидкий, добре лягає в руку.', damageDice: '1d4', statUsed: 'agi' },
  machete: { key: 'machete', name: 'Мачете', type: 'weapon_melee', description: 'Важче за ніж, ріже впевненіше.', damageDice: '1d6+1', statUsed: 'str' },
  axe: { key: 'axe', name: 'Сокира', type: 'weapon_melee', description: 'Повільна, але вбиває з одного удару частіше за інших.', damageDice: '1d8', statUsed: 'str' },
  pistol: { key: 'pistol', name: 'Пістолет', type: 'weapon_ranged', description: 'Компактний, гучний. Потребує набоїв 9мм.', damageDice: '1d8', statUsed: 'per', ammoKey: 'ammo_pistol' },
  rifle: { key: 'rifle', name: 'Гвинтівка', type: 'weapon_ranged', description: 'Влучна зброя далекого бою. Потребує гвинтівкових набоїв.', damageDice: '1d10', statUsed: 'per', ammoKey: 'ammo_rifle' },
  crossbow: { key: 'crossbow', name: 'Арбалет', type: 'weapon_ranged', description: 'Тихий, повільно перезаряджається. Потребує болтів.', damageDice: '1d8', statUsed: 'per', ammoKey: 'ammo_bolt' },
  pipe: { key: 'pipe', name: 'Труба', type: 'weapon_melee', description: 'Іржава металева труба. Краще за голі руки.', damageDice: '1d4', statUsed: 'str' },
  crowbar: { key: 'crowbar', name: 'Монтировка', type: 'weapon_melee', description: 'Зручна для замків і для черепів.', damageDice: '1d6', statUsed: 'str' },
  hammer: { key: 'hammer', name: 'Молоток', type: 'weapon_melee', description: 'Важкий будівельний молоток.', damageDice: '1d8', statUsed: 'str' },
  fire_axe: { key: 'fire_axe', name: 'Пожежна сокира', type: 'weapon_melee', description: 'Гостріша й важча за звичайну сокиру.', damageDice: '1d8+1', statUsed: 'str' },
  sledgehammer: { key: 'sledgehammer', name: 'Кувалда', type: 'weapon_melee', description: 'Повільна, зате одним ударом розвалює все на шматки.', damageDice: '2d8+2', statUsed: 'str' },
  combat_knife: { key: 'combat_knife', name: 'Бойовий ніж', type: 'weapon_melee', description: 'Балансований клинок.', damageDice: '1d6', statUsed: 'agi' },
  spear: { key: 'spear', name: 'Спис', type: 'weapon_melee', description: 'Довге держално дає бити першим.', damageDice: '1d8', statUsed: 'agi' },
  katana: { key: 'katana', name: 'Катана', type: 'weapon_melee', description: 'Неймовірно гостре лезо. Рідкісна зброя.', damageDice: '2d8+1', statUsed: 'agi' },
  revolver: { key: 'revolver', name: 'Револьвер', type: 'weapon_ranged', description: "Простий і надійний. Потребує набоїв .357.", damageDice: '1d8+1', statUsed: 'per', ammoKey: 'ammo_357' },
  smg: { key: 'smg', name: 'Пістолет-кулемет', type: 'weapon_ranged', description: 'Швидка черга набоїв 9мм.', damageDice: '1d8', statUsed: 'per', ammoKey: 'ammo_pistol' },
  compound_bow: { key: 'compound_bow', name: 'Блоковий лук', type: 'weapon_ranged', description: 'Тихіший за арбалет. Потребує стріл.', damageDice: '1d6', statUsed: 'per', ammoKey: 'ammo_arrow' },
  sawn_shotgun: { key: 'sawn_shotgun', name: 'Обріз', type: 'weapon_ranged', description: 'Нищівний зблизька. Потребує дробу.', damageDice: '2d4', statUsed: 'per', ammoKey: 'ammo_shotgun' },
  hunting_rifle: { key: 'hunting_rifle', name: 'Мисливська гвинтівка', type: 'weapon_ranged', description: 'Точніша й потужніша за звичайну.', damageDice: '1d12', statUsed: 'per', ammoKey: 'ammo_rifle' },
  sniper_rifle: { key: 'sniper_rifle', name: 'Снайперська гвинтівка', type: 'weapon_ranged', description: 'Найпотужніша зброя далекого бою.', damageDice: '2d8+2', statUsed: 'per', ammoKey: 'ammo_rifle' },

  ammo_shotgun: { key: 'ammo_shotgun', name: 'Дріб', type: 'misc', description: 'Боєприпаси для обріза.' },
  ammo_pistol: { key: 'ammo_pistol', name: 'Набої 9мм', type: 'misc', description: 'Боєприпаси для пістолета.' },
  ammo_rifle: { key: 'ammo_rifle', name: 'Гвинтівкові набої', type: 'misc', description: 'Боєприпаси для гвинтівки.' },
  ammo_bolt: { key: 'ammo_bolt', name: 'Арбалетні болти', type: 'misc', description: 'Боєприпаси для арбалета.' },
  ammo_arrow: { key: 'ammo_arrow', name: 'Стріли', type: 'misc', description: 'Боєприпаси для блокового лука.' },
  ammo_357: { key: 'ammo_357', name: 'Набої .357', type: 'misc', description: 'Боєприпаси для револьвера.' },

  canned_food: { key: 'canned_food', name: 'Консерви', type: 'food', description: 'Тушонка чи консервовані овочі.', hungerRestore: 40 },
  energy_bar: { key: 'energy_bar', name: 'Енергетичний батончик', type: 'food', description: 'Швидкий перекус.', hungerRestore: 20 },
  water_bottle: { key: 'water_bottle', name: 'Пляшка води', type: 'water', description: 'Чиста питна вода.', thirstRestore: 40 },
  empty_flask: { key: 'empty_flask', name: 'Пуста фляга', type: 'misc', description: 'Порожня фляга — наповни водою з колонки в таборі, перш ніж брати на вилазку.' },
  filled_flask: { key: 'filled_flask', name: 'Фляга з водою', type: 'water', description: 'Наповнена фляга — можна взяти на вилазку.', thirstRestore: 50 },
  mystery_can: { key: 'mystery_can', name: 'Загадкові консерви', type: 'food', description: 'Бляшанка без етикетки.', hungerRestore: 25, poisonChance: 35 },
  energy_drink_1: { key: 'energy_drink_1', name: 'Енергетик (слабкий)', type: 'food', description: 'Дешева хімія — тримає на ногах ще пару вилазкових пошуків без їжі й води.', energyCharges: 2 },
  energy_drink_2: { key: 'energy_drink_2', name: 'Енергетик (сильний)', type: 'food', description: 'Концентрована суміш кофеїну й стимуляторів — заглушає голод і спрагу надовше.', energyCharges: 4 },
  energy_drink_3: { key: 'energy_drink_3', name: 'Енергетик (преміум)', type: 'food', description: 'Довоєнна лабораторна розробка — рідкість, якою не розкидаються.', energyCharges: 7 },
  bandage: { key: 'bandage', name: 'Бинт', type: 'medical', description: 'Зупиняє кровотечу, трохи гоїть рани.', healAmount: 10 },
  medkit: { key: 'medkit', name: 'Аптечка', type: 'medical', description: 'Повний набір першої допомоги.', healAmount: 30, infectionReduce: 20 },
  antibiotics: { key: 'antibiotics', name: 'Антибіотики', type: 'medical', description: 'Значно знижує рівень інфекції.', infectionReduce: 50 },
  whiskey: { key: 'whiskey', name: 'Пляшка віскі', type: 'misc', description: 'Піднімає бойовий дух.', moraleRestore: 15 },

  rat_meat: { key: 'rat_meat', name: 'Смажений щур', type: 'food', description: 'Здобич полювання. Не вишукано, зате ситно.', hungerRestore: 12, poisonChance: 20 },
  pigeon_meat: { key: 'pigeon_meat', name: 'Смажений голуб', type: 'food', description: 'Здобич полювання. М\'яса небагато, зате птах трапляється часто.', hungerRestore: 18, poisonChance: 12 },
  crow_meat: { key: 'crow_meat', name: 'Смажена ворона', type: 'food', description: 'Здобич полювання. Жорсткувате м\'ясо.', hungerRestore: 16, poisonChance: 15 },
  seagull_meat: { key: 'seagull_meat', name: 'Смажена чайка', type: 'food', description: 'Здобич полювання. Більший птах — ситніший.', hungerRestore: 22, poisonChance: 10 },

  scrap: { key: 'scrap', name: 'Металобрухт', type: 'material', description: 'Придатний для ремонту чи крафту.' },
  casings: { key: 'casings', name: 'Гільзи 9мм', type: 'material', description: 'Порожні гільзи.' },
  casings_rifle: { key: 'casings_rifle', name: 'Гільзи 7.62×54', type: 'material', description: 'Порожні гільзи.' },
  gunpowder: { key: 'gunpowder', name: 'Порох', type: 'material', description: 'Для спорядження набоїв.' },
  reloading_press: { key: 'reloading_press', name: 'Машинка для пресу', type: 'misc', description: 'Багаторазова, не витрачається.' },
  workbench: { key: 'workbench', name: 'Верстак', type: 'misc', description: 'Багаторазовий, не витрачається.' },
  cloth: { key: 'cloth', name: 'Тканина', type: 'material', description: 'Можна пустити на бинти чи латки.' },
  old_dress: { key: 'old_dress', name: 'Стара сукня', type: 'material', description: 'Можна розірвати на тканину.' },
  blanket: { key: 'blanket', name: 'Ковдра', type: 'material', description: 'Багато тканини, якщо розірвати.' },
  bedsheet: { key: 'bedsheet', name: 'Простирадло', type: 'material', description: 'Можна розірвати на тканину.' },
  rope: { key: 'rope', name: 'Мотузка', type: 'material', description: 'Придатна для багатьох виробів.' },
  fuel: { key: 'fuel', name: 'Паливо', type: 'material', description: 'Каністра пального.' },
  cement_bag: { key: 'cement_bag', name: 'Мішок цементу', type: 'material', description: 'Важкий, злежався, але ще придатний для будівництва.' },
  sand_bag: { key: 'sand_bag', name: 'Мішок піску', type: 'material', description: 'Будівельний пісок — для розчину чи мішків з піском.' },
  boards: { key: 'boards', name: 'Дошки', type: 'material', description: 'Обрізна деревина, придатна для каркасу чи обшивки.' },
  nails: { key: 'nails', name: 'Цвяхи', type: 'material', description: 'Жменя цвяхів — нічого не збудуєш без них.' },
  rebar: { key: 'rebar', name: 'Арматура', type: 'material', description: 'Металеві прути для армування бетону.' },
  glass: { key: 'glass', name: 'Скло', type: 'material', description: 'Цілі листи скла — рідкість, легко б\'ються.' },
  roofing_felt: { key: 'roofing_felt', name: 'Рубероїд', type: 'material', description: 'Рулонний матеріал для покрівлі.' },

  belt: { key: 'belt', name: 'Пояс', type: 'clothing', description: 'Міцний пояс.', slot: 'accessory', warmth: 0, armor: 1 },
  cap: { key: 'cap', name: 'Кепка', type: 'clothing', description: 'Легкий головний убір.', slot: 'head', warmth: 2, armor: 0 },
  helmet: { key: 'helmet', name: 'Каска', type: 'clothing', description: 'Важка, добре захищає голову.', slot: 'head', warmth: 1, armor: 4 },
  balaclava: { key: 'balaclava', name: 'Балаклава', type: 'clothing', description: 'Чудово тримає тепло.', slot: 'head', warmth: 4, armor: 0 },
  tshirt: { key: 'tshirt', name: 'Футболка', type: 'clothing', description: 'Звичайна тонка футболка.', slot: 'torso', warmth: 1, armor: 0 },
  jacket: { key: 'jacket', name: 'Куртка', type: 'clothing', description: 'Непогано гріє.', slot: 'torso', warmth: 6, armor: 1 },
  winter_coat: { key: 'winter_coat', name: 'Зимова куртка', type: 'clothing', description: 'Важка, тепла.', slot: 'torso', warmth: 14, armor: 1 },
  leather_jacket: { key: 'leather_jacket', name: 'Шкіряна куртка', type: 'clothing', description: 'Дещо захищає від порізів.', slot: 'torso', warmth: 5, armor: 3 },
  kevlar_vest: { key: 'kevlar_vest', name: 'Бронежилет', type: 'clothing', description: 'Важкий кевларовий захист.', slot: 'torso', warmth: 2, armor: 9 },
  jeans: { key: 'jeans', name: 'Джинси', type: 'clothing', description: 'Звичайні джинси.', slot: 'legs', warmth: 3, armor: 1 },
  cargo_pants: { key: 'cargo_pants', name: 'Карго-штани', type: 'clothing', description: 'Міцна тканина з кишенями.', slot: 'legs', warmth: 5, armor: 2 },
  thermal_pants: { key: 'thermal_pants', name: 'Термоштани', type: 'clothing', description: 'Для холодної погоди.', slot: 'legs', warmth: 9, armor: 1 },
  sneakers: { key: 'sneakers', name: 'Кросівки', type: 'clothing', description: 'Легкі, майже не гріють.', slot: 'feet', warmth: 1, armor: 0 },
  boots: { key: 'boots', name: 'Берці', type: 'clothing', description: 'Міцне взуття.', slot: 'feet', warmth: 4, armor: 2 },
  winter_boots: { key: 'winter_boots', name: 'Зимові чоботи', type: 'clothing', description: 'Утеплені проти морозу.', slot: 'feet', warmth: 8, armor: 1 },
  gloves: { key: 'gloves', name: 'Рукавиці', type: 'clothing', description: 'Захищають руки.', slot: 'accessory', warmth: 3, armor: 1 },
  scarf: { key: 'scarf', name: 'Шарф', type: 'clothing', description: 'Тримає тепло шиї.', slot: 'accessory', warmth: 4, armor: 0 },
  improvised_backpack: { key: 'improvised_backpack', name: 'Саморобний рюкзак', type: 'clothing', description: 'Краще за нічого.', slot: 'backpack', warmth: 1, armor: 0 },
  hiking_backpack: { key: 'hiking_backpack', name: 'Туристичний рюкзак', type: 'clothing', description: 'Міцний рюкзак.', slot: 'backpack', warmth: 2, armor: 0 },
  tactical_backpack: { key: 'tactical_backpack', name: 'Тактичний рюкзак', type: 'clothing', description: 'Армований матеріал.', slot: 'backpack', warmth: 1, armor: 2 },
  tactical_helmet: { key: 'tactical_helmet', name: 'Тактичний шолом', type: 'clothing', description: 'Композитний шолом.', slot: 'head', warmth: 2, armor: 6 },
  ops_helmet: { key: 'ops_helmet', name: 'Шолом спецпризначення', type: 'clothing', description: 'Балістичний шолом.', slot: 'head', warmth: 2, armor: 9 },
  pilot_jacket: { key: 'pilot_jacket', name: 'Куртка пілота', type: 'clothing', description: 'Хутряний комір.', slot: 'torso', warmth: 10, armor: 2 },
  tactical_jacket: { key: 'tactical_jacket', name: 'Тактична куртка', type: 'clothing', description: 'Кишені під плити.', slot: 'torso', warmth: 4, armor: 6 },
  combat_jacket: { key: 'combat_jacket', name: 'Бойова куртка', type: 'clothing', description: 'Вмонтовані плити.', slot: 'torso', warmth: 5, armor: 8 },
  tactical_pants: { key: 'tactical_pants', name: 'Тактичні штани', type: 'clothing', description: 'Посилені коліна.', slot: 'legs', warmth: 4, armor: 4 },
  combat_pants: { key: 'combat_pants', name: 'Бойові штани', type: 'clothing', description: 'Ефективні вставки.', slot: 'legs', warmth: 5, armor: 6 },
  tactical_boots: { key: 'tactical_boots', name: 'Тактичні берці', type: 'clothing', description: 'Зміцнений носок.', slot: 'feet', warmth: 5, armor: 4 },
  combat_boots: { key: 'combat_boots', name: 'Бойові берці', type: 'clothing', description: 'Найкраще взуття.', slot: 'feet', warmth: 6, armor: 7 },
  tactical_gloves: { key: 'tactical_gloves', name: 'Тактичні рукавиці', type: 'clothing', description: 'Посилені кісточки.', slot: 'accessory', warmth: 2, armor: 3 },
  chest_rig: { key: 'chest_rig', name: 'Розвантажувальний жилет', type: 'clothing', description: 'Точкова броня поверх.', slot: 'accessory', warmth: 1, armor: 5 },
  military_backpack: { key: 'military_backpack', name: 'Військовий рюкзак', type: 'clothing', description: 'Посилена спинка.', slot: 'backpack', warmth: 2, armor: 4 },
}

export const WEAPON_UPGRADE_SUFFIX = '_tempered'

function upgradeDamageDice(dice: string): string {
  const match = /^(\d*)d(\d+)([+-]\d+)?$/i.exec(dice)
  if (!match) return dice
  const [, countStr, sides, bonusStr] = match
  const bonus = (bonusStr ? parseInt(bonusStr, 10) : 0) + 2
  return `${countStr || '1'}d${sides}+${bonus}`
}

for (const base of Object.values(ITEM_CATALOG)) {
  if (base.type !== 'weapon_melee' && base.type !== 'weapon_ranged') continue
  const upgradedKey = `${base.key}${WEAPON_UPGRADE_SUFFIX}`
  ITEM_CATALOG[upgradedKey] = {
    ...base,
    key: upgradedKey,
    name: `${base.name} [Покращено]`,
    description: `Покращена версія: ${base.description} Після доробки на верстаку б'є відчутно сильніше.`,
    damageDice: upgradeDamageDice(base.damageDice ?? '1d4'),
  }
}

export function getItem(key: string): ItemDefinition | undefined {
  return ITEM_CATALOG[key]
}

export function isConsumable(item: ItemDefinition): boolean {
  return item.type === 'food' || item.type === 'water' || item.type === 'medical' || item.moraleRestore !== undefined
}

const TRADE_VALUE_OVERRIDES: Record<string, number> = {
  reloading_press: 12, workbench: 10, rope: 3, old_dress: 2, blanket: 2, bedsheet: 2,
  // Energy drinks are meant to be a real splurge, not a routine buy — priced well above what a
  // plain food/water item of similar rarity would cost, scaling with how many searches they cover.
  energy_drink_1: 10, energy_drink_2: 20, energy_drink_3: 35,
}

function averageDiceRoll(dice: string): number {
  const match = /^(\d*)d(\d+)([+-]\d+)?$/i.exec(dice.trim())
  if (!match) return 3
  const count = match[1] ? parseInt(match[1], 10) : 1
  const sides = parseInt(match[2], 10)
  const bonus = match[3] ? parseInt(match[3], 10) : 0
  return count * ((sides + 1) / 2) + bonus
}

export function estimateTradeValue(item: ItemDefinition): number {
  const override = TRADE_VALUE_OVERRIDES[item.key]
  if (override !== undefined) return override
  switch (item.type) {
    case 'weapon_melee':
    case 'weapon_ranged':
      return Math.max(2, Math.round(3 + averageDiceRoll(item.damageDice ?? '1d4')))
    case 'medical':
      return Math.max(1, Math.round(1 + (item.healAmount ?? 0) / 8 + (item.infectionReduce ?? 0) / 8))
    case 'food':
      return Math.max(1, Math.round(1 + (item.hungerRestore ?? 0) / 15))
    case 'water':
      return Math.max(1, Math.round(1 + (item.thirstRestore ?? 0) / 15))
    case 'clothing':
      return Math.max(1, Math.round(1 + (item.warmth ?? 0) / 3 + (item.armor ?? 0) * 1.5))
    case 'misc':
      return item.moraleRestore ? Math.max(1, Math.round(1 + item.moraleRestore / 8)) : 1
    case 'material':
    default:
      return 1
  }
}

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export const RARITY_LABELS: Record<ItemRarity, string> = {
  common: '⚪ Звичайна', uncommon: '🟢 Незвичайна', rare: '🔵 Рідкісна', epic: '🟣 Епічна', legendary: '🟠 Легендарна',
}

export function getItemRarity(item: ItemDefinition): ItemRarity {
  const value = estimateTradeValue(item)
  if (value >= 13) return 'legendary'
  if (value >= 9) return 'epic'
  if (value >= 6) return 'rare'
  if (value >= 3) return 'uncommon'
  return 'common'
}

export const CLOTHING_SLOT_LABELS: Record<ClothingSlot, string> = {
  head: 'Голова', torso: 'Торс', legs: 'Ноги', feet: 'Взуття', accessory: 'Аксесуар', backpack: 'Рюкзак',
}
