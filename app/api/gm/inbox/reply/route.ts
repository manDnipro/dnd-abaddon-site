import { NextRequest, NextResponse } from 'next/server'
import { isGM } from '@/lib/auth'
import { redis } from '@/lib/redis'
import { addPlayerMessage } from '@/lib/playerInbox'
import { getOwnerCharId } from '@/lib/ownerChar'

export async function POST(req: NextRequest) {
  if (!await isGM()) return NextResponse.json({ error: 'Немає доступу' }, { status: 403 })

  const { toNickname, text } = await req.json() as { toNickname: string; text: string }
  if (!toNickname?.trim() || !text?.trim()) return NextResponse.json({ error: 'Заповни відповідь' }, { status: 400 })

  const charId = await getOwnerCharId(toNickname)
  if (!charId) return NextResponse.json({ error: 'У цього гравця немає персонажа' }, { status: 404 })

  await addPlayerMessage(charId, 'ГМ', text.trim().slice(0, 1000))
  return NextResponse.json({ ok: true })
}
