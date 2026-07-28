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

const RESTOCK_MS = 2 * 60 * 60 * 1000

interface StoredStock { stock: TradeStockEntry[]; rolledAt: number }

function stockKey(npcId: string) { return `trade:stock:${npcId}` }

function parseStored(raw: unknown): StoredStock | null {
  if (!raw) return null
  const data = typeof raw === 'string' ? JSON.parse(raw) : raw
  // Old format was a bare TradeStockEntry[] with no restock timer — treat as due for a restock.
  if (Array.isArray(data)) return { stock: data, rolledAt: 0 }
  return data as StoredStock
}

/** Same lazy-roll pattern as the weather (no background cron here) — stock is only regenerated
 *  the next time someone actually looks at this trader, if 2h+ have passed since the last roll. */
export async function getOrSeedStock(npcId: string, tradeLevel: number): Promise<TradeStockEntry[]> {
  const key = stockKey(npcId)
  const existing = parseStored(await redis.get<string>(key))
  const now = Date.now()

  if (existing && now - existing.rolledAt < RESTOCK_MS) return existing.stock

  const stock = generateNpcStock(tradeLevel)
  await redis.set(key, JSON.stringify({ stock, rolledAt: now } as StoredStock))
  return stock
}

/** Peek-only, for display — when this trader's stock will next roll over. Doesn't mutate anything. */
export async function getNextRestockAt(npcId: string): Promise<number> {
  const existing = parseStored(await redis.get<string>(stockKey(npcId)))
  return (existing?.rolledAt ?? 0) + RESTOCK_MS
}

/** Saves stock after a purchase — keeps the existing restock timer running rather than resetting
 *  it, so buying something doesn't push the next full restock further out. */
export async function saveStock(npcId: string, stock: TradeStockEntry[]) {
  const key = stockKey(npcId)
  const existing = parseStored(await redis.get<string>(key))
  const rolledAt = existing?.rolledAt ?? Date.now()
  await redis.set(key, JSON.stringify({ stock, rolledAt } as StoredStock))
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
