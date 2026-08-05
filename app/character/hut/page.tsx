'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Character } from '@/lib/types'
import { getItem } from '@/lib/items'
import { HUT_STAGES, HUT_UNLOCK_REPUTATION, HUT_STORAGE_CAPACITY, currentHutStageIndex, nextHutStage, hutStorageCount } from '@/lib/hut'
import DiceLogLine from '@/components/DiceLogLine'

export default function HutPage() {
  const [character, setCharacter] = useState<Character | null | undefined>(undefined)
  const [log, setLog] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    setCharacter(d.character ?? d)
  }

  if (character === undefined) return <p style={{ color: '#555' }}>Шукаю дорогу до хібари...</p>
  if (character === null) return <p style={{ color: '#888' }}>Спершу створи персонажа.</p>
  if (character.status !== 'approved') return <p style={{ color: '#888' }}>ГМ ще не пропустив тебе за ворота табору.</p>
  if (character.dead) return <p style={{ color: '#c0392b' }}>☠️ {character.name} більше нікуди не піде.</p>

  const unlocked = character.hutUnlocked || character.reputation >= HUT_UNLOCK_REPUTATION
  const built = character.hutProgress >= 100
  const stageIdx = currentHutStageIndex(character.hutProgress)
  const stage = HUT_STAGES[stageIdx]
  const nextStage = nextHutStage(character.hutProgress)

  return (
    <div>
      <h1 style={{ color: '#e5e5e5', fontSize: 24, marginBottom: 4 }}>🏠 Хібара</h1>
      <p style={{ color: '#666', marginBottom: 16, fontSize: 13 }}>
        Особисте житло, розблоковується при репутації {HUT_UNLOCK_REPUTATION}. Поки живеш там — щогодини трохи відновлюєшся.
      </p>

      {error && <p style={{ color: '#c0392b', marginBottom: 16 }}>🚫 {error}</p>}

      {!unlocked && (
        <div className="card mb-6 text-center">
          <p style={{ color: '#888', marginBottom: 8 }}>Табір ще не довіряє тобі настільки, щоб виділити землю під забудову.</p>
          <p style={{ color: '#c9a227', fontSize: 20, fontWeight: 700 }}>Репутація: {character.reputation}/{HUT_UNLOCK_REPUTATION}</p>
        </div>
      )}

      {unlocked && (
        <>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '768 / 512', borderRadius: 6, overflow: 'hidden', border: '1px solid #2a241c', marginBottom: 12 }}>
            <Image src={`/hut/${stage.image}`} alt={stage.label} fill style={{ objectFit: 'cover' }} priority />
          </div>

          <div className="card mb-6">
            <div className="flex justify-between items-center mb-2">
              <span style={{ color: '#c9a94f', fontSize: 14, fontWeight: 700 }}>
                {built ? 'Хібару добудовано! 🎉' : `Етап: ${stage.label}`}
              </span>
              <span style={{ color: '#888', fontSize: 13 }}>{character.hutProgress}%</span>
            </div>
            <div style={{ height: 10, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ width: `${character.hutProgress}%`, height: '100%', background: built ? '#5cb87a' : '#c9a227', transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {!built && nextStage && (
            <div className="card mb-6">
              <h2 style={{ color: '#c9a227', fontSize: 15, marginBottom: 4 }}>Потрібно для етапу «{nextStage.label}»</h2>
              <p style={{ color: '#666', fontSize: 12, marginBottom: 12 }}>Досягнеш {nextStage.progressAt}% прогресу, коли все внесеш.</p>
              <div className="flex flex-col gap-2">
                {nextStage.cost.map(c => {
                  const contribKey = `${nextStage.key}:${c.itemKey}`
                  const have = character.hutContributions[contribKey] ?? 0
                  const inInventory = character.inventory.find(s => s.itemId === c.itemKey)?.qty ?? 0
                  const remaining = Math.max(0, c.quantity - have)
                  return (
                    <div key={c.itemKey} className="flex items-center justify-between" style={{ background: '#0a0a0a', border: '1px solid #1e2230', borderRadius: 6, padding: '8px 12px' }}>
                      <span style={{ color: remaining === 0 ? '#5cb87a' : '#ccc', fontSize: 13 }}>
                        {getItem(c.itemKey)?.name ?? c.itemKey}: {have}/{c.quantity}
                        {remaining > 0 && <span style={{ color: '#555', marginLeft: 8 }}>(з собою: {inInventory})</span>}
                      </span>
                      {remaining > 0 && (
                        <button
                          onClick={() => call('/api/character/hut/contribute', { itemKey: c.itemKey, qty: Math.min(remaining, inInventory) })}
                          disabled={loading || inInventory === 0} className="btn-gold" style={{ fontSize: 12, padding: '5px 12px' }}>
                          Внести {Math.min(remaining, inInventory) || ''}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {built && (
            <>
              <div className="card mb-6 flex gap-3">
                {!character.inHut ? (
                  <button onClick={() => call('/api/character/hut/enter')} disabled={loading} className="btn-primary">🏠 Зайти відпочити</button>
                ) : (
                  <button onClick={() => call('/api/character/hut/exit')} disabled={loading} className="btn-gold">🚪 Вийти</button>
                )}
                {character.inHut && <span style={{ color: '#5cb87a', fontSize: 13, alignSelf: 'center' }}>Ти вдома — щогодини +1 до ОЗ/голоду/спраги/моралі.</span>}
              </div>

              <div className="card mb-6">
                <h2 style={{ color: '#c9a227', fontSize: 15, marginBottom: 4 }}>Сховище хібари</h2>
                <p style={{ color: '#666', fontSize: 12, marginBottom: 12 }}>
                  Зайнято: {hutStorageCount(character.hutStorage)}/{HUT_STORAGE_CAPACITY}
                </p>
                <div className="flex flex-col gap-4">
                  <div>
                    <p style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Сховати з інвентаря</p>
                    <div className="flex flex-col gap-2">
                      {character.inventory.map(s => (
                        <div key={s.itemId} className="flex items-center justify-between" style={{ background: '#0a0a0a', border: '1px solid #1e2230', borderRadius: 6, padding: '6px 10px' }}>
                          <span style={{ color: '#ccc', fontSize: 13 }}>{getItem(s.itemId)?.name ?? s.itemId} ×{s.qty}</span>
                          <button onClick={() => call('/api/character/hut/storage', { action: 'store', itemId: s.itemId, qty: 1 })} disabled={loading}
                            style={{ fontSize: 11, color: '#a68a4a', background: 'none', border: '1px solid #2a241c', borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}>
                            → у сховище
                          </button>
                        </div>
                      ))}
                      {character.inventory.length === 0 && <p style={{ color: '#555', fontSize: 13 }}>Нести нічого — руки порожні.</p>}
                    </div>
                  </div>
                  <div>
                    <p style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Забрати зі сховища</p>
                    <div className="flex flex-col gap-2">
                      {character.hutStorage.map(s => (
                        <div key={s.itemId} className="flex items-center justify-between" style={{ background: '#0a0a0a', border: '1px solid #1e2230', borderRadius: 6, padding: '6px 10px' }}>
                          <span style={{ color: '#ccc', fontSize: 13 }}>{getItem(s.itemId)?.name ?? s.itemId} ×{s.qty}</span>
                          <button onClick={() => call('/api/character/hut/storage', { action: 'take', itemId: s.itemId, qty: 1 })} disabled={loading}
                            style={{ fontSize: 11, color: '#27ae60', background: 'none', border: '1px solid #1a2a1a', borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}>
                            ← забрати
                          </button>
                        </div>
                      ))}
                      {character.hutStorage.length === 0 && <p style={{ color: '#555', fontSize: 13 }}>Сховище поки порожнє.</p>}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {log.length > 0 && (
        <div className="card" style={{ borderColor: '#3a1010' }}>
          <p style={{ fontFamily: "'Special Elite', monospace", fontSize: 11, color: '#a68a4a', letterSpacing: '0.2em', marginBottom: 14 }}>ЖУРНАЛ</p>
          <div className="flex flex-col gap-2">
            {log.map((line, i) => <p key={i} style={{ color: '#c9c4ba', fontSize: 13, lineHeight: 1.6, fontFamily: "'Special Elite', monospace" }}><DiceLogLine text={line} /></p>)}
          </div>
        </div>
      )}
    </div>
  )
}
