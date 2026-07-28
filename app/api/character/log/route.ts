import { NextResponse } from 'next/server'
import { loadOwnCharacter } from '@/lib/loadCharacter'
import { getCharacterLog } from '@/lib/characterLog'

export async function GET() {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId } = result

  const log = await getCharacterLog(charId)
  return NextResponse.json(log)
}
