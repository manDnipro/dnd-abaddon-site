import { StatKey } from './types'

export const CAMP_JOB_CHANCE = 0.3
export const CAMP_JOB_DC = 12
export const CAMP_JOB_REPUTATION_GAIN = 3
export const CAMP_JOB_REPUTATION_LOSS = 5

const JOB_FLAVORS = [
  'полагодити паркан навколо табору',
  'розібрати та розсортувати нові припаси',
  'почистити й змастити зброю на складі',
  'перевірити пастки на периметрі',
  'розподілити воду між наметами',
  'заспокоїти новоприбулих і ввести їх у курс справ',
  'залатати діряві намети',
  'вислідкувати, звідки в табір тягне протягом',
  'полагодити генератор',
  'провести облік припасів на складі',
]

const JOB_STATS: StatKey[] = ['str', 'agi', 'end', 'per', 'int', 'cha']

export function rollJobFlavor(): string {
  return JOB_FLAVORS[Math.floor(Math.random() * JOB_FLAVORS.length)]
}

export function rollJobStat(): StatKey {
  return JOB_STATS[Math.floor(Math.random() * JOB_STATS.length)]
}
