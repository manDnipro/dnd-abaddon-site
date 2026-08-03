import { NextRequest, NextResponse } from 'next/server'
import { addWorldEvent } from '@/lib/worldState'

// Lets the site's developer post a "🔧 Оновлення: ..." line to the homepage's "Новини гри" feed
// after shipping a player-facing change, without needing the GM's own login. Separate secret from
// GM_PASSWORD on purpose — this only ever does one thing (post a world event), so it doesn't need
// GM-level access to players/missions/etc.
export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace(/^Bearer /, '')
  if (!token || token !== process.env.PATCH_NOTE_TOKEN) {
    return NextResponse.json({ error: 'Немає доступу' }, { status: 403 })
  }

  const { text } = await req.json() as { text: string }
  if (!text?.trim()) return NextResponse.json({ error: 'Порожній текст' }, { status: 400 })

  await addWorldEvent(`🔧 Оновлення: ${text.trim().slice(0, 500)}`)
  return NextResponse.json({ ok: true })
}
