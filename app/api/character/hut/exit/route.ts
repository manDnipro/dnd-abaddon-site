import { NextResponse } from 'next/server'
import { loadOwnCharacter, saveCharacter } from '@/lib/loadCharacter'
import { appendCharacterLog } from '@/lib/characterLog'

export async function POST() {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId, character } = result

  if (!character.inHut) return NextResponse.json({ error: 'Ти не в хібарі.' }, { status: 400 })

  // loadOwnCharacter already ran the hourly catch-up tick for the time spent inside before this
  // request even got here, so leaving just clears the flag — no separate settlement needed.
  character.inHut = false
  const log = [`🚪 ${character.name} виходить із хібари.`]

  await saveCharacter(charId, character)
  await appendCharacterLog(charId, log)
  return NextResponse.json({ character, log })
}
