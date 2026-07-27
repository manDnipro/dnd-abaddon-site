export type EnemyTypeKey = 'mass' | 'sprinter' | 'tank' | 'screamer'

export interface EnemyTypeDef {
  key: EnemyTypeKey
  label: string
  emoji: string
  tier: 1 | 2
  namePrefix: string
  flavor: string
  defense: number
  attackBonus: number
  hpModifier: (baseHp: number) => number
  special?: 'call_horde'
}

export const ENEMY_TYPES: EnemyTypeDef[] = [
  {
    key: 'mass', label: 'Маса (звичайний заражений)', emoji: '🧟', tier: 1, namePrefix: 'Зомбі',
    flavor: 'звичайний заражений', defense: 8, attackBonus: 0, hpModifier: hp => hp,
  },
  {
    key: 'sprinter', label: 'Спринтер', emoji: '🏃', tier: 2, namePrefix: 'Спринтер',
    flavor: 'дуже швидкий — важко влучити, а контратакує різко', defense: 11, attackBonus: 3,
    hpModifier: hp => Math.max(4, Math.round(hp * 0.6)),
  },
  {
    key: 'tank', label: 'Товстошкірий', emoji: '🛡️', tier: 2, namePrefix: 'Товстошкірий',
    flavor: 'повільний, але надзвичайно живучий', defense: 9, attackBonus: 1,
    hpModifier: hp => Math.round(hp * 1.9),
  },
  {
    key: 'screamer', label: 'Крикун', emoji: '📢', tier: 2, namePrefix: 'Крикун',
    flavor: 'здатний покликати підмогу, щойно його виявлять', defense: 8, attackBonus: 0,
    hpModifier: hp => Math.round(hp * 0.9), special: 'call_horde',
  },
]

export function getEnemyType(key: string): EnemyTypeDef | undefined {
  return ENEMY_TYPES.find(t => t.key === key)
}

const SPECIALIST_TYPES = ENEMY_TYPES.filter(t => t.tier === 2)

export function rollAmbushEnemyType(levelIndex: number): EnemyTypeDef {
  const mass = getEnemyType('mass')!
  if (levelIndex < 3) return mass
  const specialistChance = levelIndex === 3 ? 0.35 : 0.5
  if (Math.random() >= specialistChance) return mass
  return SPECIALIST_TYPES[Math.floor(Math.random() * SPECIALIST_TYPES.length)]
}

export const SCREAMER_CALL_CHANCE = 0.6
