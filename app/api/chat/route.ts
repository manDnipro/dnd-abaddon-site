import { NextRequest, NextResponse } from 'next/server'
import { loadOwnCharacter } from '@/lib/loadCharacter'
import { listChatMessages, postChatMessage } from '@/lib/chat'

export async function GET() {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

  const messages = await listChatMessages()
  return NextResponse.json(messages)
}

export async function POST(req: NextRequest) {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { character } = result
  if (character.status !== 'approved' || character.dead) {
    return NextResponse.json({ error: 'Чат доступний лише затвердженим живим персонажам' }, { status: 403 })
  }

  const { text } = await req.json() as { text: string }
  if (!text?.trim()) return NextResponse.json({ error: 'Порожнє повідомлення' }, { status: 400 })

  await postChatMessage(character.name, text)
  return NextResponse.json({ ok: true })
}
