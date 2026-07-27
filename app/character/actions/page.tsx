'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Character, STAT_LABELS, StatKey } from '@/lib/types'
import { getItem, isConsumable } from '@/lib/items'
import { CRAFT_RECIPES } from '@/lib/crafting'
import { countOf } from '@/lib/stacks'

type Tab = 'quick' | 'items' | 'craft' | 'storage'

export default function ActionsPage() {
  const [character, setCharacter] = useState<Character | null | undefined>(undefined)
  const [log, setLog] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<Tab>('quick')

  async function load() {
    const res = await fetch('/api/character/mine')
    const d = await res.json()
    setCharacter(d.character)
  }
  useEffect(() => { load() }, [])

  async function call(url: string, body?: object) {
    setLoading(true)
    setError('')
    const res = await fetch(url, {
      method: 'POST',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    const d = await res.json()
    setLoading(false)
    if (!res.ok) { setError(d.error || 'Помилка'); return }
    if (d.log) setLog(l => [...d.log, ...l])
    setCharacter(d.character ?? character)
  }

  if (character === undefined) return <p style={{ color: '#555' }}>Завантаження...</p>
  if (character === null) return <p style={{ color: '#888' }}>У тебе ще немає персонажа.</p>
  if (character.status !== 'approved') return <p style={{ color: '#888' }}>Дії доступні лише після затвердження персонажа ГМ.</p>
  if (character.dead) return <p style={{ color: '#c0392b' }}>☠️ {character.name} загинув(-ла).</p>

  const tabs: { key: Tab; label: string }[] = [
    { key: 'quick', label: 'Швидкі дії' },
    { key: 'items', label: 'Предмети' },
    { key: 'craft', label: 'Крафт' },
    { key: 'storage', label: 'Ящик' },
  ]

  return (
    <div>
      <div style={{ position: 'relative', width: '100%', height: 150, borderRadius: 4, overflow: 'hidden', marginBottom: 16, border: '1px solid #2a241c' }}>
        <Image src="/camp/camp-map.png" alt="Табір" fill style={{ objectFit: 'cover' }} priority />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(8,7,6,0.9) 100%)' }} />
      </div>
      <h1 style={{ color: '#e5e5e5', fontSize: 24, marginBottom: 4 }}>Дії — {character.name}</h1>
      <p style={{ color: '#666', marginBottom: 16, fontSize: 13 }}>
        ОЗ: {character.hp}/{character.maxHp} · Голод: {character.hunger} · Спрага: {character.thirst} · Мораль: {character.morale} · Репутація: {character.reputation}
        {character.infection > 0 && <> · <span style={{ color: '#8e44ad' }}>Інфекція: {character.infection}</span></>}
      </p>

      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              fontSize: 13, padding: '6px 14px', borderRadius: 4, cursor: 'pointer',
              background: tab === t.key ? 'rgba(166,138,74,0.15)' : 'transparent',
              border: `1px solid ${tab === t.key ? '#a68a4a' : '#2a241c'}`,
              color: tab === t.key ? '#c9a94f' : '#888',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <p style={{ color: '#c0392b', marginBottom: 16 }}>🚫 {error}</p>}

      {tab === 'quick' && (
        <div className="card mb-6">
          <div className="flex gap-3 flex-wrap mb-6">
            <button onClick={() => call('/api/character/rest')} disabled={loading} className="btn-primary">🛌 Відпочити</button>
            <button onClick={() => call('/api/character/hunt')} disabled={loading} className="btn-gold">🏹 Полювання</button>
          </div>
          <h2 style={{ color: '#c9a227', fontSize: 15, marginBottom: 10 }}>Перевірка характеристики</h2>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(STAT_LABELS) as StatKey[]).map(k => (
              <button key={k} onClick={() => call('/api/character/check', { stat: k })} disabled={loading}
                style={{ fontSize: 12, padding: '6px 12px', borderRadius: 4, border: '1px solid #2a241c', background: 'none', color: '#ccc', cursor: 'pointer' }}>
                {STAT_LABELS[k]}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'items' && (
        <div className="card mb-6">
          <h2 style={{ color: '#c9a227', fontSize: 15, marginBottom: 10 }}>Використати предмет</h2>
          <div className="flex flex-col gap-2">
            {character.inventory.filter(s => { const it = getItem(s.itemId); return it && isConsumable(it) }).map(s => {
              const item = getItem(s.itemId)!
              return (
                <div key={s.itemId} className="flex items-center justify-between" style={{ background: '#0a0a0a', border: '1px solid #1e2230', borderRadius: 6, padding: '8px 12px' }}>
                  <span style={{ color: '#e5e5e5', fontSize: 14 }}>{item.name} <span style={{ color: '#666', fontSize: 12 }}>×{s.qty}</span></span>
                  <button onClick={() => call('/api/character/use-item', { itemId: s.itemId })} disabled={loading}
                    style={{ fontSize: 12, color: '#27ae60', background: 'none', border: '1px solid #1a2a1a', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>
                    Використати
                  </button>
                </div>
              )
            })}
            {character.inventory.filter(s => { const it = getItem(s.itemId); return it && isConsumable(it) }).length === 0 && (
              <p style={{ color: '#555', fontSize: 13 }}>Немає предметів, які можна використати.</p>
            )}
          </div>
        </div>
      )}

      {tab === 'craft' && (
        <div className="card mb-6">
          <h2 style={{ color: '#c9a227', fontSize: 15, marginBottom: 10 }}>Крафт</h2>
          <div className="flex flex-col gap-2">
            {CRAFT_RECIPES.map(r => {
              const resultItem = getItem(r.resultKey)
              const canCraft = r.ingredients.every(ing => countOf(character.inventory, ing.itemKey) + countOf(character.storageBox, ing.itemKey) >= ing.quantity)
                && (!r.requiredTool || countOf(character.inventory, r.requiredTool) + countOf(character.storageBox, r.requiredTool) > 0)
              return (
                <div key={r.key} className="flex items-center justify-between" style={{ background: '#0a0a0a', border: '1px solid #1e2230', borderRadius: 6, padding: '8px 12px', opacity: canCraft ? 1 : 0.5 }}>
                  <div>
                    <span style={{ color: '#e5e5e5', fontSize: 14 }}>{resultItem?.name ?? r.resultKey} ×{r.resultQuantity}</span>
                    <div style={{ color: '#666', fontSize: 11 }}>
                      {r.ingredients.map(i => `${getItem(i.itemKey)?.name ?? i.itemKey} ×${i.quantity}`).join(', ')}
                      {r.requiredTool && ` · інструмент: ${getItem(r.requiredTool)?.name}`}
                    </div>
                  </div>
                  <button onClick={() => call('/api/character/craft', { recipeKey: r.key })} disabled={loading || !canCraft}
                    style={{ fontSize: 12, color: '#c9a227', background: 'none', border: '1px solid #2a2410', borderRadius: 4, padding: '4px 10px', cursor: canCraft ? 'pointer' : 'not-allowed' }}>
                    Зробити
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'storage' && (
        <div className="card mb-6">
          <h2 style={{ color: '#c9a227', fontSize: 15, marginBottom: 10 }}>Особистий ящик (безлімітний)</h2>
          <div className="flex flex-col gap-4">
            <div>
              <p style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>В інвентарі — покласти в ящик</p>
              <div className="flex flex-col gap-2">
                {character.inventory.map(s => (
                  <div key={s.itemId} className="flex items-center justify-between" style={{ background: '#0a0a0a', border: '1px solid #1e2230', borderRadius: 6, padding: '6px 10px' }}>
                    <span style={{ color: '#ccc', fontSize: 13 }}>{getItem(s.itemId)?.name ?? s.itemId} ×{s.qty}</span>
                    <button onClick={() => call('/api/character/storage', { action: 'store', itemId: s.itemId, qty: 1 })} disabled={loading}
                      style={{ fontSize: 11, color: '#a68a4a', background: 'none', border: '1px solid #2a241c', borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}>
                      → в ящик
                    </button>
                  </div>
                ))}
                {character.inventory.length === 0 && <p style={{ color: '#555', fontSize: 13 }}>Інвентар порожній.</p>}
              </div>
            </div>
            <div>
              <p style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>У ящику — забрати в інвентар</p>
              <div className="flex flex-col gap-2">
                {character.storageBox.map(s => (
                  <div key={s.itemId} className="flex items-center justify-between" style={{ background: '#0a0a0a', border: '1px solid #1e2230', borderRadius: 6, padding: '6px 10px' }}>
                    <span style={{ color: '#ccc', fontSize: 13 }}>{getItem(s.itemId)?.name ?? s.itemId} ×{s.qty}</span>
                    <button onClick={() => call('/api/character/storage', { action: 'take', itemId: s.itemId, qty: 1 })} disabled={loading}
                      style={{ fontSize: 11, color: '#27ae60', background: 'none', border: '1px solid #1a2a1a', borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}>
                      ← забрати
                    </button>
                  </div>
                ))}
                {character.storageBox.length === 0 && <p style={{ color: '#555', fontSize: 13 }}>Ящик порожній.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {log.length > 0 && (
        <div className="card">
          <h2 style={{ color: '#c9a227', fontSize: 16, marginBottom: 10 }}>Журнал</h2>
          <div className="flex flex-col gap-1">
            {log.map((line, i) => <p key={i} style={{ color: '#bbb', fontSize: 13 }}>{line}</p>)}
          </div>
        </div>
      )}
    </div>
  )
}
