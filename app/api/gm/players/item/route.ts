import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { isGM } from '@/lib/auth'
import { Character } from '@/lib/types'
import { addStack, removeStack, countOf } from '@/lib/stacks'
import { getItem } from '@/lib/items'

export async function POST(req: NextRequest) {
  if (!await isGM()) return NextResponse.json({ error: 'Немає доступу' }, { status: 403 })

  const { charId, itemKey, qty, action } = await req.json() as { charId: string; itemKey: string; qty: number; action: 'give' | 'take' }
  const item = getItem(itemKey)
  if (!item) return NextResponse.json({ error: 'Невідомий предмет' }, { status: 400 })

  const raw = await redis.get<string>(`char:${charId}`)
  if (!raw) return NextResponse.json({ error: 'Персонажа не знайдено' }, { status: 404 })
  const character: Character = typeof raw === 'string' ? JSON.parse(raw) : raw

  const amount = Math.max(1, Math.floor(qty || 1))
  if (action === 'give') {
    addStack(character.inventory, itemKey, amount)
  } else {
    if (countOf(character.inventory, itemKey) < amount) {
      return NextResponse.json({ error: 'У гравця немає стільки цього предмета' }, { status: 400 })
    }
    character.inventory = removeStack(character.inventory, itemKey, amount)
  }

  await redis.set(`char:${charId}`, JSON.stringify(character))
  return NextResponse.json(character)
}
