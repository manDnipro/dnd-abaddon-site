import { InventoryStack } from './types'

export interface HutMaterialCost { itemKey: string; quantity: number }

export interface HutStage {
  key: string
  label: string
  image: string
  /** Cumulative progress % this stage represents once its own materials are fully contributed. */
  progressAt: number
  /** Materials needed to go from the previous stage to this one — cost of THIS stage only. */
  cost: HutMaterialCost[]
}

// Cumulative progress jumps (0 -> 25 -> 75 -> 100) match the milestone %s baked into the artwork
// itself (public/hut/hut_stage1..4.jpg) — the "Стіни" stage costs the most since it's the biggest
// jump (25% -> 75%). Quantities are a first pass; easy to retune later, nothing else depends on the
// exact numbers.
export const HUT_STAGES: HutStage[] = [
  { key: 'foundation', label: 'Фундамент', image: 'hut_stage1.jpg', progressAt: 0, cost: [] },
  {
    key: 'frame', label: 'Каркас', image: 'hut_stage2.jpg', progressAt: 25,
    cost: [{ itemKey: 'scrap', quantity: 20 }, { itemKey: 'rope', quantity: 5 }],
  },
  {
    key: 'walls', label: 'Стіни (бетон)', image: 'hut_stage3.jpg', progressAt: 75,
    cost: [{ itemKey: 'scrap', quantity: 40 }, { itemKey: 'cloth', quantity: 20 }, { itemKey: 'fuel', quantity: 5 }],
  },
  {
    key: 'roof', label: 'Дах та вікна', image: 'hut_stage4.jpg', progressAt: 100,
    cost: [{ itemKey: 'scrap', quantity: 25 }, { itemKey: 'cloth', quantity: 10 }, { itemKey: 'rope', quantity: 5 }],
  },
]

export const HUT_UNLOCK_REPUTATION = 100
export const HUT_STORAGE_CAPACITY = 40
export const HUT_REGEN_PER_HOUR = 1
export const HUT_MAX_CATCHUP_HOURS = 24

export function currentHutStageIndex(progress: number): number {
  let idx = 0
  for (let i = 0; i < HUT_STAGES.length; i++) {
    if (progress >= HUT_STAGES[i].progressAt) idx = i
  }
  return idx
}

/** The stage the player is currently WORKING TOWARD (first one not yet fully paid for), or null if done. */
export function nextHutStage(progress: number): HutStage | null {
  return HUT_STAGES.find(s => s.progressAt > progress) ?? null
}

export function hutStorageCount(storage: InventoryStack[]): number {
  return storage.reduce((sum, s) => sum + s.qty, 0)
}
