import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { loadOwnCharacter, saveCharacter } from '@/lib/loadCharacter'
import { Character } from '@/lib/types'
import { getItem, ItemDefinition } from '@/lib/items'
import { bestWeapon } from '@/lib/combatEngine'
import { resolveAttack } from '@/lib/combat'
import { dieSizeForStat, scaleDcForSides } from '@/lib/statLevels'
import { getDurability, isBroken, wearWeaponOnUse } from '@/lib/durability'
import { trainWeaponProficiency } from '@/lib/weaponProficiency'
import { XP_REWARDS } from '@/lib/levels'
import { appendCharacterLog } from '@/lib/characterLog'
import { pushExpeditionLog } from '@/lib/expeditionLog'

export async function POST() {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId, character } = result

  if (character.status !== 'approved') return NextResponse.json({ error: 'Персонаж ще не затверджений ГМ' }, { status: 403 })
  if (character.dead) return NextResponse.json({ error: 'Персонаж мертвий' }, { status: 403 })
  if (character.combat) return NextResponse.json({ error: 'Спершу розберись зі своїм ворогом' }, { status: 409 })
  if (!character.duoPartnerId) return NextResponse.json({ error: 'У тебе немає напарника на вилазці' }, { status: 400 })

  const partnerRaw = await redis.get<string>(`char:${character.duoPartnerId}`)
  if (!partnerRaw) return NextResponse.json({ error: 'Напарника не знайдено' }, { status: 404 })
  const partner: Character = typeof partnerRaw === 'string' ? JSON.parse(partnerRaw) : partnerRaw
  if (partner.duoPartnerId !== charId) return NextResponse.json({ error: 'Ви більше не разом на вилазці' }, { status: 400 })
  if (!partner.combat) return NextResponse.json({ error: `${partner.name} зараз не в бою` }, { status: 400 })

  const combat = partner.combat
  const weapon = bestWeapon(character)
  const weaponItem: ItemDefinition | undefined = weapon.id === 'fists' ? undefined : getItem(weapon.id)
  const weaponName = weapon.id === 'fists' ? 'голі руки' : weaponItem?.name ?? weapon.id

  const sides = dieSizeForStat(character.stats[weapon.statKey])
  const scaledDefense = scaleDcForSides(combat.defense, sides)
  const attack = resolveAttack(weapon.statMod, scaledDefense, weapon.damageDice, sides)

  const ownLog: string[] = []
  const partnerLog: string[] = []

  if (attack.hit) {
    combat.hp = Math.max(0, combat.hp - attack.damage)
    ownLog.push(`🤝 Допомагаєш ${partner.name} у бою (${weaponName}): ${attack.critical ? 'КРИТ! ' : ''}${attack.damage} шкоди по ${combat.enemyLabel}.`)
    partnerLog.push(`🤝 ${character.name} б'є ${combat.enemyLabel} разом з тобою: ${attack.critical ? 'КРИТ! ' : ''}${attack.damage} шкоди. ОЗ ворога: ${combat.hp}/${combat.maxHp}`)
  } else {
    ownLog.push(`🤝 Намагаєшся допомогти ${partner.name} (${weaponName}), але промахуєшся (кидок ${attack.attackRoll.total} проти ${scaledDefense}).`)
    partnerLog.push(`🤝 ${character.name} намагається допомогти, але хибить.`)
  }

  if (weapon.id !== 'fists') {
    wearWeaponOnUse(character, weapon.id)
    if (isBroken(getDurability(character, weapon.id))) ownLog.push(`🔧 ${weaponName} зламалась від зносу!`)
  }
  const profGain = trainWeaponProficiency(character, weaponItem, attack.hit)
  if (profGain) ownLog.push(profGain)

  if (combat.hp <= 0) {
    character.xp += XP_REWARDS.combatWin
    character.zombiesKilled += 1
    partner.combat = null
    ownLog.push(`✅ ${combat.enemyLabel} знищено спільними зусиллями! (+${XP_REWARDS.combatWin} XP)`)
    partnerLog.push(`✅ ${combat.enemyLabel} знищено — ${character.name} добив(-ла) ворога.`)
  }

  if (partner.expedition) pushExpeditionLog(partner, partnerLog)

  await saveCharacter(charId, character)
  await saveCharacter(character.duoPartnerId, partner)
  await appendCharacterLog(charId, ownLog)
  await appendCharacterLog(character.duoPartnerId, partnerLog)

  return NextResponse.json({ character, log: ownLog })
}
