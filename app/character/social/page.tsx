'use client'
import { useEffect, useState } from 'react'
import { Character } from '@/lib/types'
import { EXPEDITION_LEVELS } from '@/lib/expedition'
import { MeetRequest, DuoInvite } from '@/lib/socialStore'

export default function SocialPage() {
  const [character, setCharacter] = useState<Character | null | undefined>(undefined)
  const [others, setOthers] = useState<{ id: string; name: string }[]>([])
  const [pendingMeet, setPendingMeet] = useState<MeetRequest | null>(null)
  const [pendingDuo, setPendingDuo] = useState<DuoInvite | null>(null)
  const [reveals, setReveals] = useState<string[]>([])
  const [duoTarget, setDuoTarget] = useState<string>('')
  const [duoLevel, setDuoLevel] = useState<string>(EXPEDITION_LEVELS[0].key)
  const [log, setLog] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    const [c, o, m, d, r] = await Promise.all([
      fetch('/api/character/mine').then(r => r.json()),
      fetch('/api/character/others').then(r => r.json()),
      fetch('/api/social/meet/pending').then(r => r.json()),
      fetch('/api/social/duo/pending').then(r => r.json()),
      fetch('/api/social/reveals').then(r => r.json()),
    ])
    setCharacter(c.character)
    setOthers(o)
    setPendingMeet(m.meet)
    setPendingDuo(d.invite)
    if (r.reveals?.length) setReveals(rv => [...r.reveals, ...rv])
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

  if (character === undefined) return <p style={{ color: '#555' }}>Завантаження...</p>
  if (character === null) return <p style={{ color: '#888' }}>У тебе ще немає персонажа.</p>
  if (character.status !== 'approved') return <p style={{ color: '#888' }}>Доступно лише після затвердження персонажа ГМ.</p>

  return (
    <div>
      <h1 style={{ color: '#e5e5e5', fontSize: 24, marginBottom: 4 }}>Табірне життя</h1>
      <p style={{ color: '#666', marginBottom: 20, fontSize: 13 }}>Знайомся з іншими вцілілими та кличи їх на спільні вилазки.</p>

      {error && <p style={{ color: '#c0392b', marginBottom: 16 }}>🚫 {error}</p>}

      {pendingMeet && (
        <div className="card mb-6" style={{ borderColor: '#a68a4a' }}>
          <p style={{ color: '#e5e5e5', fontSize: 14, marginBottom: 12 }}>👋 <b>{pendingMeet.requesterName}</b> підходить привітатися до тебе.</p>
          <div className="flex gap-3">
            <button onClick={() => call('/api/social/meet/confirm', { action: 'confirm' })} disabled={loading} className="btn-primary">Привітатися</button>
            <button onClick={() => call('/api/social/meet/confirm', { action: 'decline' })} disabled={loading} className="btn-gold">Ігнорувати</button>
          </div>
        </div>
      )}

      {pendingDuo && (
        <div className="card mb-6" style={{ borderColor: '#a68a4a' }}>
          <p style={{ color: '#e5e5e5', fontSize: 14, marginBottom: 12 }}>
            🔍🤝 <b>{pendingDuo.fromName}</b> пропонує вилазку вдвох ({EXPEDITION_LEVELS.find(l => l.key === pendingDuo.levelKey)?.label}).
          </p>
          <div className="flex gap-3">
            <button onClick={() => call('/api/social/duo/accept', { action: 'accept' })} disabled={loading} className="btn-primary">Приєднатися</button>
            <button onClick={() => call('/api/social/duo/accept', { action: 'decline' })} disabled={loading} className="btn-gold">Відмовитись</button>
          </div>
        </div>
      )}

      <div className="card mb-6">
        <h2 style={{ color: '#c9a227', fontSize: 15, marginBottom: 12 }}>👋 Познайомитися</h2>
        {others.length === 0 && <p style={{ color: '#555', fontSize: 13 }}>Зараз у таборі більше нікого немає.</p>}
        <div className="flex flex-col gap-2">
          {others.map(o => (
            <button key={o.id} onClick={() => call('/api/social/meet', { targetCharId: o.id })} disabled={loading}
              style={{ textAlign: 'left', background: '#0a0a0a', border: '1px solid #1e2230', borderRadius: 6, padding: '8px 12px', color: '#e5e5e5', cursor: 'pointer' }}>
              {o.name}
            </button>
          ))}
        </div>
      </div>

      <div className="card mb-6">
        <h2 style={{ color: '#c9a227', fontSize: 15, marginBottom: 12 }}>🔍🤝 Запросити на вилазку вдвох</h2>
        {others.length === 0 ? (
          <p style={{ color: '#555', fontSize: 13 }}>Зараз у таборі більше нікого немає.</p>
        ) : (
          <>
            <select value={duoTarget} onChange={e => setDuoTarget(e.target.value)} className="mb-3">
              <option value="">Обери гравця...</option>
              {others.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <select value={duoLevel} onChange={e => setDuoLevel(e.target.value)} className="mb-3">
              {EXPEDITION_LEVELS.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
            </select>
            <button onClick={() => call('/api/social/duo', { targetCharId: duoTarget, levelKey: duoLevel })} disabled={loading || !duoTarget} className="btn-primary">
              Запросити
            </button>
          </>
        )}
      </div>

      {(reveals.length > 0 || log.length > 0) && (
        <div className="card" style={{ borderColor: '#3a1010' }}>
          <p style={{ fontFamily: "'Special Elite', monospace", fontSize: 11, color: '#a68a4a', letterSpacing: '0.2em', marginBottom: 14 }}>ЖУРНАЛ</p>
          <div className="flex flex-col gap-2">
            {[...log, ...reveals].map((line, i) => (
              <p key={i} style={{ color: '#c9c4ba', fontSize: 13, lineHeight: 1.6, fontFamily: "'Special Elite', monospace" }}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
