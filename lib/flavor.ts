function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

const REST_LINES = [
  'вмощується біля вогнища й на якийсь час забуває про жах навколо',
  'закутується в те, що лишилось від ковдри, і провалюється в неспокійний сон',
  'привалюється спиною до стіни й дозволяє тілу нарешті розслабитись',
  'закриває очі рівно настільки, щоб перестали труситись руки',
  'знаходить тихий закуток і дає ранам трохи затягнутись',
]

export function restLine(name: string, tierLabel: string, heal: number, hp: number, maxHp: number): string {
  return `🛌 ${name} ${pick(REST_LINES)}. Стан табору: ${tierLabel}. Рани затягуються (+${heal} ОЗ) — ${hp}/${maxHp}.`
}

const HUNT_SUCCESS_LINES = [
  'вистежує здобич біля периметру й влучно б\'є напевне',
  'завмирає в засідці й хапає здобич за секунду до того, як вона втекла',
  'тихо підкрадається і не залишає здобичі жодного шансу',
]
const HUNT_FAIL_LINES = [
  'довго вичікує, але здобич встигає зникнути в руїнах',
  'наступає на суху гілку — і полювання зривається',
  'марно тиняється периметром, повертається з порожніми руками',
]

export function huntLine(name: string, success: boolean, catchName?: string): string {
  if (success) return `🏹 ${name} ${pick(HUNT_SUCCESS_LINES)}: здобуто ${catchName}.`
  return `🏹 ${name} ${pick(HUNT_FAIL_LINES)}.`
}

const EAT_LINES = ['з\'їдає', 'проковтує', 'долає голод шматком']
const DRINK_LINES = ['випиває', 'жадібно п\'є']
const HEAL_LINES = ['перев\'язує рани', 'обробляє поранення']

export function useItemLine(name: string, itemName: string, type: 'food' | 'water' | 'medical' | 'other'): string {
  if (type === 'food') return `🍽️ ${name} ${pick(EAT_LINES)} ${itemName}.`
  if (type === 'water') return `💧 ${name} ${pick(DRINK_LINES)} ${itemName}.`
  if (type === 'medical') return `❤️ ${name} ${pick(HEAL_LINES)} — використано ${itemName}.`
  return `🥃 ${name} використовує ${itemName}.`
}

const POISON_LINES = [
  'ледь встигає зрозуміти, що щось не так, як шлунок скручує судомою',
  'відчуває різкий біль — їжа виявилась зіпсованою',
  'блідне на очах — це було не те, на що сподівався(-лась)',
]
export function poisonLine(name: string, dmg: number): string {
  return `🤢 ${name} ${pick(POISON_LINES)}. -${dmg} ОЗ.`
}
