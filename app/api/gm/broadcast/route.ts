import { NextRequest, NextResponse } from 'next/server'
import { isGM } from '@/lib/auth'
import { redis } from '@/lib/redis'
import { Character } from '@/lib/types'
import { getApprovedCharacterIds } from '@/lib/approvedCharacters'
import { addPlayerMessage } from '@/lib/playerInbox'

/** Direct message to every living approved player's PDA inbox — for anything urgent enough that
 *  a "Новини гри" line on the homepage might get missed. */
export async function POST(req: NextRequest) {
  if (!await isGM()) return NextResponse.json({ error: 'Немає доступу' }, { status: 403 })

  const { text } = await req.json() as { text: string }
  if (!text?.trim()) return NextResponse.json({ error: 'Порожнє повідомлення' }, { status: 400 })

  const ids = await getApprovedCharacterIds()
  let sent = 0
  for (const id of ids) {
    const raw = await redis.get<string>(`char:${id}`)
    if (!raw) continue
    const c: Character = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (c.dead) continue
    await addPlayerMessage(id, 'ГМ', text.trim().slice(0, 1000))
    sent++
  }
  return NextResponse.json({ ok: true, sent })
}
