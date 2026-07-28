function weightedPick<T extends { weight: number }>(entries: T[]): T {
  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0)
  let roll = Math.random() * totalWeight
  for (const entry of entries) {
    roll -= entry.weight
    if (roll <= 0) return entry
  }
  return entries[entries.length - 1]
}

export interface LootEntry { itemKey: string; minQuantity: number; maxQuantity: number; weight: number }

const SEARCH_LOCATIONS = [
  'порпається у смітнику за магазином', 'обшукує покинуте авто на узбіччі', 'лазить руїнами розваленої будівлі',
  'нишпорить у покинутому будинку', 'перевіряє полиці закинутого магазину', 'оглядає покинуту заправку',
  'риється у підвалі занедбаного будинку', 'обходить закинутий склад', 'шукає по кишенях в покинутому наметі',
  'перетрушує вміст покинутої шафки в роздягальні', 'пробирається крізь завалений під’їзд багатоповерхівки',
  'обшукує кабінет директора в закинутій школі', 'нишпорить серед розбитих полиць аптеки',
  'риється у кузові перевернутої фури на трасі', 'обстежує занедбану автомайстерню',
  'зазирає під сидіння покинутого автобуса', 'обходить іржаві контейнери на пустирі',
  'перевіряє шафки в роздягальні спортзалу', 'лазить по горищу зруйнованого маєтку',
  'нишпорить серед пожежі, що давно згасла, на складі', 'обшукує кабінет лікаря в закинутій поліклініці',
  'риється в багажнику розбитого позашляховика', 'заходить у затоплений підвал багатоповерхівки',
  'обходить руїни заправної станції з вибитими вікнами', 'перевіряє наплічники біля трупів на блокпості',
  'зазирає у прострелений вагончик на будівництві', 'обшукує полиці бібліотеки, засипаної штукатуркою',
  'нишпорить серед завалених стелажів супермаркету', 'риється у покинутому наметі мисливців',
  'обходить іржаву дитячу площадку в пошуках схованки', 'обшукує кабінет директора закинутого заводу',
]
export function rollSearchLocation(): string {
  return SEARCH_LOCATIONS[Math.floor(Math.random() * SEARCH_LOCATIONS.length)]
}

export const SPECIAL_ENCOUNTER_CHANCE = 0.15
export type SpecialEncounterType = 'weak_zombie' | 'friendly_npc' | 'interesting_location'
const SPECIAL_ENCOUNTER_TABLE: { type: SpecialEncounterType; weight: number }[] = [
  { type: 'weak_zombie', weight: 40 }, { type: 'friendly_npc', weight: 30 }, { type: 'interesting_location', weight: 30 },
]
export function rollSpecialEncounterType(): SpecialEncounterType {
  return weightedPick(SPECIAL_ENCOUNTER_TABLE).type
}

// Flavor lines for the on-site "interesting location" side-find — varies what the extra loot was tucked into.
const INTERESTING_LOCATIONS = [
  'схованку під підлогою покинутого будинку', 'замасковану заначку в дуплі дерева', 'забутий рюкзак туриста',
  'сейф із зірваними дверцятами', 'сховок під сходами', 'тайник за розхитаною цеглиною в стіні',
  'закопаний ящик під старою альтанкою', 'заначку в бачку унітазу занедбаної квартири',
  'запасний баул під матрацом покинутого ліжка', 'нішу за фальшивою стінкою в підвалі',
  'старий сейф-скриньку, вмуровану в підлогу гаража', 'мисливську схованку в стовбурі трухлявого дерева',
  'валізу, заховану на дні пересохлого колодязя', 'потаємну шафку за картиною в закинутому будинку',
]
export function rollInterestingLocation(): string {
  return INTERESTING_LOCATIONS[Math.floor(Math.random() * INTERESTING_LOCATIONS.length)]
}

export type NpcGender = 'male' | 'female'
export interface FriendlyNpcTemplate { name: string; gender: NpcGender }
const FRIENDLY_NPC_NAMES: FriendlyNpcTemplate[] = [
  { name: 'Мандрівний торговець', gender: 'male' }, { name: 'Мандрівна торговка', gender: 'female' },
  { name: 'Виснажений вцілілий', gender: 'male' }, { name: 'Виснажена вціліла', gender: 'female' },
  { name: 'Колишній солдат', gender: 'male' }, { name: 'Колишня військова медсестра', gender: 'female' },
  { name: 'Місцевий фермер', gender: 'male' }, { name: 'Місцева фермерка', gender: 'female' },
  { name: 'Загублений хлопчина з собакою', gender: 'male' }, { name: 'Загублена дівчинка з собакою', gender: 'female' },
  { name: 'Старий мисливець-відлюдник', gender: 'male' }, { name: 'Втомлена мандрівниця з рюкзаком', gender: 'female' },
  { name: 'Колишній механік із заправки', gender: 'male' }, { name: 'Колишня вчителька з довколишньої школи', gender: 'female' },
  { name: 'Мовчазний сталкер у протигазі', gender: 'male' }, { name: 'Радистка-одиначка з обгорілою рацією', gender: 'female' },
]
export function rollFriendlyNpcTemplate(): FriendlyNpcTemplate {
  return FRIENDLY_NPC_NAMES[Math.floor(Math.random() * FRIENDLY_NPC_NAMES.length)]
}

// Flavor for the brief chat with a friendly NPC met on the road — always ends peacefully, but the
// specifics of the exchange vary so two encounters never read quite the same.
const FRIENDLY_NPC_LINES = [
  'ділиться чуткою про безпечний маршрут неподалік', 'попереджає про кубло заражених за поворотом',
  'пригощає теплим чаєм із термоса й розповідає новини табору', 'показує на карті позначену небезпечну зону',
  'коротко розповідає, як вижив цей час, і бажає вдачі', 'ділиться сигаретою та мовчить решту розмови',
  'згадує старі часи до Спалаху — стає сумно, але легше на серці', 'застерігає не ходити вночі цими вулицями',
  'обмінюється парою слів про загиблих спільних знайомих', 'показує саморобний оберіг «на удачу» і всміхається',
]
export function rollFriendlyNpcLine(): string {
  return FRIENDLY_NPC_LINES[Math.floor(Math.random() * FRIENDLY_NPC_LINES.length)]
}

// Vivid appearance lines for a zombie/ambush encounter — picked at random so combat logs don't repeat.
const ZOMBIE_INTRO_LINES = [
  'вивалюється з-за рогу, хрипко харчачи', 'спотикаючись, шкандибає просто назустріч',
  'вискакує з темного дверного прорізу', 'продирається крізь завал сміття, тягнучи ногу',
  'з гуркотом валиться зі сходів просто під ноги', 'виповзає з-під перекинутого автомобіля',
  'з’являється з густого туману, хрипко втягуючи повітря', 'ламає прогнилі дошки й вивалюється назустріч',
]
export function rollZombieIntroLine(): string {
  return ZOMBIE_INTRO_LINES[Math.floor(Math.random() * ZOMBIE_INTRO_LINES.length)]
}

export const LOOT_TIERS: Record<number, LootEntry[]> = {
  1: [
    { itemKey: 'canned_food', minQuantity: 1, maxQuantity: 2, weight: 10 },
    { itemKey: 'energy_bar', minQuantity: 1, maxQuantity: 2, weight: 10 },
    { itemKey: 'water_bottle', minQuantity: 1, maxQuantity: 2, weight: 10 },
    { itemKey: 'mystery_can', minQuantity: 1, maxQuantity: 1, weight: 8 },
    { itemKey: 'scrap', minQuantity: 1, maxQuantity: 3, weight: 16 },
    { itemKey: 'cloth', minQuantity: 1, maxQuantity: 3, weight: 15 },
    { itemKey: 'old_dress', minQuantity: 1, maxQuantity: 1, weight: 8 },
    { itemKey: 'blanket', minQuantity: 1, maxQuantity: 1, weight: 7 },
    { itemKey: 'bedsheet', minQuantity: 1, maxQuantity: 1, weight: 8 },
    { itemKey: 'casings', minQuantity: 1, maxQuantity: 4, weight: 9 },
    { itemKey: 'gunpowder', minQuantity: 1, maxQuantity: 2, weight: 7 },
    { itemKey: 'cap', minQuantity: 1, maxQuantity: 1, weight: 8 },
    { itemKey: 'tshirt', minQuantity: 1, maxQuantity: 1, weight: 7 },
    { itemKey: 'sneakers', minQuantity: 1, maxQuantity: 1, weight: 7 },
    { itemKey: 'improvised_backpack', minQuantity: 1, maxQuantity: 1, weight: 7 },
    { itemKey: 'pipe', minQuantity: 1, maxQuantity: 1, weight: 6 },
    { itemKey: 'bat', minQuantity: 1, maxQuantity: 1, weight: 6 },
  ],
  2: [
    { itemKey: 'canned_food', minQuantity: 1, maxQuantity: 2, weight: 9 },
    { itemKey: 'energy_bar', minQuantity: 1, maxQuantity: 2, weight: 9 },
    { itemKey: 'water_bottle', minQuantity: 1, maxQuantity: 2, weight: 9 },
    { itemKey: 'mystery_can', minQuantity: 1, maxQuantity: 1, weight: 7 },
    { itemKey: 'scrap', minQuantity: 1, maxQuantity: 3, weight: 11 },
    { itemKey: 'cloth', minQuantity: 1, maxQuantity: 3, weight: 10 },
    { itemKey: 'old_dress', minQuantity: 1, maxQuantity: 1, weight: 6 },
    { itemKey: 'blanket', minQuantity: 1, maxQuantity: 1, weight: 5 },
    { itemKey: 'bedsheet', minQuantity: 1, maxQuantity: 1, weight: 6 },
    { itemKey: 'casings', minQuantity: 1, maxQuantity: 4, weight: 8 },
    { itemKey: 'gunpowder', minQuantity: 1, maxQuantity: 2, weight: 6 },
    { itemKey: 'bandage', minQuantity: 1, maxQuantity: 2, weight: 7 },
    { itemKey: 'ammo_pistol', minQuantity: 2, maxQuantity: 5, weight: 7 },
    { itemKey: 'ammo_357', minQuantity: 2, maxQuantity: 5, weight: 4 },
    { itemKey: 'knife', minQuantity: 1, maxQuantity: 1, weight: 4 },
    { itemKey: 'whiskey', minQuantity: 1, maxQuantity: 1, weight: 3 },
    { itemKey: 'jacket', minQuantity: 1, maxQuantity: 1, weight: 7 },
    { itemKey: 'jeans', minQuantity: 1, maxQuantity: 1, weight: 6 },
    { itemKey: 'boots', minQuantity: 1, maxQuantity: 1, weight: 4 },
    { itemKey: 'gloves', minQuantity: 1, maxQuantity: 1, weight: 3 },
    { itemKey: 'hiking_backpack', minQuantity: 1, maxQuantity: 1, weight: 4 },
    { itemKey: 'crowbar', minQuantity: 1, maxQuantity: 1, weight: 4 },
    { itemKey: 'combat_knife', minQuantity: 1, maxQuantity: 1, weight: 4 },
    { itemKey: 'revolver', minQuantity: 1, maxQuantity: 1, weight: 3 },
  ],
  3: [
    { itemKey: 'canned_food', minQuantity: 1, maxQuantity: 2, weight: 7 },
    { itemKey: 'water_bottle', minQuantity: 1, maxQuantity: 2, weight: 7 },
    { itemKey: 'mystery_can', minQuantity: 1, maxQuantity: 1, weight: 6 },
    { itemKey: 'scrap', minQuantity: 1, maxQuantity: 4, weight: 9 },
    { itemKey: 'cloth', minQuantity: 1, maxQuantity: 4, weight: 8 },
    { itemKey: 'casings', minQuantity: 1, maxQuantity: 5, weight: 7 },
    { itemKey: 'casings_rifle', minQuantity: 1, maxQuantity: 4, weight: 5 },
    { itemKey: 'gunpowder', minQuantity: 1, maxQuantity: 3, weight: 6 },
    { itemKey: 'reloading_press', minQuantity: 1, maxQuantity: 1, weight: 2 },
    { itemKey: 'workbench', minQuantity: 1, maxQuantity: 1, weight: 2 },
    { itemKey: 'bandage', minQuantity: 1, maxQuantity: 2, weight: 7 },
    { itemKey: 'medkit', minQuantity: 1, maxQuantity: 1, weight: 6 },
    { itemKey: 'ammo_pistol', minQuantity: 3, maxQuantity: 6, weight: 7 },
    { itemKey: 'ammo_rifle', minQuantity: 2, maxQuantity: 5, weight: 7 },
    { itemKey: 'machete', minQuantity: 1, maxQuantity: 1, weight: 6 },
    { itemKey: 'fuel', minQuantity: 1, maxQuantity: 1, weight: 6 },
    { itemKey: 'ammo_bolt', minQuantity: 2, maxQuantity: 5, weight: 6 },
    { itemKey: 'ammo_arrow', minQuantity: 2, maxQuantity: 5, weight: 6 },
    { itemKey: 'leather_jacket', minQuantity: 1, maxQuantity: 1, weight: 6 },
    { itemKey: 'cargo_pants', minQuantity: 1, maxQuantity: 1, weight: 6 },
    { itemKey: 'scarf', minQuantity: 1, maxQuantity: 1, weight: 5 },
    { itemKey: 'balaclava', minQuantity: 1, maxQuantity: 1, weight: 4 },
    { itemKey: 'pilot_jacket', minQuantity: 1, maxQuantity: 1, weight: 4 },
    { itemKey: 'tactical_pants', minQuantity: 1, maxQuantity: 1, weight: 4 },
    { itemKey: 'tactical_gloves', minQuantity: 1, maxQuantity: 1, weight: 4 },
    { itemKey: 'military_backpack', minQuantity: 1, maxQuantity: 1, weight: 4 },
    { itemKey: 'hammer', minQuantity: 1, maxQuantity: 1, weight: 5 },
    { itemKey: 'spear', minQuantity: 1, maxQuantity: 1, weight: 5 },
    { itemKey: 'compound_bow', minQuantity: 1, maxQuantity: 1, weight: 4 },
    { itemKey: 'smg', minQuantity: 1, maxQuantity: 1, weight: 4 },
    { itemKey: 'sawn_shotgun', minQuantity: 1, maxQuantity: 1, weight: 4 },
    { itemKey: 'ammo_shotgun', minQuantity: 2, maxQuantity: 5, weight: 5 },
  ],
  4: [
    { itemKey: 'medkit', minQuantity: 1, maxQuantity: 2, weight: 9 },
    { itemKey: 'antibiotics', minQuantity: 1, maxQuantity: 1, weight: 8 },
    { itemKey: 'mystery_can', minQuantity: 1, maxQuantity: 2, weight: 5 },
    { itemKey: 'ammo_rifle', minQuantity: 3, maxQuantity: 6, weight: 9 },
    { itemKey: 'ammo_pistol', minQuantity: 3, maxQuantity: 6, weight: 8 },
    { itemKey: 'casings_rifle', minQuantity: 2, maxQuantity: 5, weight: 6 },
    { itemKey: 'fuel', minQuantity: 1, maxQuantity: 2, weight: 7 },
    { itemKey: 'axe', minQuantity: 1, maxQuantity: 1, weight: 7 },
    { itemKey: 'pistol', minQuantity: 1, maxQuantity: 1, weight: 7 },
    { itemKey: 'rifle', minQuantity: 1, maxQuantity: 1, weight: 5 },
    { itemKey: 'crossbow', minQuantity: 1, maxQuantity: 1, weight: 5 },
    { itemKey: 'scrap', minQuantity: 2, maxQuantity: 5, weight: 6 },
    { itemKey: 'cloth', minQuantity: 2, maxQuantity: 5, weight: 5 },
    { itemKey: 'kevlar_vest', minQuantity: 1, maxQuantity: 1, weight: 5 },
    { itemKey: 'helmet', minQuantity: 1, maxQuantity: 1, weight: 4 },
    { itemKey: 'winter_coat', minQuantity: 1, maxQuantity: 1, weight: 4 },
    { itemKey: 'thermal_pants', minQuantity: 1, maxQuantity: 1, weight: 4 },
    { itemKey: 'winter_boots', minQuantity: 1, maxQuantity: 1, weight: 4 },
    { itemKey: 'tactical_backpack', minQuantity: 1, maxQuantity: 1, weight: 4 },
    { itemKey: 'tactical_jacket', minQuantity: 1, maxQuantity: 1, weight: 4 },
    { itemKey: 'tactical_helmet', minQuantity: 1, maxQuantity: 1, weight: 4 },
    { itemKey: 'combat_pants', minQuantity: 1, maxQuantity: 1, weight: 4 },
    { itemKey: 'tactical_boots', minQuantity: 1, maxQuantity: 1, weight: 4 },
    { itemKey: 'chest_rig', minQuantity: 1, maxQuantity: 1, weight: 4 },
    { itemKey: 'combat_jacket', minQuantity: 1, maxQuantity: 1, weight: 2 },
    { itemKey: 'ops_helmet', minQuantity: 1, maxQuantity: 1, weight: 2 },
    { itemKey: 'combat_boots', minQuantity: 1, maxQuantity: 1, weight: 2 },
    { itemKey: 'fire_axe', minQuantity: 1, maxQuantity: 1, weight: 5 },
    { itemKey: 'hunting_rifle', minQuantity: 1, maxQuantity: 1, weight: 5 },
    { itemKey: 'sledgehammer', minQuantity: 1, maxQuantity: 1, weight: 2 },
    { itemKey: 'katana', minQuantity: 1, maxQuantity: 1, weight: 2 },
    { itemKey: 'sniper_rifle', minQuantity: 1, maxQuantity: 1, weight: 2 },
  ],
}

export interface RolledLoot { itemKey: string; quantity: number }
export function rollLoot(tier: number): RolledLoot {
  const table = LOOT_TIERS[tier] ?? LOOT_TIERS[1]
  const entry = weightedPick(table)
  const quantity = entry.minQuantity === entry.maxQuantity
    ? entry.minQuantity
    : entry.minQuantity + Math.floor(Math.random() * (entry.maxQuantity - entry.minQuantity + 1))
  return { itemKey: entry.itemKey, quantity }
}

export interface ExpeditionLevel {
  key: string; index: number; label: string; dc: number; hungerCost: number; thirstCost: number; riskChance: number
}

export const EXPEDITION_LEVELS: ExpeditionLevel[] = [
  { key: 'easy', index: 1, label: '🟢 Легка — околиці табору', dc: 8, hungerCost: 6, thirstCost: 6, riskChance: 0.15 },
  { key: 'medium', index: 2, label: '🟡 Середня — покинуті будівлі', dc: 12, hungerCost: 9, thirstCost: 9, riskChance: 0.3 },
  { key: 'hard', index: 3, label: '🟠 Важка — промзона', dc: 15, hungerCost: 12, thirstCost: 12, riskChance: 0.45 },
  { key: 'extreme', index: 4, label: '🔴 Екстремальна — епіцентр', dc: 18, hungerCost: 15, thirstCost: 15, riskChance: 0.6 },
]
export function getExpeditionLevel(key: string): ExpeditionLevel | undefined {
  return EXPEDITION_LEVELS.find(l => l.key === key)
}

const TRAVEL_MINUTES_PER_LEVEL = 5
export function travelMinutesForLevel(index: number): number {
  return index * TRAVEL_MINUTES_PER_LEVEL
}

export type RiskKey = 'ambush' | 'injury' | 'infection' | 'illness' | 'trauma'
const RISK_TABLE: { key: RiskKey; weight: number }[] = [
  { key: 'ambush', weight: 30 }, { key: 'injury', weight: 28 }, { key: 'infection', weight: 16 },
  { key: 'illness', weight: 16 }, { key: 'trauma', weight: 10 },
]
export function rollRiskType(): RiskKey {
  return weightedPick(RISK_TABLE).key
}

function byIndex<T>(values: [T, T, T, T]): (index: number) => T {
  return (index: number) => values[Math.min(Math.max(index, 1), 4) - 1]
}

export const injuryDiceForLevel = byIndex(['1d4', '1d6', '1d8', '1d10'])
export const traumaDiceForLevel = byIndex(['1d6', '1d8', '1d10', '2d8'])
export const traumaMoraleLossForLevel = byIndex([10, 15, 20, 25])
export const infectionAmountForLevel = byIndex([10, 15, 20, 30])
export const illnessMoraleLossForLevel = byIndex([8, 12, 16, 20])
export const illnessEnergyDrainForLevel = byIndex([10, 15, 20, 25])

export interface ZombieStats { hp: number; damageDice: string; infectionChance: number }
const ZOMBIE_STATS_BY_LEVEL = byIndex<ZombieStats>([
  { hp: 8, damageDice: '1d4', infectionChance: 15 },
  { hp: 12, damageDice: '1d6', infectionChance: 20 },
  { hp: 18, damageDice: '1d8', infectionChance: 30 },
  { hp: 25, damageDice: '1d10', infectionChance: 40 },
])
export function zombieStatsForLevel(index: number): ZombieStats {
  return ZOMBIE_STATS_BY_LEVEL(index)
}

// Fatigue: more than the free-attempt threshold worth of expeditions within the window triggers an
// endurance save on the next one. Base threshold is 2 free expeditions (risk starts on the 3rd); every
// full 10 character levels grants one extra free expedition before the risk kicks in.
export const FATIGUE_THRESHOLD_BASE = 2
export const FATIGUE_WINDOW_MINUTES = 30
const FATIGUE_SAVE_BASE_DC = 10
const FATIGUE_SAVE_DC_STEP = 2
const FATIGUE_INJURY_DICE_STEPS = ['1d4', '1d6', '1d8', '1d10']
const FATIGUE_ILLNESS_BASE = 8
const FATIGUE_ILLNESS_STEP = 4
const FATIGUE_ILLNESS_CAP = 24

export function fatigueThreshold(level: number): number {
  return FATIGUE_THRESHOLD_BASE + Math.floor((level - 1) / 10)
}

/** How far past the free threshold this attempt is (1 = first fatigued attempt, 2 = next, ...). */
export function fatigueExcessCount(recentExpeditions: number, level: number): number {
  return Math.max(1, recentExpeditions - fatigueThreshold(level) + 1)
}

export function fatigueSaveDC(excessCount: number): number {
  return FATIGUE_SAVE_BASE_DC + excessCount * FATIGUE_SAVE_DC_STEP
}

export function fatigueInjuryDice(excessCount: number): string {
  return FATIGUE_INJURY_DICE_STEPS[Math.min(excessCount - 1, FATIGUE_INJURY_DICE_STEPS.length - 1)]
}

export function fatigueIllnessAmount(excessCount: number): number {
  return Math.min(FATIGUE_ILLNESS_BASE + (excessCount - 1) * FATIGUE_ILLNESS_STEP, FATIGUE_ILLNESS_CAP)
}

export type FatigueEffect = 'injury' | 'illness'
export function rollFatigueEffect(): FatigueEffect {
  return Math.random() < 0.5 ? 'injury' : 'illness'
}
