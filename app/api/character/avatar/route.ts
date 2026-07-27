import { NextRequest, NextResponse } from 'next/server'
import { loadOwnCharacter, saveCharacter } from '@/lib/loadCharacter'
import { isValidAvatar } from '@/lib/avatars'

export async function POST(req: NextRequest) {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId, character } = result

  const { avatar } = await req.json() as { avatar: string }
  if (!isValidAvatar(avatar)) return NextResponse.json({ error: 'Невірний аватар' }, { status: 400 })

  character.avatar = avatar
  await saveCharacter(charId, character)
  return NextResponse.json(character)
}
