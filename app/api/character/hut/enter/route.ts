import { NextResponse } from 'next/server'
import { loadOwnCharacter, saveCharacter, blockIfOnExpedition, blockIfInCombat } from '@/lib/loadCharacter'
import { appendCharacterLog } from '@/lib/characterLog'

export async function POST() {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId, character } = result
  const expGuard = blockIfOnExpedition(character)
  if (expGuard) return expGuard
  const combatGuard = blockIfInCombat(character)
  if (combatGuard) return combatGuard

  if (character.dead) return NextResponse.json({ error: 'Персонаж мертвий' }, { status: 403 })
  if (character.hutProgress < 100) return NextResponse.json({ error: 'Хібару ще не добудовано.' }, { status: 400 })
  if (character.inHut) return NextResponse.json({ error: 'Ти вже в хібарі.' }, { status: 400 })

  character.inHut = true
  character.lastHutTickAt = Date.now()
  const log = [`🏠 ${character.name} заходить у хібару відпочити.`]

  await saveCharacter(charId, character)
  await appendCharacterLog(charId, log)
  return NextResponse.json({ character, log })
}
