import { NextResponse } from 'next/server'
import { loadOwnCharacter, saveCharacter, blockIfOnExpedition } from '@/lib/loadCharacter'
import { addStack, countOf, removeStack } from '@/lib/stacks'
import { appendCharacterLog } from '@/lib/characterLog'

// Instant, no dice roll — you're standing at a working pump in camp filling a container you already
// have, there's nothing to fail. The actual "did the pump cooperate" risk lives in the water_pump
// camp location check itself (app/api/character/visit-location/route.ts).
export async function POST() {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId, character } = result
  const guard = blockIfOnExpedition(character)
  if (guard) return guard

  if (character.status !== 'approved') return NextResponse.json({ error: 'Персонаж ще не затверджений ГМ' }, { status: 403 })
  if (character.dead) return NextResponse.json({ error: 'Персонаж мертвий' }, { status: 403 })
  if (countOf(character.inventory, 'empty_flask') < 1) {
    return NextResponse.json({ error: 'У тебе немає пустої фляги.' }, { status: 400 })
  }

  character.inventory = removeStack(character.inventory, 'empty_flask', 1)
  addStack(character.inventory, 'filled_flask', 1)

  const log = ['💧 Фляга наповнена водою з колонки — тепер можна взяти на вилазку.']
  await saveCharacter(charId, character)
  await appendCharacterLog(charId, log)
  return NextResponse.json({ character, log })
}
