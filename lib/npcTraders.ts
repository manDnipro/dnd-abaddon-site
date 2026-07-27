import { redis } from './redis'
import { generateNpcStock, TradeStockEntry, clampTrust } from './tradeNegotiation'

export interface TraderNpc {
  id: string
  name: string
  tradeLevel: number
}

export const TRADER_ROSTER: TraderNpc[] = [
  { id: 'trader_1', name: 'Мандрівний торговець', tradeLevel: 2 },
  { id: 'trader_2', name: 'Колишній солдат', tradeLevel: 3 },
  { id: 'trader_3', name: 'Місцевий фермер', tradeLevel: 1 },
]

export function getTrader(id: string): TraderNpc | undefined {
  return TRADER_ROSTER.find(t => t.id === id)
}

async function stockKey(npcId: string) { return `trade:stock:${npcId}` }

export async function getOrSeedStock(npcId: string, tradeLevel: number): Promise<TradeStockEntry[]> {
  const key = await stockKey(npcId)
  const raw = await redis.get<string>(key)
  if (raw) return typeof raw === 'string' ? JSON.parse(raw) : raw
  const stock = generateNpcStock(tradeLevel)
  await redis.set(key, JSON.stringify(stock))
  return stock
}

export async function saveStock(npcId: string, stock: TradeStockEntry[]) {
  await redis.set(await stockKey(npcId), JSON.stringify(stock))
}

export function removeFromStock(stock: TradeStockEntry[], itemKey: string, qty: number): TradeStockEntry[] {
  const entry = stock.find(s => s.itemKey === itemKey)
  if (!entry) return stock
  entry.quantity -= qty
  return entry.quantity <= 0 ? stock.filter(s => s.itemKey !== itemKey) : stock
}

async function trustKey(charId: string, npcId: string) { return `trade:trust:${charId}:${npcId}` }

export async function getTrust(charId: string, npcId: string): Promise<number> {
  const v = await redis.get<number>(await trustKey(charId, npcId))
  return v ?? 0
}

export async function adjustTrust(charId: string, npcId: string, delta: number): Promise<number> {
  const current = await getTrust(charId, npcId)
  const next = clampTrust(current + delta)
  await redis.set(await trustKey(charId, npcId), next)
  return next
}
