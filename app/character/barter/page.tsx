'use client'
import { useEffect, useState } from 'react'
import { Character } from '@/lib/types'
import { getItem } from '@/lib/items'
import { BarterSession } from '@/lib/barterStore'

export default function BarterPage() {
  const [character, setCharacter] = useState<Character | null | undefined>(undefined)
  const [others, setOthers] = useState<{ id: string; name: string }[]>([])
  const [session, setSession] = useState<BarterSession | null>(null)
  const [mySide, setMySide] = useState<'a' | 'b' | null>(null)
  const [otherName, setOtherName] = useState('')
  const [log, setLog] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    const [c, mine] = await Promise.all([
      fetch('/api/character/mine').then(r => r.json()),
      fetch('/api/barter/mine').then(r => r.json()),
    ])
    setCharacter(c.character)
    setSession(mine.session)
    setMySide(mine.mySide ?? null)
    setOtherName(mine.otherName ?? '')
    if (!mine.session) {
      const o = await fetch('/api/character/others').then(r => r.json())
      setOthers(o)
    }
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
    await load()
  }

  if (character === undefined) return <p style={{ color: '#555' }}>Дивлюсь, хто ще не спить у таборі...</p>
  if (character === null) return <p style={{ color: '#888' }}>Нема кому обмінюватись — спершу створи персонажа.</p>
  if (character.status !== 'approved') return <p style={{ color: '#888' }}>Тобі ще не довіряють настільки.</p>

  const myItems = mySide === 'a' ? session?.itemsA : session?.itemsB
  const theirItems = mySide === 'a' ? session?.itemsB : session?.itemsA
  const myConfirmed = mySide === 'a' ? session?.confirmedA : session?.confirmedB
  const theirConfirmed = mySide === 'a' ? session?.confirmedB : session?.confirmedA

  return (
    <div>
      <h1 style={{ color: '#e5e5e5', fontSize: 24, marginBottom: 4 }}>Ти — мені, я — тобі</h1>
      <p style={{ color: '#666', marginBottom: 20, fontSize: 13 }}>Чесний обмін між тими, хто ще довіряє один одному.</p>

      {error && <p style={{ color: '#c0392b', marginBottom: 16 }}>🚫 {error}</p>}

      {!session && (
        <div className="card mb-6">
          <h2 style={{ color: '#c9a227', fontSize: 15, marginBottom: 12 }}>З ким поговорити про обмін?</h2>
          {others.length === 0 && <p style={{ color: '#555', fontSize: 13 }}>Табір порожній — нема з ким мінятись.</p>}
          <div className="flex flex-col gap-2">
            {others.map(o => (
              <button key={o.id} onClick={() => call('/api/barter/start', { targetCharId: o.id })} disabled={loading}
                style={{ textAlign: 'left', background: '#0a0a0a', border: '1px solid #1e2230', borderRadius: 6, padding: '10px 14px', color: '#e5e5e5', cursor: 'pointer' }}>
                {o.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {session && session.status === 'active' && (
        <div className="card mb-6">
          <h2 style={{ color: '#c9a227', fontSize: 15, marginBottom: 12 }}>Домовляєшся з {otherName}</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p style={{ color: myConfirmed ? '#27ae60' : '#888', fontSize: 12, marginBottom: 8 }}>{myConfirmed ? '✅' : '⏳'} Ти кладеш на стіл</p>
              <div className="flex flex-col gap-1">
                {myItems?.map(s => (
                  <div key={s.itemId} className="flex justify-between items-center" style={{ background: '#0a0a0a', border: '1px solid #1e2230', borderRadius: 4, padding: '4px 8px' }}>
                    <span style={{ color: '#ccc', fontSize: 12 }}>{getItem(s.itemId)?.name ?? s.itemId} ×{s.qty}</span>
                    <button onClick={() => call('/api/barter/remove', { itemId: s.itemId })} disabled={loading} style={{ color: '#c0392b', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>✕</button>
                  </div>
                ))}
                {(!myItems || myItems.length === 0) && <p style={{ color: '#444', fontSize: 12 }}>Порожньо</p>}
              </div>
            </div>
            <div>
              <p style={{ color: theirConfirmed ? '#27ae60' : '#888', fontSize: 12, marginBottom: 8 }}>{theirConfirmed ? '✅' : '⏳'} {otherName} кладе на стіл</p>
              <div className="flex flex-col gap-1">
                {theirItems?.map(s => (
                  <div key={s.itemId} style={{ background: '#0a0a0a', border: '1px solid #1e2230', borderRadius: 4, padding: '4px 8px' }}>
                    <span style={{ color: '#ccc', fontSize: 12 }}>{getItem(s.itemId)?.name ?? s.itemId} ×{s.qty}</span>
                  </div>
                ))}
                {(!theirItems || theirItems.length === 0) && <p style={{ color: '#444', fontSize: 12 }}>Порожньо</p>}
              </div>
            </div>
          </div>

          <p style={{ color: '#c9a227', fontSize: 13, marginBottom: 8 }}>Дістати з кишень для торгу</p>
          <div className="flex flex-col gap-1 mb-4">
            {character.inventory.map(s => (
              <button key={s.itemId} onClick={() => call('/api/barter/add', { itemId: s.itemId, qty: 1 })} disabled={loading}
                className="flex justify-between items-center" style={{ background: '#0a0a0a', border: '1px solid #1e2230', borderRadius: 4, padding: '5px 10px', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ color: '#ccc', fontSize: 12 }}>{getItem(s.itemId)?.name ?? s.itemId} ×{s.qty}</span>
                <span style={{ color: '#27ae60', fontSize: 12 }}>+</span>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={() => call('/api/barter/confirm')} disabled={loading} className="btn-primary">✅ По руках</button>
            <button onClick={() => call('/api/barter/cancel')} disabled={loading} className="btn-gold">🚫 Передумав(-ла)</button>
            <button onClick={() => load()} disabled={loading} style={{ color: '#888', background: 'none', border: '1px solid #2a241c', borderRadius: 4, padding: '0 14px', cursor: 'pointer' }}>🔄 Що там у нього?</button>
          </div>
        </div>
      )}

      {log.length > 0 && (
        <div className="card" style={{ borderColor: '#3a1010' }}>
          <p style={{ fontFamily: "'Special Elite', monospace", fontSize: 11, color: '#a68a4a', letterSpacing: '0.2em', marginBottom: 14 }}>ЖУРНАЛ ОБМІНУ</p>
          <div className="flex flex-col gap-2">
            {log.map((line, i) => <p key={i} style={{ color: '#c9c4ba', fontSize: 13, lineHeight: 1.6, fontFamily: "'Special Elite', monospace" }}>{line}</p>)}
          </div>
        </div>
      )}
    </div>
  )
}
