'use client'
import { useEffect, useState } from 'react'
import { Character, ClothingSlot } from '@/lib/types'
import { getItem, RARITY_LABELS, getItemRarity, CLOTHING_SLOT_LABELS } from '@/lib/items'
import { getDurability, durabilityLabel, MAX_DURABILITY } from '@/lib/durability'

export default function InventoryPage() {
  const [character, setCharacter] = useState<Character | null | undefined>(undefined)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    const res = await fetch('/api/character/mine')
    const d = await res.json()
    setCharacter(d.character)
  }

  useEffect(() => { load() }, [])

  async function equip(itemId: string) {
    setLoading(true)
    setError('')
    const res = await fetch('/api/character/equip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'equip', itemId }),
    })
    if (res.ok) await load()
    else setError((await res.json()).error || 'Помилка')
    setLoading(false)
  }

  async function unequip(slot: ClothingSlot) {
    setLoading(true)
    setError('')
    const res = await fetch('/api/character/equip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unequip', slot }),
    })
    if (res.ok) await load()
    else setError((await res.json()).error || 'Помилка')
    setLoading(false)
  }

  if (character === undefined) return <p style={{ color: '#555' }}>Перебираю мотлох...</p>
  if (character === null) return <p style={{ color: '#888' }}>Нема на кому спорядження носити.</p>
  if (character.status !== 'approved') return <p style={{ color: '#888' }}>ГМ ще не пропустив тебе за ворота.</p>

  return (
    <div>
      <h1 style={{ color: '#e5e5e5', fontSize: 24, marginBottom: 4 }}>Що на тобі, {character.name}</h1>
      <p style={{ color: '#666', marginBottom: 16, fontSize: 13, fontFamily: "'Special Elite', monospace" }}>Все, що зараз тримає тебе живим — тепло, броня, зброя в руці.</p>

      {error && <p style={{ color: '#c0392b', marginBottom: 16 }}>🚫 {error}</p>}

      <div className="card mb-6">
        <h2 style={{ color: '#c9a227', fontSize: 16, marginBottom: 12 }}>Вдягнене на тобі</h2>
        <div className="flex flex-col gap-2">
          {(Object.keys(CLOTHING_SLOT_LABELS) as ClothingSlot[]).map(slot => {
            const equippedId = character.equipped[slot]
            const item = equippedId ? getItem(equippedId) : undefined
            return (
              <div key={slot} className="flex items-center justify-between" style={{ background: '#0a0a0a', border: '1px solid #1e2230', borderRadius: 6, padding: '8px 12px' }}>
                <div>
                  <span style={{ color: '#666', fontSize: 12 }}>{CLOTHING_SLOT_LABELS[slot]}: </span>
                  <span style={{ color: item ? '#e5e5e5' : '#444', fontSize: 14 }}>{item ? item.name : '—'}</span>
                  {item && <span style={{ color: '#888', fontSize: 11, marginLeft: 8 }}>{RARITY_LABELS[getItemRarity(item)]}</span>}
                  {item && (() => { const d = getDurability(character, equippedId!); return d < MAX_DURABILITY ? <span style={{ fontSize: 11, marginLeft: 8, color: d <= 0 ? '#c0392b' : '#a68a4a' }}>{durabilityLabel(d)}</span> : null })()}
                </div>
                {item && (
                  <button onClick={() => unequip(slot)} disabled={loading}
                    style={{ fontSize: 12, color: '#c0392b', background: 'none', border: '1px solid #2a1a1a', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>
                    Зняти
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="card">
        <h2 style={{ color: '#c9a227', fontSize: 16, marginBottom: 12 }}>При собі носиш ({character.inventory.length})</h2>
        {character.inventory.length === 0 && <p style={{ color: '#555' }}>Кишені й рюкзак порожні.</p>}
        <div className="flex flex-col gap-2">
          {character.inventory.map(stack => {
            const item = getItem(stack.itemId)
            if (!item) return null
            const canEquip = item.type === 'clothing' && !!item.slot
            return (
              <div key={stack.itemId} className="flex items-center justify-between" style={{ background: '#0a0a0a', border: '1px solid #1e2230', borderRadius: 6, padding: '8px 12px' }}>
                <div>
                  <span style={{ color: '#e5e5e5', fontSize: 14 }}>{item.name}</span>
                  <span style={{ color: '#666', fontSize: 12, marginLeft: 8 }}>×{stack.qty}</span>
                  <span style={{ color: '#888', fontSize: 11, marginLeft: 8 }}>{RARITY_LABELS[getItemRarity(item)]}</span>
                  {item.damageDice && <span style={{ color: '#c0392b', fontSize: 11, marginLeft: 8 }}>⚔ {item.damageDice}</span>}
                  {(() => { const d = getDurability(character, stack.itemId); return d < MAX_DURABILITY ? <span style={{ fontSize: 11, marginLeft: 8, color: d <= 0 ? '#c0392b' : '#a68a4a' }}>{durabilityLabel(d)}</span> : null })()}
                </div>
                {canEquip && (
                  <button onClick={() => equip(item.key)} disabled={loading}
                    style={{ fontSize: 12, color: '#27ae60', background: 'none', border: '1px solid #1a2a1a', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>
                    Вдягнути
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
