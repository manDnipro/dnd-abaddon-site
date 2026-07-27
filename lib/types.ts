export type Stats = {
  strength: number
  agility: number
  endurance: number
  perception: number
  intellect: number
  charisma: number
}

export type CharacterStatus = 'pending' | 'approved' | 'rejected'

export type Character = {
  id: string
  owner: string // nickname of the account that created it
  name: string
  stats: Stats
  status: CharacterStatus
  createdAt: number
  reviewedAt?: number
  reviewNote?: string
}

export const STAT_LABELS: Record<keyof Stats, string> = {
  strength: 'Сила',
  agility: 'Спритність',
  endurance: 'Витривалість',
  perception: 'Сприйняття',
  intellect: 'Інтелект',
  charisma: 'Харизма',
}

export const STAT_POINTS_TOTAL = 18
