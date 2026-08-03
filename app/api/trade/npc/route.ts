import { NextRequest, NextResponse } from 'next/server'
import { loadOwnCharacter, saveCharacter } from '@/lib/loadCharacter'
import { getItem, estimateTradeValue } from '@/lib/items'
import { countOf, addStack, removeStack } from '@/lib/stacks'
import { TRADER_ROSTER, getTrader, getOrSeedStock, saveStock, removeFromStock, getTrust, adjustTrust, getNextRestockAt } from '@/lib/npcTraders'
import { resolveNegotiationRoll } from '@/lib/tradeNegotiation'
import { trainStat } from '@/lib/statTraining'

export async function GET() {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId } = result

  const traders = []
  for (const trader of TRADER_ROSTER) {
    const stock = await getOrSeedStock(trader.id, trader.tradeLevel)
    const trust = await getTrust(charId, trader.id)
    const nextRestockAt = await getNextRestockAt(trader.id)
    traders.push({ ...trader, stock, trust, nextRestockAt })
  }
  return NextResponse.json(traders)
}

export async function POST(req: NextRequest) {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId, character } = result

  if (character.status !== 'approved') return NextResponse.json({ error: 'Персонаж ще не затверджений ГМ' }, { status: 403 })
  if (character.dead) return NextResponse.json({ error: 'Персонаж мертвий' }, { status: 403 })
  if (character.expedition) return NextResponse.json({ error: 'Торгувати можна лише в таборі' }, { status: 400 })

  const { npcId, wantItemId, wantQty, giveItemId, giveQty } = await req.json() as {
    npcId: string; wantItemId: string; wantQty: number; giveItemId: string; giveQty: number
  }
  const trader = getTrader(npcId)
  if (!trader) return NextResponse.json({ error: 'Невідомий торговець' }, { status: 400 })

  const wantItem = getItem(wantItemId)
  const giveItem = getItem(giveItemId)
  if (!wantItem || !giveItem) return NextResponse.json({ error: 'Невідомий предмет' }, { status: 400 })

  let stock = await getOrSeedStock(trader.id, trader.tradeLevel)
  const stockQty = stock.find(s => s.itemKey === wantItemId)?.quantity ?? 0
  if (stockQty < wantQty) return NextResponse.json({ error: 'У торговця немає стільки цього товару' }, { status: 400 })
  if (countOf(character.inventory, giveItemId) < giveQty) return NextResponse.json({ error: 'У тебе немає стільки цього предмета' }, { status: 400 })

  const trust = await getTrust(charId, trader.id)
  const negotiation = resolveNegotiationRoll(character, trader.tradeLevel, trust)

  const giveValue = estimateTradeValue(giveItem) * giveQty
  const wantValue = estimateTradeValue(wantItem) * wantQty
  // Rounded to the same precision shown to the player (×0.00) BEFORE comparing — otherwise a
  // sub-cent shortfall (e.g. required 1.004 vs offered 0.998) fails the deal while both numbers
  // render identically as "×1.00", which reads as a bug ("it says 1 to 1 but still refuses").
  const ratio = Math.round((giveValue / wantValue) * 100) / 100
  const requiredRatioRounded = Math.round(negotiation.requiredRatio * 100) / 100

  const log: string[] = [
    `🎲 Переговори (Харизма): ${negotiation.roll.total} + довіра ${negotiation.trustBonus} + репутація ${negotiation.reputationBonus} = ${negotiation.totalRoll} проти СК ${negotiation.dc}${negotiation.critical ? ' — КРИТ!' : negotiation.fumble ? ' — провал!' : ''}`,
  ]
  const accepted = negotiation.success && ratio >= requiredRatioRounded
  const growth = trainStat(character, 'cha', accepted)
  if (growth) log.push(growth)

  if (!negotiation.success) {
    await adjustTrust(charId, trader.id, negotiation.fumble ? -3 : -1)
    log.push(`❌ ${trader.name} не погоджується на переговори.`)
    await saveCharacter(charId, character)
    return NextResponse.json({ character, log })
  }

  if (ratio < requiredRatioRounded) {
    log.push(`❌ ${trader.name}: "Замало — так не домовимось." (потрібне співвідношення ×${requiredRatioRounded.toFixed(2)}, твоя пропозиція ×${ratio.toFixed(2)})`)
    await saveCharacter(charId, character)
    return NextResponse.json({ character, log })
  }

  character.inventory = removeStack(character.inventory, giveItemId, giveQty)
  addStack(character.inventory, wantItemId, wantQty)
  stock = removeFromStock(stock, wantItemId, wantQty)
  await saveStock(trader.id, stock)
  const newTrust = await adjustTrust(charId, trader.id, negotiation.critical ? 5 : 2)

  log.push(`✅ Угода! Віддано: ${giveItem.name} ×${giveQty}. Отримано: ${wantItem.name} ×${wantQty}. Довіра до ${trader.name}: ${newTrust}.`)

  await saveCharacter(charId, character)
  return NextResponse.json({ character, log })
}
