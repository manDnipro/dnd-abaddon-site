'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Character, STAT_LABELS, formatModifier, statModifier } from '@/lib/types'
import { characterTitle } from '@/lib/characterTitle'
import { RPMission, missionRewardSummary } from '@/lib/rpMissions'

type Weather = { seasonLabel: string; label: string; temperature: number }
type LogLine = { text: string; at: number }

function formatLogTime(at: number): string {
  return new Date(at).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function Home() {
  const [nickname, setNickname] = useState<string | null | undefined>(undefined)
  const [character, setCharacter] = useState<Character | null | undefined>(undefined)
  const [weather, setWeather] = useState<Weather | null>(null)
  const [awayLog, setAwayLog] = useState<string[]>([])
  const [worldEvents, setWorldEvents] = useState<LogLine[]>([])
  const [charLog, setCharLog] = useState<LogLine[]>([])
  const [missions, setMissions] = useState<RPMission[]>([])
  const [missionLoading, setMissionLoading] = useState<string | null>(null)
  const [missionResult, setMissionResult] = useState<{ title: string; log: string[] } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setNickname(d.nickname))
    fetch('/api/weather').then(r => r.json()).then(setWeather)
    fetch('/api/world/events').then(r => r.json()).then(setWorldEvents)
  }, [])

  function loadMissions() {
    fetch('/api/character/missions').then(r => r.json()).then(d => { if (Array.isArray(d)) setMissions(d) })
  }

  useEffect(() => {
    if (!nickname) return
    fetch('/api/character/mine').then(r => r.json()).then(d => {
      setCharacter(d.character)
      if (d.dailyTickLog?.length) setAwayLog(d.dailyTickLog)
    })
    fetch('/api/character/log').then(r => r.json()).then(d => { if (Array.isArray(d)) setCharLog(d) })
    loadMissions()
    // GM-assigned missions land in Redis instantly but this page only fetched them once on
    // mount — a player already sitting on the homepage never saw a mission created after their
    // page load without a manual reload. Poll like PlayerPDA does.
    const t = setInterval(loadMissions, 30_000)
    return () => clearInterval(t)
  }, [nickname])

  async function attemptMission(missionId: string, title: string) {
    setMissionLoading(missionId)
    const res = await fetch('/api/character/missions/attempt', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ missionId }),
    })
    const d = await res.json()
    setMissionLoading(null)
    if (!res.ok) return
    setCharacter(d.character)
    setMissionResult({ title, log: d.log })
    loadMissions()
    fetch('/api/character/log').then(r => r.json()).then(d => { if (Array.isArray(d)) setCharLog(d) })
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    // Navbar fetches its own auth state independently (keyed on pathname, not shared context) —
    // a plain state reset here leaves it showing the profile menu/nav links as if still logged in
    // when already on "/". A hard reload guarantees every component re-reads the cleared session.
    window.location.href = '/'
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
              <div className="flex items-start gap-4 flex-wrap">
                {character.avatar ? (
                  <div style={{ position: 'relative', width: 88, height: 88, borderRadius: 8, overflow: 'hidden', border: '2px solid #a68a4a', flexShrink: 0 }}>
                    <Image src={character.avatar} alt={character.name} fill style={{ objectFit: 'cover' }} />
                  </div>
                ) : (
                  <Link href="/character/avatar" style={{
                    width: 88, height: 88, borderRadius: 8, border: '2px dashed #2a241c', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0, color: '#555',
                  }}>➕</Link>
                )}

                <div style={{ flex: 1, minWidth: 200 }}>
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h2 style={{ color: '#e5e5e5', fontSize: 22 }}>{character.name}</h2>
                    <span style={{ color: '#75705f', fontSize: 13, fontFamily: "'Special Elite', monospace" }}>— {characterTitle(character.stats)}</span>
                  </div>
                  <div className="mb-2">
                    {character.status === 'pending' && <span className="tag">⏳ Очікує підтвердження ГМ</span>}
                    {character.status === 'approved' && !character.dead && <span className="tag" style={{ borderColor: '#27ae60', color: '#5cb87a' }}>✅ Затверджено</span>}
                    {character.status === 'rejected' && <span className="tag">❌ Відхилено {character.reviewNote ? `— ${character.reviewNote}` : ''}</span>}
                    {character.status === 'approved' && character.dead && <span className="tag">☠️ Загинув(-ла)</span>}
                  </div>
                  <p style={{ color: '#a99c8a', fontSize: 13, lineHeight: 1.7, fontFamily: "'Special Elite', monospace", fontStyle: character.bio ? 'normal' : 'italic' }}>
                    {character.bio || 'Хто цей вцілілий і що привело його сюди — поки що ніхто не знає.'}
                  </p>
                </div>
              </div>

              {character.status === 'approved' && !character.dead && (
                <div className="flex gap-3 flex-wrap mt-4">
                  <Link href="/character/expedition" className="btn-primary">🔍 Вилазка</Link>
                  <Link href="/character/sheet" className="btn-gold">📋 Картка</Link>
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

        {nickname && character && character.lastExpeditionLog.length > 0 && (
          <div>
            <p style={{ fontFamily: "'Special Elite', monospace", fontSize: 11, color: '#a68a4a', letterSpacing: '0.2em', marginBottom: 10 }}>
              🎒 ЩО ПРИНІС(-ЛА) З ОСТАННЬОЇ ВИЛАЗКИ
            </p>
            <div className="card" style={{ borderColor: '#3a1010' }}>
              <div className="flex flex-col gap-2">
                {character.lastExpeditionLog.map((e, i) => (
                  <p key={i} style={{ color: '#c9c4ba', fontSize: 13, lineHeight: 1.6, fontFamily: "'Special Elite', monospace" }}>
                    <span style={{ color: '#6b6156', fontSize: 11, marginRight: 6 }}>[{formatLogTime(e.at)}]</span>{e.text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {nickname && character && (
          <div>
            <p style={{ fontFamily: "'Special Elite', monospace", fontSize: 11, color: '#a68a4a', letterSpacing: '0.2em', marginBottom: 10 }}>ІСТОРІЯ ПЕРСОНАЖА</p>
            <div className="card">
              {charLog.length === 0 && <p style={{ color: '#555', fontSize: 13 }}>Ще нічого не сталось — поки що.</p>}
              <div className="flex flex-col gap-2">
                {charLog.map((e, i) => (
                  <p key={i} style={{ color: '#c9c4ba', fontSize: 13, lineHeight: 1.6, fontFamily: "'Special Elite', monospace", opacity: i === 0 ? 1 : 0.55 }}>
                    <span style={{ color: '#6b6156', fontSize: 11, marginRight: 6 }}>[{formatLogTime(e.at)}]</span>{e.text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {nickname && character && character.status === 'approved' && !character.dead && (
          <div>
            <p style={{ fontFamily: "'Special Elite', monospace", fontSize: 11, color: '#a68a4a', letterSpacing: '0.2em', marginBottom: 10 }}>МІСІЇ РП ВІД ГМ</p>
            {missionResult && (
              <div className="card mb-3" style={{ borderColor: '#a68a4a' }}>
                <div className="flex justify-between items-start mb-2">
                  <p style={{ color: '#c9a94f', fontSize: 13, fontWeight: 700 }}>📜 Результат: «{missionResult.title}»</p>
                  <button onClick={() => setMissionResult(null)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 14 }}>✕</button>
                </div>
                <div className="flex flex-col gap-1">
                  {missionResult.log.map((line, i) => (
                    <p key={i} style={{ color: '#c9c4ba', fontSize: 13, lineHeight: 1.7, fontFamily: "'Special Elite', monospace" }}>{line}</p>
                  ))}
                </div>
              </div>
            )}
            <div className="card">
              {missions.length === 0 && <p style={{ color: '#555', fontSize: 13 }}>Наразі для тебе немає місій.</p>}
              <div className="flex flex-col gap-4">
                {missions.map(m => {
                  const rewardLabel = missionRewardSummary(m.reward)
                  const checkLabel = m.checkStat
                    ? `🎲 ${STAT_LABELS[m.checkStat]} ${formatModifier(statModifier(character.stats[m.checkStat]))} проти СК ${m.checkDC}`
                    : null
                  return (
                    <div key={m.id} style={{ borderTop: '1px solid #1e2230', paddingTop: 12 }}>
                      <p style={{ color: '#c9a94f', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{m.title}</p>
                      <p style={{ color: '#c9c4ba', fontSize: 13, lineHeight: 1.6, fontFamily: "'Special Elite', monospace", marginBottom: 6 }}>{m.text}</p>
                      <p style={{ color: '#666', fontSize: 11, marginBottom: 8 }}>
                        {checkLabel ?? 'без кидка'}{rewardLabel && <> · нагорода: {rewardLabel}</>}
                      </p>
                      <button onClick={() => attemptMission(m.id, m.title)} disabled={missionLoading === m.id} className="btn-gold">
                        {missionLoading === m.id ? 'Виконую...' : '📜 Виконати'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
