'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Character, STAT_LABELS, Stats } from '@/lib/types'

const FEATURES: { href: string; icon: string; title: string; desc: string }[] = [
  { href: '/character/expedition', icon: '🔍', title: 'Вилазка за припасами', desc: 'Виходь у зруйнований світ по лут, зброю та спорядження. Кожен крок — ризик.' },
  { href: '/character/inventory', icon: '🎒', title: 'Спорядження', desc: 'Одягай знайдену броню, тримай найкращу зброю напоготові.' },
  { href: '/character/actions', icon: '🛌', title: 'Табір', desc: 'Відпочивай, полюй, крафти спорядження, ховай зайве в особистий ящик.' },
  { href: '/gm', icon: '📜', title: 'Панель ГМ', desc: 'Затвердження нових вцілілих — вхід лише для головного гравця.' },
]

export default function Home() {
  const [nickname, setNickname] = useState<string | null | undefined>(undefined)
  const [character, setCharacter] = useState<Character | null | undefined>(undefined)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setNickname(d.nickname))
  }, [])

  useEffect(() => {
    if (!nickname) return
    fetch('/api/character/mine').then(r => r.json()).then(d => setCharacter(d.character))
  }, [nickname])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setNickname(null)
    setCharacter(null)
  }

  return (
    <div>
      {/* HERO */}
      <section className="text-center" style={{ padding: '20px 0 40px', borderBottom: '1px solid #201b15' }}>
        <div style={{ display: 'inline-block', background: 'rgba(107,16,16,0.1)', border: '1px solid #3a1010', borderRadius: 2, padding: '4px 16px', marginBottom: 18 }}>
          <span style={{ fontFamily: "'Special Elite', monospace", fontSize: 11, color: '#b04a3a', letterSpacing: '0.15em' }}>ЗАПИС #0817 — ОСТАННІЙ ПЕРЕДАВАЧ</span>
        </div>
        <h1 style={{
          fontFamily: 'Butcherman, serif', fontWeight: 400, fontSize: 'clamp(48px, 12vw, 88px)',
          color: '#a68a4a', letterSpacing: '0.03em', marginBottom: 10, lineHeight: 1,
          textShadow: '4px 4px 0 rgba(0,0,0,0.7), 0 0 32px rgba(107,16,16,0.4), -1px -1px 0 rgba(200,160,90,0.15)',
        }}>
          ABADDON
        </h1>
        <p style={{ color: '#8a8378', fontFamily: "'Special Elite', monospace", fontSize: 15, letterSpacing: '0.03em', maxWidth: 520, margin: '0 auto 28px', lineHeight: 1.7 }}>
          Світ загинув. Записи обірвались. Ти — один із небагатьох, хто ще дихає серед руїн.
        </p>

        {nickname === null && (
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/register" className="btn-primary">Почати виживати</Link>
            <Link href="/login" className="btn-gold">Увійти</Link>
          </div>
        )}
      </section>

      {nickname === undefined && <p style={{ color: '#555', marginTop: 24 }}>Завантаження...</p>}

      {/* LOGGED IN PANEL */}
      {nickname && (
        <section className="mt-8">
          <div className="card flex justify-between items-center mb-6" style={{ borderColor: '#a68a4a30' }}>
            <p style={{ color: '#aaa', fontFamily: "'Special Elite', monospace", fontSize: 13 }}>
              Ти в грі як <span style={{ color: '#c9a94f', fontWeight: 700 }}>{nickname}</span>
            </p>
            <button onClick={logout} style={{ color: '#555', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: "'Special Elite', monospace" }}>Вийти</button>
          </div>

          {character === undefined && <p style={{ color: '#555' }}>Завантаження персонажа...</p>}

          {character === null && (
            <div className="card text-center" style={{ padding: '40px 24px' }}>
              <p style={{ color: '#8a8378', marginBottom: 20, fontFamily: "'Special Elite', monospace" }}>У тебе ще немає персонажа. Табір чекає нового вцілілого.</p>
              <Link href="/character/create" className="btn-primary">Створити персонажа</Link>
            </div>
          )}

          {character && (
            <div className="card mb-6" style={{ borderColor: character.dead ? '#3a1010' : '#a68a4a30' }}>
              <div className="flex justify-between items-start flex-wrap gap-3 mb-4">
                <h2 style={{ color: '#e5e5e5', fontSize: 24 }}>{character.name}</h2>
                {character.status === 'pending' && <span className="tag">⏳ Очікує підтвердження ГМ</span>}
                {character.status === 'approved' && !character.dead && <span className="tag" style={{ borderColor: '#27ae60', color: '#5cb87a' }}>✅ Затверджено</span>}
                {character.status === 'rejected' && <span className="tag">❌ Відхилено {character.reviewNote ? `— ${character.reviewNote}` : ''}</span>}
                {character.status === 'approved' && character.dead && <span className="tag">☠️ Загинув(-ла)</span>}
              </div>

              {character.status === 'approved' && !character.dead && (
                <div className="flex flex-col gap-2 mb-5">
                  <VitalBar label="ОЗ" value={character.hp} max={character.maxHp} color="#b04a3a" />
                  <VitalBar label="Голод" value={character.hunger} max={100} color="#a68a4a" />
                  <VitalBar label="Спрага" value={character.thirst} max={100} color="#3a7ab0" />
                  <VitalBar label="Мораль" value={character.morale} max={100} color="#7a9c4a" />
                  {character.infection > 0 && <VitalBar label="Інфекція" value={character.infection} max={100} color="#8e44ad" />}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
                {(Object.entries(character.stats) as [keyof Stats, number][]).map(([k, v]) => (
                  <div key={k} style={{ background: '#0a0908', border: '1px solid #201b15', borderRadius: 3, padding: '8px 12px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#75705f', fontSize: 12, fontFamily: "'Special Elite', monospace" }}>{STAT_LABELS[k]}</span>
                    <span style={{ color: '#c9a94f', fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
              </div>

              {character.status === 'approved' && !character.dead && (
                <div className="flex gap-3 flex-wrap">
                  <Link href="/character/expedition" className="btn-primary">🔍 Вилазка</Link>
                  <Link href="/character/inventory" className="btn-gold">🎒 Спорядження</Link>
                  <Link href="/character/actions" className="btn-gold">🛌 Дії</Link>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* FEATURE GRID */}
      <section className="mt-12">
        <p style={{ fontFamily: "'Special Elite', monospace", fontSize: 11, color: '#a68a4a', letterSpacing: '0.2em', marginBottom: 4 }}>СВІТ ЗА ПАРКАНОМ ТАБОРУ</p>
        <h2 style={{ color: '#d8cfc0', fontSize: 28, marginBottom: 20 }}>Що чекає виживших</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map(f => (
            <Link key={f.href} href={f.href} className="card" style={{ display: 'block', textDecoration: 'none' }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>{f.icon}</div>
              <h3 style={{ color: '#d8cfc0', fontSize: 17, marginBottom: 6 }}>{f.title}</h3>
              <p style={{ color: '#8a8378', fontSize: 13, lineHeight: 1.6, fontFamily: "'Special Elite', monospace" }}>{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

function VitalBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span style={{ color: '#8a8378', fontSize: 11, fontFamily: "'Special Elite', monospace" }}>{label}</span>
        <span style={{ color: '#aaa', fontSize: 11, fontFamily: "'Special Elite', monospace" }}>{value}/{max}</span>
      </div>
      <div style={{ height: 6, background: '#0a0908', border: '1px solid #201b15', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
      </div>
    </div>
  )
}
