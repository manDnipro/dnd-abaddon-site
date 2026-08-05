import { NextRequest, NextResponse } from 'next/server'
import { loadOwnCharacter, saveCharacter, blockIfInCombat } from '@/lib/loadCharacter'
import { getMission, saveMission, applyMissionReward } from '@/lib/rpMissions'
import { STAT_LABELS, formatModifier, statModifier } from '@/lib/types'
import { rollCheck } from '@/lib/dice'
import { dieSizeForStat, scaleDcForSides } from '@/lib/statLevels'
import { trainStat } from '@/lib/statTraining'
import { appendCharacterLog } from '@/lib/characterLog'

export async function POST(req: NextRequest) {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId, character } = result
  const guard = blockIfInCombat(character)
  if (guard) return guard

  if (character.status !== 'approved') return NextResponse.json({ error: 'Персонаж ще не затверджений ГМ' }, { status: 403 })
  if (character.dead) return NextResponse.json({ error: 'Персонаж мертвий' }, { status: 403 })

  const { missionId } = await req.json() as { missionId: string }
  const mission = await getMission(missionId)
  if (!mission) return NextResponse.json({ error: 'Місію не знайдено' }, { status: 404 })
  if (mission.targetCharId && mission.targetCharId !== charId) {
    return NextResponse.json({ error: 'Ця місія не для тебе' }, { status: 403 })
  }
  if (mission.completions[charId]) return NextResponse.json({ error: 'Ти вже виконав(-ла) цю місію' }, { status: 400 })

  const log: string[] = [`📜 ${character.name} береться за: «${mission.title}»`]
  let success = true

  if (mission.checkStat) {
    const stat = mission.checkStat
    const mod = statModifier(character.stats[stat])
    const sides = dieSizeForStat(character.stats[stat])
    const dc = scaleDcForSides(mission.checkDC, sides)
    const roll = rollCheck(sides, mod)
    success = roll.total >= dc
    log.push(`🎲 Перевірка (${STAT_LABELS[stat]} ${formatModifier(mod)}): кинуто д${sides} ${roll.rolls[0]} ${formatModifier(mod)} = ${roll.total} проти СК ${dc}${success ? ' — вдалось!' : ' — не вдалось.'}`)
    const growth = trainStat(character, stat, success)
    if (growth) log.push(growth)
  }

  if (success && mission.reward.type !== 'none') {
    applyMissionReward(character, mission.reward, log)
  } else if (!success) {
    log.push('😔 Цього разу без нагороди.')
  }

  mission.completions[charId] = { success, at: Date.now() }
  await saveMission(mission)
  await saveCharacter(charId, character)
  await appendCharacterLog(charId, log)
  return NextResponse.json({ character, log, success })
}
