'use client'
import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { Character } from '@/lib/types'
import { EXPEDITION_LEVELS } from '@/lib/expedition'

export default function ExpeditionPage() {
  const [character, setCharacter] = useState<Character | null | undefined>(undefined)
  const [log, setLog] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [now, setNow] = useState(Date.now())

  const load = useCallback(async () => {
    const res = await fetch('/api/character/mine')
    const d = await res.json()
    setCharacter(d.character)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  async function call(url: string) {
    setLoading(true)
    setError('')
    const res = await fetch(url, { method: 'POST' })
    const d = await res.json()
    setLoading(false)
    if (!res.ok) { setError(d.error || 'Помилка'); return }
    if (d.log) setLog(l => [...d.log, ...l])
    setCharacter(d.character ?? d)
  }

  if (character === undefined) return <p style={{ color: '#555' }}>Завантаження...</p>
  if (character === null) return <p style={{ color: '#888' }}>У тебе ще немає персонажа.</p>
  if (character.status !== 'approved') return <p style={{ color: '#888' }}>Вилазки доступні лише після затвердження персонажа ГМ.</p>
  if (character.dead) return <p style={{ color: '#c0392b' }}>☠️ {character.name} загинув(-ла). Вилазки недоступні.</p>

  const exp = character.expedition
  const secondsLeft = exp ? Math.max(0, Math.ceil((exp.arrivesAt - now) / 1000)) : 0
  const arrived = exp && exp.phase !== 'on_site' && secondsLeft === 0

  return (
    <div>
      <div style={{ position: 'relative', width: '100%', height: 160, borderRadius: 4, overflow: 'hidden', marginBottom: 16, border: '1px solid #2a241c' }}>
        <Image src="/expedition/expedition-art.png" alt="Вилазка" fill style={{ objectFit: 'cover' }} priority />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(8,7,6,0.9) 100%)' }} />
      </div>
      <h1 style={{ color: '#e5e5e5', fontSize: 24, marginBottom: 4 }}>Вилазка за припасами</h1>
      <p style={{ color: '#666', marginBottom: 16 }}>
        ОЗ: <span style={{ color: character.hp <= character.maxHp * 0.3 ? '#c0392b' : '#e5e5e5' }}>{character.hp}/{character.maxHp}</span>
        {' · '}Голод: {character.hunger} · Спрага: {character.thirst} · Мораль: {character.morale}
        {character.infection > 0 && <> · <span style={{ color: '#8e44ad' }}>Інфекція: {character.infection}</span></>}
      </p>

      {error && <p style={{ color: '#c0392b', marginBottom: 16 }}>🚫 {error}</p>}

      {!exp && (
        <div className="card mb-6">
          <h2 style={{ color: '#c9a227', fontSize: 16, marginBottom: 12 }}>Обери рівень складності</h2>
          <div className="flex flex-col gap-2">
            {EXPEDITION_LEVELS.map(lvl => (
              <button key={lvl.key} disabled={loading}
                onClick={async () => {
                  setLoading(true); setError('')
                  const res = await fetch('/api/expedition/start', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ levelKey: lvl.key }),
                  })
                  const d = await res.json()
                  setLoading(false)
                  if (!res.ok) { setError(d.error || 'Помилка'); return }
                  setCharacter(d)
                }}
                className="text-left" style={{ background: '#0a0a0a', border: '1px solid #1e2230', borderRadius: 6, padding: '10px 14px', cursor: 'pointer' }}>
                <div style={{ color: '#e5e5e5', fontSize: 14 }}>{lvl.label}</div>
                <div style={{ color: '#555', fontSize: 11 }}>СК {lvl.dc} · голод -{lvl.hungerCost} · спрага -{lvl.thirstCost} · ризик {Math.round(lvl.riskChance * 100)}%</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {exp && exp.phase !== 'on_site' && !arrived && (
        <div className="card mb-6 text-center">
          <p style={{ color: '#888', marginBottom: 8 }}>{exp.phase === 'traveling_out' ? '🚶 В дорозі до локації...' : '🏕️ Повертаєшся в табір...'}</p>
          <p style={{ color: '#c9a227', fontSize: 28, fontWeight: 700, fontFamily: 'monospace' }}>
            {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
          </p>
        </div>
      )}

      {exp && arrived && (
        <div className="card mb-6 text-center">
          <p style={{ color: '#27ae60', marginBottom: 12 }}>Час вийшов — підтверди прибуття.</p>
          <button onClick={() => call('/api/expedition/resolve')} disabled={loading} className="btn-primary">
            {exp.phase === 'traveling_out' ? 'Прибути на місце' : 'Повернутись у табір'}
          </button>
        </div>
      )}

      {exp && exp.phase === 'on_site' && (
        <div className="card mb-6 flex gap-3">
          <button onClick={() => call('/api/expedition/continue')} disabled={loading} className="btn-primary">🔍 Продовжити вилазку</button>
          <button onClick={() => call('/api/expedition/return')} disabled={loading} className="btn-gold">🏕️ Повернутися в табір</button>
        </div>
      )}

      {log.length > 0 && (
        <div className="card" style={{ borderColor: '#3a1010' }}>
          <p style={{ fontFamily: "'Special Elite', monospace", fontSize: 11, color: '#a68a4a', letterSpacing: '0.2em', marginBottom: 14 }}>ЩОДЕННИК ВИЖИВШОГО</p>
          <div className="flex flex-col gap-3">
            {log.map((line, i) => (
              <p key={i} style={{
                color: '#c9c4ba', fontSize: 14, lineHeight: 1.7, fontFamily: "'Special Elite', monospace",
                borderLeft: '2px solid #3a1010', paddingLeft: 12, opacity: i === 0 ? 1 : 0.6,
              }}>
                {line}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
