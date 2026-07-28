'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Character, STAT_LABELS, Stats } from '@/lib/types'
import { xpProgress, levelTitle } from '@/lib/levels'

type Weather = { seasonLabel: string; label: string; temperature: number }
type LogLine = { text: string; at: number }
type Mission = { title: string; text: string; at: number }

export default function Home() {
  const [nickname, setNickname] = useState<string | null | undefined>(undefined)
  const [character, setCharacter] = useState<Character | null | undefined>(undefined)
  const [weather, setWeather] = useState<Weather | null>(null)
  const [awayLog, setAwayLog] = useState<string[]>([])
  const [worldEvents, setWorldEvents] = useState<LogLine[]>([])
  const [charLog, setCharLog] = useState<LogLine[]>([])
  const [missions, setMissions] = useState<Mission[]>([])

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setNickname(d.nickname))
    fetch('/api/weather').then(r => r.json()).then(setWeather)
    fetch('/api/world/events').then(r => r.json()).then(setWorldEvents)
    fetch('/api/world/missions').then(r => r.json()).then(setMissions)
  }, [])

  useEffect(() => {
    if (!nickname) return
    fetch('/api/character/mine').then(r => r.json()).then(d => {
      setCharacter(d.character)
      if (d.dailyTickLog?.length) setAwayLog(d.dailyTickLog)
    })
    fetch('/api/character/log').then(r => r.json()).then(d => { if (Array.isArray(d)) setCharLog(d) })
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
          fontFamily: 'Butcherman, serif', fontWeight: 400, fontSize: 'clamp(36px, 13vw, 88px)',
          color: '#a68a4a', letterSpacing: '0.03em', marginBottom: 10, lineHeight: 1,
          textShadow: '4px 4px 0 rgba(0,0,0,0.7), 0 0 32px rgba(107,16,16,0.4), -1px -1px 0 rgba(200,160,90,0.15)',
        }}>
          ABADDON
        </h1>
        <p style={{ color: '#8a8378', fontFamily: "'Special Elite', monospace", fontSize: 15, letterSpacing: '0.03em', maxWidth: 520, margin: '0 auto 8px', lineHeight: 1.7 }}>
          Світ загинув. Записи обірвались. Ти — один із небагатьох, хто ще дихає серед руїн.
        </p>
        {weather && (
          <p style={{ color: '#6b6558', fontFamily: "'Special Elite', monospace", fontSize: 12, letterSpacing: '0.05em', marginBottom: 28 }}>
            {weather.seasonLabel} · {weather.label} · {weather.temperature}°C
          </p>
        )}

        {nickname === null && (
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/register" className="btn-primary">Почати виживати</Link>
            <Link href="/login" className="btn-gold">Увійти</Link>
          </div>
        )}
      </section>

      {nickname === undefined && <p style={{ color: '#555', marginTop: 24, fontFamily: "'Special Elite', monospace", fontSize: 13 }}>Сканую радіочастоти...</p>}

      {/* LOGGED IN PANEL */}
      {nickname && (
        <section className="mt-8">
          <div className="card flex justify-between items-center mb-6" style={{ borderColor: '#a68a4a30' }}>
            <p style={{ color: '#aaa', fontFamily: "'Special Elite', monospace", fontSize: 13 }}>
              У таборі відомий(-а) як <span style={{ color: '#c9a94f', fontWeight: 700 }}>{nickname}</span>
            </p>
            <button onClick={logout} style={{ color: '#555', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: "'Special Elite', monospace" }}>Покинути табір</button>
          </div>

          {character === undefined && <p style={{ color: '#555', fontFamily: "'Special Elite', monospace", fontSize: 13 }}>Гортаю особову справу...</p>}

          {awayLog.length > 0 && (
            <div className="card mb-6" style={{ borderColor: '#3a1010' }}>
              <p style={{ fontFamily: "'Special Elite', monospace", fontSize: 11, color: '#a68a4a', letterSpacing: '0.2em', marginBottom: 10 }}>ПОКИ ТЕБЕ НЕ БУЛО...</p>
              <div className="flex flex-col gap-2">
                {awayLog.map((line, i) => (
                  <p key={i} style={{ color: '#c9c4ba', fontSize: 13, lineHeight: 1.6, fontFamily: "'Special Elite', monospace" }}>{line}</p>
                ))}
              </div>
            </div>
          )}

          {character === null && (
            <div className="card text-center" style={{ padding: '40px 24px' }}>
              <p style={{ color: '#8a8378', marginBottom: 20, fontFamily: "'Special Elite', monospace" }}>Ворота табору відкриті. У тебе ще нема тут ні імені, ні місця біля вогню.</p>
              <Link href="/character/create" className="btn-primary">Вижити тут</Link>
            </div>
          )}

          {character && (
            <div className="card mb-6" style={{ borderColor: character.dead ? '#3a1010' : '#a68a4a30' }}>
              <div className="flex justify-between items-start flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-3">
                  {character.avatar ? (
                    <div style={{ position: 'relative', width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', border: '2px solid #a68a4a', flexShrink: 0 }}>
                      <Image src={character.avatar} alt={character.name} fill style={{ objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <Link href="/character/avatar" style={{
                      width: 52, height: 52, borderRadius: '50%', border: '2px dashed #2a241c', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, color: '#555',
                    }}>➕</Link>
                  )}
                  <h2 style={{ color: '#e5e5e5', fontSize: 24 }}>{character.name}</h2>
                </div>
                {character.status === 'pending' && <span className="tag">⏳ Очікує підтвердження ГМ</span>}
                {character.status === 'approved' && !character.dead && <span className="tag" style={{ borderColor: '#27ae60', color: '#5cb87a' }}>✅ Затверджено</span>}
                {character.status === 'rejected' && <span className="tag">❌ Відхилено {character.reviewNote ? `— ${character.reviewNote}` : ''}</span>}
                {character.status === 'approved' && character.dead && <span className="tag">☠️ Загинув(-ла)</span>}
              </div>

              {character.status === 'approved' && !character.dead && (
                <div className="flex flex-col gap-2 mb-5">
                  <div className="flex justify-between items-center mb-1">
                    <span style={{ color: '#c9a94f', fontSize: 13, fontFamily: "'Special Elite', monospace" }}>{levelTitle(xpProgress(character.xp).level)}</span>
                    <span style={{ color: '#75705f', fontSize: 11, fontFamily: "'Special Elite', monospace" }}>
                      🗡️ {character.meleeProf}/10 · 🔫 {character.firearmProf}/10 · 🏹 {character.huntingProf}/10
                    </span>
                  </div>
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
                  <Link href="/character/avatar" style={{ color: '#8a8378', fontSize: 13, alignSelf: 'center', textDecoration: 'underline' }}>Змінити обличчя</Link>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* NEWS / HISTORY / MISSIONS */}
      <section className="mt-12 flex flex-col gap-6">
        <div>
          <p style={{ fontFamily: "'Special Elite', monospace", fontSize: 11, color: '#a68a4a', letterSpacing: '0.2em', marginBottom: 10 }}>НОВИНИ ГРИ</p>
          <div className="card" style={{ borderColor: '#3a1010' }}>
            {worldEvents.length === 0 && <p style={{ color: '#555', fontSize: 13 }}>Новин поки немає.</p>}
            <div className="flex flex-col gap-2">
              {worldEvents.map((e, i) => (
                <p key={i} style={{ color: '#c9c4ba', fontSize: 13, lineHeight: 1.6, fontFamily: "'Special Elite', monospace", opacity: i === 0 ? 1 : 0.6 }}>{e.text}</p>
              ))}
            </div>
          </div>
        </div>

        {nickname && character && (
          <div>
            <p style={{ fontFamily: "'Special Elite', monospace", fontSize: 11, color: '#a68a4a', letterSpacing: '0.2em', marginBottom: 10 }}>ІСТОРІЯ ПЕРСОНАЖА</p>
            <div className="card">
              {charLog.length === 0 && <p style={{ color: '#555', fontSize: 13 }}>Ще нічого не сталось — поки що.</p>}
              <div className="flex flex-col gap-2">
                {charLog.map((e, i) => (
                  <p key={i} style={{ color: '#c9c4ba', fontSize: 13, lineHeight: 1.6, fontFamily: "'Special Elite', monospace", opacity: i === 0 ? 1 : 0.55 }}>{e.text}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        <div>
          <p style={{ fontFamily: "'Special Elite', monospace", fontSize: 11, color: '#a68a4a', letterSpacing: '0.2em', marginBottom: 10 }}>МІСІЇ РП ВІД ГМ</p>
          <div className="card">
            {missions.length === 0 && <p style={{ color: '#555', fontSize: 13 }}>ГМ поки не оголосив жодної місії.</p>}
            <div className="flex flex-col gap-4">
              {missions.map((m, i) => (
                <div key={i}>
                  <p style={{ color: '#c9a94f', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{m.title}</p>
                  <p style={{ color: '#c9c4ba', fontSize: 13, lineHeight: 1.6, fontFamily: "'Special Elite', monospace" }}>{m.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function VitalBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="flex items-center gap-3">
      <span style={{ color: '#8a8378', fontSize: 12, fontFamily: "'Special Elite', monospace", width: 60, flexShrink: 0 }}>{label}</span>
      <div style={{ position: 'relative', flex: 1, height: 22, background: '#0a0908', border: '1px solid #201b15', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: color, opacity: 0.35, transition: 'width 0.3s' }} />
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#e5e5e5', fontSize: 12, fontFamily: "'Special Elite', monospace", fontWeight: 700,
        }}>
          {value}/{max}
        </div>
      </div>
    </div>
  )
}
