import { StatKey } from './types'

export interface CampLocationOutcome {
  text: string
  moraleDelta?: number
  reputationDelta?: number
  infectionDelta?: number
  thirstDelta?: number
  hungerDelta?: number
  materialReward?: { itemKey: string; quantity: number }
}

export interface CampLocation {
  key: string
  name: string
  flavor: string
  stat: StatKey | null
  dc: number
  success: CampLocationOutcome
  failure: CampLocationOutcome
  /** Minutes before this location can be visited again — undefined/0 means no cooldown. Separate
   *  from canteen's daily-uses-by-reputation-tier gate, which is its own special case below. */
  cooldownMinutes?: number
}

export const CAMP_LOCATIONS: CampLocation[] = [
  {
    key: 'medbay', name: '🏥 Медпункт', flavor: 'Тутешній фельдшер огляне рани та перевірить на ознаки зараження.',
    stat: 'per', dc: 11,
    success: { text: 'Фельдшер знаходить і чистить забруднену рану.', infectionDelta: -15, moraleDelta: 5 },
    failure: { text: 'Фельдшер зайнятий іншими — сьогодні черга не дійшла.', moraleDelta: 0 },
  },
  {
    key: 'water_pump', name: '💧 Колонка з водою', flavor: 'Набрати чистої води просто в таборі — швидко і без зусиль.',
    stat: null, dc: 0,
    success: { text: 'Прохолодна вода з колонки — спрага як не бувало.', thirstDelta: 40 },
    failure: { text: '', thirstDelta: 40 },
  },
  {
    key: 'canteen', name: '🍲 Їдальня', flavor: 'Гаряча страва в таборовій їдальні — щоб не ходити голодним.',
    stat: null, dc: 0,
    success: { text: 'Миска гарячої їжі — голод повністю вгамовано.', hungerDelta: 100 },
    failure: { text: '', hungerDelta: 100 },
  },
  {
    key: 'campfire', name: '🔥 Багаття', flavor: 'Посидіти з іншими вцілілими біля вогню, погрітися й поговорити ні про що.',
    stat: null, dc: 0,
    success: { text: 'Тепло вогню й прості розмови трохи відпускають напругу.', moraleDelta: 8 },
    failure: { text: '', moraleDelta: 8 },
  },
  {
    key: 'workshop', name: '🛠️ Майстерня', flavor: 'Покопирсатися в запчастинах і мотлоху — можна знайти щось корисне.',
    stat: 'int', dc: 12,
    success: { text: 'Серед мотлоху трапляється щось придатне для крафту.', reputationDelta: 1, materialReward: { itemKey: 'scrap', quantity: 2 } },
    failure: { text: 'Нічого путнього серед мотлоху не знайшлось.' },
  },
  {
    key: 'range', name: '🎯 Стрільбище', flavor: 'Потренуватися в стрільбі по мішенях на задвірках табору.',
    stat: 'per', dc: 12,
    success: { text: 'Влучна серія по мішенях — інші звертають увагу на майстерність.', reputationDelta: 1, moraleDelta: 5 },
    failure: { text: 'Стрільба сьогодні не вдається — жодного влучання.', moraleDelta: -2 },
  },
  {
    key: 'watchtower', name: '🌳 Оглядовий пункт', flavor: 'Постояти на варті, оглянути околиці табору з вишки.',
    stat: 'per', dc: 13,
    success: { text: 'Уважне чергування — табір цінує тих, хто пильнує.', reputationDelta: 2 },
    failure: { text: 'Довга нудна зміна на вежі, і нічого цікавого не видно.', moraleDelta: -3 },
    cooldownMinutes: 120,
  },
]

export function getCampLocation(key: string): CampLocation | undefined {
  return CAMP_LOCATIONS.find(l => l.key === key)
}
