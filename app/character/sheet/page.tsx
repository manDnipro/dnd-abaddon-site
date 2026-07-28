'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Character, STAT_LABELS, Stats, StatKey, statModifier, formatModifier } from '@/lib/types'
import { getItem, RARITY_LABELS, getItemRarity, CLOTHING_SLOT_LABELS } from '@/lib/items'
import { getDurability, durabilityLabel, MAX_DURABILITY } from '@/lib/durability'
import { totalWarmth, totalArmor } from '@/lib/weather'
import { xpProgress, levelTitle } from '@/lib/levels'
import { reputationTier } from '@/lib/reputation'
import { characterTitle } from '@/lib/characterTitle'

const SLOTS = ['head', 'torso', 'legs', 'feet', 'accessory', 'backpack'] as const

export default function CharacterSheetPage() {
  const [character, setCharacter] = useState<Character | null | undefined>(undefined)

  useEffect(() => {
    fetch('/api/character/mine').then(r => r.json()).then(d => setCharacter(d.character))
  }, [])

  if (character === undefined) return <p style={{ color: '#555' }}>Гортаю особову справу...</p>
  if (character === null) return <p style={{ color: '#888' }}>Нема на кого дивитись.</p>

  const xp = xpProgress(character.xp)
  const repTier = reputationTier(character.reputation)
  const weapons = character.inventory.filter(s => {
    const it = getItem(s.itemId)
    return it && (it.type === 'weapon_melee' || it.type === 'weapon_ranged')
  })

  return (
    <div>
      <div className="card mb-4" style={{ borderColor: character.dead ? '#3a1010' : '#a68a4a30' }}>
        <div className="flex items-center gap-4">
          {character.avatar ? (
            <div style={{ position: 'relative', width: 72, height: 72, borderRadius: 6, overflow: 'hidden', border: '2px solid #a68a4a', flexShrink: 0 }}>
              <Image src={character.avatar} alt={character.name} fill style={{ objectFit: 'cover' }} />
            </div>
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: 6, border: '2px dashed #2a241c', flexShrink: 0 }} />
          )}
          <div>
            <h1 style={{ color: '#e5e5e5', fontSize: 22 }}>
              {character.name} {character.dead ? <span style={{ color: '#c0392b' }}>☠️</span> : <span style={{ color: '#75705f', fontSize: 16 }}>— {characterTitle(character.stats)}</span>}
            </h1>
            <p style={{ color: '#a68a4a', fontSize: 13, fontFamily: "'Special Elite', monospace", marginTop: 2 }}>
              {levelTitle(xp.level)} {xp.xpForNext !== null && <span style={{ color: '#666' }}>({xp.xpIntoLevel}/{xp.xpForNext} XP)</span>}
            </p>
            <p style={{ color: '#555', fontSize: 11, fontFamily: "'Special Elite', monospace", marginTop: 4 }}>
              ID персонажа: <span style={{ color: '#888' }}>#{character.id}</span> — назви цей номер, якщо звертаєшся до ГМ із проблемою
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="card">
          <h2 style={{ color: '#c9a227', fontSize: 14, marginBottom: 10 }}>Характеристики</h2>
          <div className="flex flex-col gap-1">
            {(Object.keys(STAT_LABELS) as StatKey[]).map(k => (
              <div key={k} className="flex justify-between" style={{ fontSize: 13 }}>
                <span style={{ color: '#888' }}>{STAT_LABELS[k]}</span>
                <span style={{ color: '#c9a94f', fontWeight: 700 }}>{character.stats[k]} ({formatModifier(statModifier(character.stats[k]))})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 style={{ color: '#c9a227', fontSize: 14, marginBottom: 10 }}>Володіння зброєю</h2>
          <div className="flex flex-col gap-2" style={{ fontSize: 13 }}>
            <div className="flex justify-between"><span style={{ color: '#888' }}>🗡️ Холодна зброя</span><span style={{ color: '#c9a94f' }}>{character.meleeProf}/10</span></div>
            <div className="flex justify-between"><span style={{ color: '#888' }}>🔫 Вогнепальна зброя</span><span style={{ color: '#c9a94f' }}>{character.firearmProf}/10</span></div>
            <div className="flex justify-between"><span style={{ color: '#888' }}>🏹 Полювання</span><span style={{ color: '#c9a94f' }}>{character.huntingProf}/10</span></div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <h2 style={{ color: '#c9a227', fontSize: 14, marginBottom: 10 }}>Стан</h2>
        <div className="flex flex-col gap-2">
          <Stat label="❤️ ОЗ" value={character.hp} max={character.maxHp} color="#b04a3a" />
          <Stat label="🍗 Голод" value={character.hunger} max={100} color="#a68a4a" />
          <Stat label="💧 Спрага" value={character.thirst} max={100} color="#3a7ab0" />
          <Stat label="☣️ Інфекція" value={character.infection} max={100} color="#8e44ad" />
          <Stat label="🧠 Мораль" value={character.morale} max={100} color="#7a9c4a" />
          <Stat label="🏅 Репутація в таборі" value={character.reputation} max={100} color="#c9a227" suffix={` (${repTier.label})`} />
        </div>
      </div>

      <div className="card mb-4">
        <h2 style={{ color: '#c9a227', fontSize: 14, marginBottom: 4 }}>Спорядження</h2>
        <p style={{ color: '#666', fontSize: 12, marginBottom: 10 }}>🔥 {totalWarmth(character)} тепла, 🛡️ {totalArmor(character)} броні</p>
        <div className="flex flex-col gap-2">
          {SLOTS.map(slot => {
            const equippedId = character.equipped[slot]
            const item = equippedId ? getItem(equippedId) : undefined
            const durability = equippedId ? getDurability(character, equippedId) : MAX_DURABILITY
            return (
              <div key={slot} className="flex justify-between items-center" style={{ fontSize: 13 }}>
                <span style={{ color: '#888' }}>{CLOTHING_SLOT_LABELS[slot]}</span>
                <span style={{ color: item ? '#ccc' : '#444', textAlign: 'right' }}>
                  {item ? item.name : '—'}
                  {item && <span style={{ color: '#666', marginLeft: 6 }}>{RARITY_LABELS[getItemRarity(item)]}</span>}
                  {item && durability < MAX_DURABILITY && (
                    <span style={{ marginLeft: 6, color: durability <= 0 ? '#c0392b' : '#a68a4a' }}>{durabilityLabel(durability)}</span>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {weapons.length > 0 && (
        <div className="card mb-4">
          <h2 style={{ color: '#c9a227', fontSize: 14, marginBottom: 10 }}>Зброя в інвентарі</h2>
          <div className="flex flex-col gap-2">
            {weapons.map(w => {
              const item = getItem(w.itemId)!
              const durability = getDurability(character, w.itemId)
              return (
                <div key={w.itemId} className="flex justify-between items-center" style={{ fontSize: 13 }}>
                  <span style={{ color: '#ccc' }}>{item.name} ×{w.qty} {item.damageDice && <span style={{ color: '#c0392b' }}>({item.damageDice})</span>}</span>
                  <span style={{ color: durability <= 0 ? '#c0392b' : durability < MAX_DURABILITY ? '#a68a4a' : '#5cb87a' }}>{durabilityLabel(durability)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {character.bio && (
        <div className="card">
          <h2 style={{ color: '#c9a227', fontSize: 14, marginBottom: 8 }}>Особливості</h2>
          <p style={{ color: '#c9c4ba', fontSize: 13, lineHeight: 1.7, fontFamily: "'Special Elite', monospace" }}>{character.bio}</p>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, max, color, suffix }: { label: string; value: number; max: number; color: string; suffix?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div>
      <div className="flex justify-between mb-1" style={{ fontSize: 12 }}>
        <span style={{ color: '#888' }}>{label}</span>
        <span style={{ color: '#ccc' }}>{value}/{max}{suffix}</span>
      </div>
      <div style={{ height: 8, background: '#0a0908', border: '1px solid #201b15', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color }} />
      </div>
    </div>
  )
}
