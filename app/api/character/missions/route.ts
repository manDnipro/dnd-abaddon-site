import { NextResponse } from 'next/server'
import { loadOwnCharacter } from '@/lib/loadCharacter'
import { listMissionsForChar } from '@/lib/rpMissions'

export async function GET() {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId, character } = result

  if (character.status !== 'approved' || character.dead) return NextResponse.json([])
  const missions = await listMissionsForChar(charId)
  return NextResponse.json(missions)
}
