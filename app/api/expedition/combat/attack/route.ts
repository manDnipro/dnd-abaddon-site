import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { getSession } from '@/lib/auth'
import { Character } from '@/lib/types'
import { getExpeditionLevel } from '@/lib/expedition'
import { resolvePlayerAttack, resolveEnemyAttack } from '@/lib/combatEngine'
import { runPostSearchChecks } from '@/lib/expeditionEngine'
import { appendCharacterLog } from '@/lib/characterLog'
import { pushExpeditionLog, finalizeExpeditionLog } from '@/lib/expeditionLog'
import { getOwnerCharId } from '@/lib/ownerChar'

export async function POST() {
  const owner = await getSession()
  if (!owner) return NextResponse.json({ error: 'Потрібно увійти' }, { status: 401 })

  const charId = await getOwnerCharId(owner)
  if (!charId) return NextResponse.json({ error: 'Персонажа не знайдено' }, { status: 404 })
  const raw = await redis.get<string>(`char:${charId}`)
  if (!raw) return NextResponse.json({ error: 'Персонажа не знайдено' }, { status: 404 })
  const character: Character = typeof raw === 'string' ? JSON.parse(raw) : raw

  if (!character.combat) return NextResponse.json({ error: 'Бою немає' }, { status: 400 })
  const combat = character.combat
  let log: string[] = []

  const playerRound = resolvePlayerAttack(character, combat, false)
  log = log.concat(playerRound.log)

  if (playerRound.enemyDied) {
    character.combat = null
    const level = character.expedition ? getExpeditionLevel(character.expedition.levelKey) : undefined
    if (level) {
      const tail = runPostSearchChecks(character, level, log)
      if (tail.died) character.expedition = null
    }
  } else {
    // A missed swing leaves you open — the enemy presses the opening instead of just taking its turn.
    const enemyRound = resolveEnemyAttack(character, combat, playerRound.hit ? undefined : { bonus: 2, cause: 'ти хибиш' })
    log = log.concat(enemyRound.log)
    if (enemyRound.playerDied) {
      character.combat = null
      character.expedition = null
    }
  }

  pushExpeditionLog(character, log)
  if (!character.expedition) finalizeExpeditionLog(character)
  await redis.set(`char:${charId}`, JSON.stringify(character))
  await appendCharacterLog(charId, log)
  return NextResponse.json({ character, log })
}
