import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { getSession } from '@/lib/auth'
import { Character, statModifier } from '@/lib/types'
import { getExpeditionLevel } from '@/lib/expedition'
import { resolveEnemyAttack } from '@/lib/combatEngine'
import { runPostSearchChecks } from '@/lib/expeditionEngine'
import { rollD20 } from '@/lib/dice'
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

  const fleeDC = 10 + combat.attackBonus
  const roll = rollD20(statModifier(character.stats.agi))
  const escaped = roll.total >= fleeDC

  if (escaped) {
    log.push(`🏃 Вдається відірватися від ${combat.enemyLabel.toLowerCase()}: ${roll.total} проти СК ${fleeDC} — втеча вдалась!`)
    character.combat = null
    const level = character.expedition ? getExpeditionLevel(character.expedition.levelKey) : undefined
    if (level) {
      const tail = runPostSearchChecks(character, level, log)
      if (tail.died) character.expedition = null
    }
  } else {
    log.push(`🏃 Спроба втекти провалилась: ${roll.total} проти СК ${fleeDC} — ${combat.enemyLabel.toLowerCase()} встигає атакувати.`)
    // Turning your back is the worst opening you can give an enemy — punishing counterattack.
    const enemyRound = resolveEnemyAttack(character, combat, { bonus: 3, cause: 'ти повертаєшся спиною' })
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
