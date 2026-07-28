'use client'
import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Character } from '@/lib/types'
import { EXPEDITION_LEVELS } from '@/lib/expedition'

export default function ExpeditionPage() {
  const router = useRouter()
  const [character, setCharacter] = useState<Character | null | undefined>(undefined)
  const [log, setLog] = useState<string[]>([])
  const [lastImage, setLastImage] = useState<string | null>(null)
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
    if (d.images && d.images.length > 0) setLastImage(d.images[d.images.length - 1])
    setCharacter(d.character ?? d)
  }

  if (character === undefined) return <p style={{ color: '#555' }}>Перевіряю спорядження...</p>
  if (character === null) return <p style={{ color: '#888' }}>У тебе ще немає персонажа, нікуди йти.</p>
  if (character.status !== 'approved') return <p style={{ color: '#888' }}>ГМ ще не пропустив тебе за ворота табору.</p>
  if (character.dead) return <p style={{ color: '#c0392b' }}>☠️ {character.name} більше нікуди не піде.</p>

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
        <div className="mb-6">
          <h2 style={{ color: '#c9a227', fontSize: 16, marginBottom: 12 }}>Куди цього разу?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
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
                className="expedition-card"
                style={{
                  position: 'relative', padding: 0, border: '1px solid #2a241c', borderRadius: 6,
                  overflow: 'hidden', cursor: loading ? 'default' : 'pointer', background: '#0a0a0a',
                  aspectRatio: '340 / 979', opacity: loading ? 0.6 : 1,
                }}>
                <Image src={`/expedition/${lvl.key === 'easy' ? 'level1' : lvl.key === 'medium' ? 'level2' : lvl.key === 'hard' ? 'level3' : 'level4'}.jpg`}
                  alt={lvl.label} fill style={{ objectFit: 'cover' }} />
                <div style={{
                  position: 'absolute', left: 0, right: 0, bottom: 0, padding: '8px 10px',
                  background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.85))',
                }}>
                  <div style={{ color: '#e5e5e5', fontSize: 12, fontWeight: 700 }}>{lvl.label}</div>
                  <div style={{ color: '#aaa', fontSize: 10 }}>СК {lvl.dc} · ризик {Math.round(lvl.riskChance * 100)}%</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {exp && exp.phase !== 'on_site' && !arrived && (
        <div className="card mb-6 text-center">
          <p style={{ color: '#888', marginBottom: 8 }}>{exp.phase === 'traveling_out' ? '🚶 Крокуєш крізь тишу, прислухаючись до кожного шурхоту...' : '🏕️ Вогні табору вже видно за деревами...'}</p>
          <p style={{ color: '#c9a227', fontSize: 28, fontWeight: 700, fontFamily: 'monospace' }}>
            {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
          </p>
        </div>
      )}

      {exp && arrived && (
        <div className="card mb-6 text-center">
          <p style={{ color: '#27ae60', marginBottom: 12 }}>{exp.phase === 'traveling_out' ? 'Місце вже видно попереду.' : 'Ще трохи — і ти вдома.'}</p>
          <button
            onClick={async () => {
              const returning = exp.phase === 'traveling_back'
              await call('/api/expedition/resolve')
              if (returning) router.push('/')
            }}
            disabled={loading} className="btn-primary">
            {exp.phase === 'traveling_out' ? '👣 Ступити всередину' : '🏕️ Переступити поріг табору'}
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
          {lastImage && (
            lastImage.startsWith('/npc/') ? (
              // NPC portraits are small (~214px) stock thumbnails — stretching them into a full-width
              // banner blows them up and crops off faces. Show them as a modest centered square instead.
              <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto 16px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #2a241c' }}>
                <Image src={lastImage} alt="Зустріч" fill style={{ objectFit: 'cover' }} sizes="160px" />
              </div>
            ) : (
              <div style={{ position: 'relative', width: '100%', height: 220, borderRadius: 4, overflow: 'hidden', marginBottom: 16, border: '1px solid #2a241c' }}>
                <Image src={lastImage} alt="Зустріч" fill style={{ objectFit: 'cover' }} />
              </div>
            )
          )}
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
