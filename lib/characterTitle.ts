import { Stats, StatKey } from './types'

const TITLE_BY_STAT: Record<StatKey, string> = {
  str: 'Силач',
  agi: 'Спритник',
  end: 'Витривалий',
  per: 'Шукач луту',
  int: 'Тямущий',
  cha: 'Заводій',
}

export function characterTitle(stats: Stats): string {
  let best: StatKey = 'str'
  let bestVal = -1
  for (const key of Object.keys(stats) as StatKey[]) {
    if (stats[key] > bestVal) { bestVal = stats[key]; best = key }
  }
  return TITLE_BY_STAT[best]
}
