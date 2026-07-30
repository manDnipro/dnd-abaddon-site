import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { isGM } from '@/lib/auth'
import { Character } from '@/lib/types'
import { getOwnerCharId } from '@/lib/ownerChar'

export async function POST(req: NextRequest) {
  if (!await isGM()) return NextResponse.json({ error: 'Немає доступу' }, { status: 403 })

  const { charId } = await req.json() as { charId: string }
  const raw = await redis.get<string>(`char:${charId}`)
  if (!raw) return NextResponse.json({ error: 'Персонажа не знайдено' }, { status: 404 })
  const character: Character = typeof raw === 'string' ? JSON.parse(raw) : raw

  const wasDead = character.dead
  if (wasDead) {
    // The player may have already made a brand new character after this one died — reviving this
    // one too would leave the account with two "living" characters at once (one of them orphaned,
    // since char:owner can only point at one), the exact duplicate-record bug this whole invariant
    // exists to prevent. Block it if the account has moved on.
    const currentCharId = await getOwnerCharId(character.owner)
    if (currentCharId && currentCharId !== charId) {
      return NextResponse.json({
        error: `Гравець ${character.owner} уже створив нового персонажа (#${currentCharId}) — цього старого (#${charId}) воскресити не можна, буде два живих одразу.`,
      }, { status: 409 })
    }
  }

  character.dead = false
  character.hp = character.maxHp
  character.hunger = 100
  character.thirst = 100
  character.infection = 0
  character.morale = 100
  // Only clear a stuck expedition when actually reviving from death — a living character being
  // fully healed shouldn't get yanked out of an expedition they're mid-way through.
  if (wasDead) { character.expedition = null; character.combat = null }

  await redis.set(`char:${charId}`, JSON.stringify(character))
  return NextResponse.json(character)
}
