import { NextResponse } from 'next/server'
import { isGM } from '@/lib/auth'
import { TRADER_ROSTER, getOrSeedStock } from '@/lib/npcTraders'

export async function GET() {
  if (!await isGM()) return NextResponse.json({ error: 'Немає доступу' }, { status: 403 })

  const npcs = []
  for (const trader of TRADER_ROSTER) {
    const stock = await getOrSeedStock(trader.id, trader.tradeLevel)
    npcs.push({ ...trader, stock })
  }
  return NextResponse.json(npcs)
}
