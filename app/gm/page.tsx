'use client'
import { useEffect, useState } from 'react'
import { Character, STAT_LABELS, Stats, StatKey, STAT_BUDGET, STAT_MIN, STAT_MAX } from '@/lib/types'
import { getItem, ITEM_CATALOG } from '@/lib/items'
import { RPMission, MissionRewardType, MissionRewardItem, missionRewardSummary } from '@/lib/rpMissions'

const ALL_ITEMS = Object.values(ITEM_CATALOG).sort((a, b) => a.name.localeCompare(b.name, 'uk'))

type Tab = 'queue' | 'players' | 'npcs' | 'world' | 'inbox' | 'logs'
type Weather = { seasonLabel?: string; label: string; temperature: number; season: string }
type NpcInfo = { id: string; name: string; tradeLevel: number; stock: { itemKey: string; quantity: number }[] }
type GMLetter = { type: 'message' | 'report'; from: string; targetName?: string; text: string; at: number }

const STAT_KEYS = Object.keys(STAT_LABELS) as StatKey[]

export default function GMPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState<Character[]>([])
  const [players, setPlayers] = useState<Character[]>([])
  const [weather, setWeather] = useState<Weather | null>(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<Tab>('queue')
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [eventText, setEventText] = useState('')
  const [missionTitle, setMissionTitle] = useState('')
  const [missionText, setMissionText] = useState('')
  const [missionTarget, setMissionTarget] = useState('') // '' = all players
  const [missionUseCheck, setMissionUseCheck] = useState(false)
  const [missionCheckStat, setMissionCheckStat] = useState<StatKey>('per')
  const [missionCheckDC, setMissionCheckDC] = useState(12)
  const [missionRewardType, setMissionRewardType] = useState<MissionRewardType>('none')
  const [missionRewardItems, setMissionRewardItems] = useState<MissionRewardItem[]>([])
  const [pickItemKey, setPickItemKey] = useState(ALL_ITEMS[0]?.key ?? '')
  const [pickItemQty, setPickItemQty] = useState(1)
  const [missionRewardHp, setMissionRewardHp] = useState(10)
  const [missionRewardStat, setMissionRewardStat] = useState<StatKey>('str')
  const [missionRewardStatAmount, setMissionRewardStatAmount] = useState(1)
  const [missions, setMissions] = useState<RPMission[]>([])
  const [itemKey, setItemKey] = useState('')
  const [itemQty, setItemQty] = useState(1)
  const [statKey, setStatKey] = useState<StatKey>('str')
  const [statValue, setStatValue] = useState(3)
  const [hpValue, setHpValue] = useState(0)
  const [expeditionsValue, setExpeditionsValue] = useState(0)
  const [killsValue, setKillsValue] = useState(0)
  const [savedValue, setSavedValue] = useState(0)
  const [bioText, setBioText] = useState('')
  const [npcs, setNpcs] = useState<NpcInfo[]>([])
  const [newName, setNewName] = useState('')
  const [newOwner, setNewOwner] = useState('')
  const [newStats, setNewStats] = useState<Stats>({ str: 3, agi: 3, end: 3, per: 3, int: 3, cha: 3 })
  const [inbox, setInbox] = useState<GMLetter[]>([])
  const [logs, setLogs] = useState<{ at: number; text: string }[]>([])
  const [worldEvents, setWorldEvents] = useState<{ id: string; at: number; text: string }[]>([])
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({})
  const [playerMessageDraft, setPlayerMessageDraft] = useState('')
  const [broadcastText, setBroadcastText] = useState('')

  async function loadAll() {
    const [pendingRes, playersRes, weatherRes, npcsRes, inboxRes, missionsRes] = await Promise.all([
      fetch('/api/gm/characters'),
      fetch('/api/gm/players'),
      fetch('/api/weather'),
      fetch('/api/gm/npcs'),
      fetch('/api/gm/inbox'),
      fetch('/api/gm/mission/list'),
    ])
    if (inboxRes.ok) setInbox(await inboxRes.json())
    if (pendingRes.ok) {
      setPending(await pendingRes.json())
      setAuthed(true)
    }
    if (playersRes.ok) setPlayers(await playersRes.json())
    if (weatherRes.ok) setWeather(await weatherRes.json())
    if (npcsRes.ok) setNpcs(await npcsRes.json())
    if (missionsRes.ok) setMissions(await missionsRes.json())
  }

  useEffect(() => { loadAll() }, [])

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const res = await fetch('/api/gm/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) loadAll()
    else setError((await res.json()).error || 'Помилка')
  }

  async function fetchLogs() {
    const res = await fetch('/api/gm/logs')
    if (res.ok) setLogs(await res.json())
  }

  async function fetchWorldEvents() {
    const res = await fetch('/api/world/events')
    if (res.ok) setWorldEvents(await res.json())
  }

  async function review(id: string, action: 'approve' | 'reject') {
    setLoading(true)
    const note = action === 'reject' ? prompt('Причина відхилення (необовʼязково):') || undefined : undefined
    await fetch('/api/gm/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, note }),
    })
    await loadAll()
    setLoading(false)
  }

  async function call(url: string, body: object): Promise<boolean> {
    setLoading(true)
    setError('')
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const d = await res.json()
    setLoading(false)
    if (!res.ok) { setError(d.error || 'Помилка'); return false }
    await loadAll()
    return true
  }

  if (!authed) {
    return (
      <div>
        <h1 style={{ color: '#e5e5e5', fontSize: 24, marginBottom: 4 }}>Хроніки табору</h1>
        <p style={{ color: '#666', marginBottom: 20, fontSize: 13, fontFamily: "'Special Elite', monospace" }}>Тільки головний гравець вирішує, кого пропустити за ворота.</p>
        <form onSubmit={login} className="card flex flex-col gap-4">
          <div>
            <label className="block text-sm mb-1" style={{ color: '#aaa' }}>Пароль ГМ</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p style={{ color: '#c0392b', fontSize: 14 }}>🚫 {error}</p>}
          <button type="submit" className="btn-primary">Увійти</button>
        </form>
      </div>
    )
  }

  const player = players.find(p => p.id === selectedPlayer) ?? null

  const newStatsSum = Object.values(newStats).reduce((a, b) => a + b, 0)
  const newStatsRemaining = STAT_BUDGET - newStatsSum

  async function createCharacter() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/gm/create-character', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, owner: newOwner, stats: newStats }),
    })
    const d = await res.json()
    setLoading(false)
    if (!res.ok) { setError(d.error || 'Помилка'); return }
    setNewName(''); setNewOwner('')
    await loadAll()
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'queue', label: `Черга (${pending.length})` },
    { key: 'players', label: 'Гравці' },
    { key: 'npcs', label: 'NPC' },
    { key: 'world', label: 'Світ' },
    { key: 'inbox', label: `Пошта (${inbox.length})` },
    { key: 'logs', label: 'Логи' },
  ]

  return (
    <div>
      <h1 style={{ color: '#e5e5e5', fontSize: 24, marginBottom: 16 }}>Панель головного гравця</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); if (t.key === 'logs') fetchLogs(); if (t.key === 'world') fetchWorldEvents() }}
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

      {tab === 'queue' && (
        <div>
          {pending.length === 0 && <p style={{ color: '#555' }}>Нікого біля воріт — тиша.</p>}
          <div className="flex flex-col gap-3">
            {pending.map(c => (
              <div key={c.id} className="card">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 style={{ color: '#e5e5e5', fontSize: 18 }}>{c.name}</h2>
                    <p style={{ color: '#666', fontSize: 13 }}>Гравець: {c.owner}</p>
                  </div>
                  <span className="tag">⏳ Очікує</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                  {(Object.entries(c.stats) as [keyof Stats, number][]).map(([k, v]) => (
                    <div key={k} style={{ background: '#0a0a0a', border: '1px solid #1e2230', borderRadius: 6, padding: '4px 8px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#666', fontSize: 12 }}>{STAT_LABELS[k]}</span>
                      <span style={{ color: '#c9a227', fontWeight: 700, fontSize: 12 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => review(c.id, 'approve')} disabled={loading} className="btn-primary" style={{ background: 'linear-gradient(135deg, #1a6b3a, #27ae60)' }}>
                    ✅ Затвердити
                  </button>
                  <button onClick={() => review(c.id, 'reject')} disabled={loading} className="btn-primary">
                    ❌ Відхилити
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'players' && (
        <div className="flex flex-col gap-4">
          <div className="card">
            <h2 style={{ color: '#c9a227', fontSize: 15, marginBottom: 10 }}>Створити картку гравцю</h2>
            <div className="flex flex-col gap-2 mb-3">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ім'я персонажа" />
              <input value={newOwner} onChange={e => setNewOwner(e.target.value)} placeholder="Нік акаунта гравця (якщо вже зареєстрований — прив'яжеться)" />
            </div>
            <div className="flex justify-between items-center mb-2">
              <span style={{ color: '#888', fontSize: 12 }}>Характеристики (від {STAT_MIN} до {STAT_MAX})</span>
              <span style={{ color: newStatsRemaining === 0 ? '#27ae60' : '#c0392b', fontWeight: 700, fontSize: 12 }}>Не розподілено: {newStatsRemaining}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {STAT_KEYS.map(k => (
                <div key={k} className="flex items-center justify-between" style={{ background: '#0a0a0a', border: '1px solid #1e2230', borderRadius: 6, padding: '4px 8px' }}>
                  <span style={{ color: '#888', fontSize: 12 }}>{STAT_LABELS[k]}</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setNewStats(s => ({ ...s, [k]: Math.max(STAT_MIN, s[k] - 1) }))}
                      style={{ width: 20, height: 20, borderRadius: 3, border: '1px solid #2a2a2a', background: 'none', color: '#c9a227', cursor: 'pointer', fontSize: 12 }}>−</button>
                    <span style={{ color: '#c9a227', fontWeight: 700, fontSize: 12, minWidth: 14, textAlign: 'center' }}>{newStats[k]}</span>
                    <button type="button" onClick={() => setNewStats(s => ({ ...s, [k]: Math.min(STAT_MAX, s[k] + 1) }))}
                      style={{ width: 20, height: 20, borderRadius: 3, border: '1px solid #2a2a2a', background: 'none', color: '#c9a227', cursor: 'pointer', fontSize: 12 }}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={createCharacter} disabled={loading || !newName.trim() || newStatsRemaining !== 0} className="btn-primary">
              Створити й одразу затвердити
            </button>
          </div>

          <div className="card">
            <h2 style={{ color: '#c9a227', fontSize: 15, marginBottom: 10 }}>Огляд групи ({players.length})</h2>
            <div className="flex flex-col gap-2">
              {players.map(p => (
                <button key={p.id} onClick={() => {
                  setSelectedPlayer(p.id); setHpValue(p.hp); setStatValue(p.stats.str); setBioText(p.bio || '')
                  setExpeditionsValue(p.expeditionsCompleted); setKillsValue(p.zombiesKilled); setSavedValue(p.playersSaved)
                }}
                  className="flex items-center justify-between" style={{
                    background: selectedPlayer === p.id ? 'rgba(166,138,74,0.1)' : '#0a0a0a',
                    border: `1px solid ${selectedPlayer === p.id ? '#a68a4a' : '#1e2230'}`, borderRadius: 6, padding: '8px 12px', cursor: 'pointer', textAlign: 'left',
                  }}>
                  <span style={{ color: p.dead ? '#c0392b' : '#e5e5e5', fontSize: 14 }}>{p.dead ? '☠️ ' : ''}{p.name}</span>
                  <span style={{ color: '#666', fontSize: 12 }}>ОЗ {p.hp}/{p.maxHp} · {p.owner} · #{p.id}</span>
                </button>
              ))}
              {players.length === 0 && <p style={{ color: '#555', fontSize: 13 }}>Табір порожній.</p>}
            </div>
          </div>

          {player && (
            <div className="card">
              <h2 style={{ color: '#c9a227', fontSize: 15, marginBottom: 12 }}>{player.name}</h2>

              <div className="flex gap-2 flex-wrap mb-4">
                <button onClick={() => call('/api/gm/players/revive', { charId: player.id })} disabled={loading} className="btn-primary">
                  {player.dead ? '✨ Воскресити' : '❤️ Відновити повністю'}
                </button>
                {(player.expedition || player.combat) && (
                  <button onClick={() => call('/api/gm/players/reset-state', { charId: player.id })} disabled={loading}
                    style={{ fontSize: 13, color: '#e0a03a', background: 'none', border: '1px solid #3a2f10', borderRadius: 4, padding: '8px 14px', cursor: 'pointer' }}>
                    🔓 Скинути вилазку/бій (застряг)
                  </button>
                )}
              </div>

              <div className="mb-4">
                <span style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 4 }}>Написати гравцю напряму (прийде в КПК)</span>
                <div className="flex gap-2">
                  <input value={playerMessageDraft} onChange={e => setPlayerMessageDraft(e.target.value)} placeholder="Текст повідомлення..." style={{ flex: 1 }} />
                  <button
                    onClick={async () => { if (await call('/api/gm/players/message', { charId: player.id, text: playerMessageDraft })) setPlayerMessageDraft('') }}
                    disabled={loading || !playerMessageDraft.trim()} className="btn-gold">
                    Надіслати
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span style={{ color: '#888', fontSize: 12, width: 90 }}>ОЗ (0–{player.maxHp})</span>
                <input type="number" min={0} max={player.maxHp} value={hpValue} onChange={e => setHpValue(parseInt(e.target.value) || 0)} style={{ width: 80 }} />
                <button onClick={() => call('/api/gm/players/hp', { charId: player.id, hp: hpValue })} disabled={loading}
                  style={{ fontSize: 12, color: '#c9a227', background: 'none', border: '1px solid #2a2410', borderRadius: 4, padding: '5px 12px', cursor: 'pointer' }}>
                  Встановити
                </button>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <select value={statKey} onChange={e => setStatKey(e.target.value as StatKey)} style={{ width: 140 }}>
                  {(Object.keys(STAT_LABELS) as StatKey[]).map(k => <option key={k} value={k}>{STAT_LABELS[k]}</option>)}
                </select>
                <input type="number" min={1} value={statValue} onChange={e => setStatValue(parseInt(e.target.value) || 1)} style={{ width: 70 }} />
                <button onClick={() => call('/api/gm/players/stat', { charId: player.id, stat: statKey, value: statValue })} disabled={loading}
                  style={{ fontSize: 12, color: '#c9a227', background: 'none', border: '1px solid #2a2410', borderRadius: 4, padding: '5px 12px', cursor: 'pointer' }}>
                  Встановити
                </button>
              </div>

              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span style={{ color: '#888', fontSize: 12, width: 90 }}>🎯 Вилазок</span>
                <input type="number" min={0} value={expeditionsValue} onChange={e => setExpeditionsValue(parseInt(e.target.value) || 0)} style={{ width: 70 }} />
                <button onClick={() => call('/api/gm/players/counters', { charId: player.id, counter: 'expeditionsCompleted', value: expeditionsValue })} disabled={loading}
                  style={{ fontSize: 12, color: '#c9a227', background: 'none', border: '1px solid #2a2410', borderRadius: 4, padding: '5px 12px', cursor: 'pointer' }}>
                  Встановити
                </button>
                <span style={{ color: '#888', fontSize: 12, width: 90, marginLeft: 8 }}>💀 Вбито</span>
                <input type="number" min={0} value={killsValue} onChange={e => setKillsValue(parseInt(e.target.value) || 0)} style={{ width: 70 }} />
                <button onClick={() => call('/api/gm/players/counters', { charId: player.id, counter: 'zombiesKilled', value: killsValue })} disabled={loading}
                  style={{ fontSize: 12, color: '#c9a227', background: 'none', border: '1px solid #2a2410', borderRadius: 4, padding: '5px 12px', cursor: 'pointer' }}>
                  Встановити
                </button>
                <span style={{ color: '#888', fontSize: 12, width: 90, marginLeft: 8 }}>🩹 Врятовано</span>
                <input type="number" min={0} value={savedValue} onChange={e => setSavedValue(parseInt(e.target.value) || 0)} style={{ width: 70 }} />
                <button onClick={() => call('/api/gm/players/counters', { charId: player.id, counter: 'playersSaved', value: savedValue })} disabled={loading}
                  style={{ fontSize: 12, color: '#c9a227', background: 'none', border: '1px solid #2a2410', borderRadius: 4, padding: '5px 12px', cursor: 'pointer' }}>
                  Встановити
                </button>
              </div>

              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <input value={itemKey} onChange={e => setItemKey(e.target.value)} placeholder="ключ предмета (напр. bandage)" style={{ width: 200 }} />
                <input type="number" min={1} value={itemQty} onChange={e => setItemQty(parseInt(e.target.value) || 1)} style={{ width: 70 }} />
                <button onClick={() => call('/api/gm/players/item', { charId: player.id, itemKey, qty: itemQty, action: 'give' })} disabled={loading || !itemKey}
                  style={{ fontSize: 12, color: '#27ae60', background: 'none', border: '1px solid #1a2a1a', borderRadius: 4, padding: '5px 12px', cursor: 'pointer' }}>
                  Видати
                </button>
                <button onClick={() => call('/api/gm/players/item', { charId: player.id, itemKey, qty: itemQty, action: 'take' })} disabled={loading || !itemKey}
                  style={{ fontSize: 12, color: '#c0392b', background: 'none', border: '1px solid #2a1a1a', borderRadius: 4, padding: '5px 12px', cursor: 'pointer' }}>
                  Забрати
                </button>
                {itemKey && getItem(itemKey) && <span style={{ color: '#666', fontSize: 12 }}>→ {getItem(itemKey)?.name}</span>}
              </div>

              <div className="mb-3">
                <span style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 4 }}>Особливості (видно у картці персонажа)</span>
                <textarea value={bioText} onChange={e => setBioText(e.target.value)} rows={3} placeholder="Напр.: Брат одного з вартових табору..." className="mb-2" />
                <button onClick={() => call('/api/gm/players/bio', { charId: player.id, bio: bioText })} disabled={loading}
                  style={{ fontSize: 12, color: '#c9a227', background: 'none', border: '1px solid #2a2410', borderRadius: 4, padding: '5px 12px', cursor: 'pointer' }}>
                  Зберегти особливості
                </button>
              </div>

              <details className="mt-4">
                <summary style={{ color: '#a68a4a', fontSize: 13, cursor: 'pointer' }}>Повна картка персонажа</summary>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 mb-3">
                  {(Object.entries(player.stats) as [keyof Stats, number][]).map(([k, v]) => (
                    <div key={k} style={{ background: '#0a0a0a', border: '1px solid #1e2230', borderRadius: 6, padding: '4px 8px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#666', fontSize: 12 }}>{STAT_LABELS[k]}</span>
                      <span style={{ color: '#c9a227', fontWeight: 700, fontSize: 12 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <p style={{ color: '#888', fontSize: 12, lineHeight: 1.8 }}>
                  Голод: {player.hunger} · Спрага: {player.thirst} · Мораль: {player.morale} · Інфекція: {player.infection} · Репутація: {player.reputation}<br />
                  XP: {player.xp} · 🗡️ {player.meleeProf}/10 · 🔫 {player.firearmProf}/10 · 🏹 {player.huntingProf}/10<br />
                  Інвентар: {player.inventory.map(s => `${getItem(s.itemId)?.name ?? s.itemId} ×${s.qty}`).join(', ') || '—'}<br />
                  Ящик: {player.storageBox.map(s => `${getItem(s.itemId)?.name ?? s.itemId} ×${s.qty}`).join(', ') || '—'}
                </p>
              </details>
            </div>
          )}
        </div>
      )}

      {tab === 'npcs' && (
        <div className="flex flex-col gap-3">
          {npcs.map(n => (
            <div key={n.id} className="card">
              <div className="flex justify-between items-center mb-3">
                <h2 style={{ color: '#e5e5e5', fontSize: 15 }}>{n.name}</h2>
                <span className="tag">рівень торгу {n.tradeLevel}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {n.stock.map(s => (
                  <span key={s.itemKey} style={{ fontSize: 12, color: '#ccc', background: '#0a0a0a', border: '1px solid #1e2230', borderRadius: 4, padding: '4px 8px' }}>
                    {getItem(s.itemKey)?.name ?? s.itemKey} ×{s.quantity}
                  </span>
                ))}
                {n.stock.length === 0 && <span style={{ color: '#555', fontSize: 12 }}>Товару нема.</span>}
              </div>
            </div>
          ))}
          <p style={{ color: '#555', fontSize: 12 }}>
            Живий спавн ворогів і бій наживо тут не діють так, як у Discord — сутички вирішуються миттєво на сервері,
            без окремої керованої ГМ сцени. Ці NPC — лише постійні торговці табору.
          </p>
        </div>
      )}

      {tab === 'world' && (
        <div className="flex flex-col gap-4">
          <div className="card">
            <h2 style={{ color: '#c9a227', fontSize: 15, marginBottom: 12 }}>Час і погода</h2>
            {weather && <p style={{ color: '#ccc', fontSize: 14, marginBottom: 12 }}>{weather.seasonLabel ?? weather.season} · {weather.label} · {weather.temperature}°C</p>}
            <button onClick={() => call('/api/gm/advance-day', {})} disabled={loading} className="btn-gold">⏭️ Наступний день</button>
          </div>

          <div className="card">
            <h2 style={{ color: '#c9a227', fontSize: 15, marginBottom: 12 }}>Оголосити подію табору</h2>
            <div className="flex gap-2">
              <input value={eventText} onChange={e => setEventText(e.target.value)} placeholder="Наприклад: здалеку чути виття..." style={{ flex: 1 }} />
              <button onClick={async () => { if (await call('/api/gm/event', { text: eventText })) { setEventText(''); fetchWorldEvents() } }} disabled={loading || !eventText.trim()} className="btn-primary">
                Оголосити
              </button>
            </div>
            <p style={{ color: '#555', fontSize: 12, marginTop: 8 }}>
              Побачать усі на головній сторінці, розділ "Новини гри". Кожна новина сама зникає через 48 годин.
            </p>

            {worldEvents.length > 0 && (
              <div className="flex flex-col gap-2 mt-4" style={{ borderTop: '1px solid #2a241c', paddingTop: 12 }}>
                {worldEvents.map(e => (
                  <div key={e.id} className="flex justify-between items-start gap-3" style={{ fontSize: 13 }}>
                    <div>
                      <p style={{ color: '#ccc' }}>{e.text}</p>
                      <p style={{ color: '#555', fontSize: 11 }}>{new Date(e.at).toLocaleString('uk-UA')}</p>
                    </div>
                    <button
                      onClick={async () => { if (await call('/api/gm/event/delete', { id: e.id })) fetchWorldEvents() }}
                      disabled={loading}
                      style={{ fontSize: 12, color: '#c0392b', background: 'none', border: '1px solid #2a1a1a', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', flexShrink: 0 }}>
                      Видалити
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 style={{ color: '#c9a227', fontSize: 15, marginBottom: 12 }}>Розсилка всім у КПК</h2>
            <div className="flex gap-2">
              <input value={broadcastText} onChange={e => setBroadcastText(e.target.value)} placeholder="Важливе повідомлення для всіх живих гравців..." style={{ flex: 1 }} />
              <button
                onClick={async () => { if (await call('/api/gm/broadcast', { text: broadcastText })) setBroadcastText('') }}
                disabled={loading || !broadcastText.trim()} className="btn-primary">
                📢 Розіслати
              </button>
            </div>
            <p style={{ color: '#555', fontSize: 12, marginTop: 8 }}>
              На відміну від "Новини гри" — приходить прямо в особисту пошту (КПК) кожного живого гравця, з підсвіченою міткою.
            </p>
          </div>

          <div className="card">
            <h2 style={{ color: '#c9a227', fontSize: 15, marginBottom: 12 }}>Створити РП-місію</h2>
            <div className="flex flex-col gap-2">
              <input value={missionTitle} onChange={e => setMissionTitle(e.target.value)} placeholder="Назва місії" />
              <textarea value={missionText} onChange={e => setMissionText(e.target.value)} rows={3} placeholder="Опис місії для гравців" />

              <label style={{ color: '#888', fontSize: 12, marginTop: 6 }}>Для кого</label>
              <select value={missionTarget} onChange={e => setMissionTarget(e.target.value)}>
                <option value="">Для всіх гравців</option>
                {players.filter(p => !p.dead).map(p => <option key={p.id} value={p.id}>{p.name} — акаунт {p.owner} (#{p.id})</option>)}
              </select>

              <label className="flex items-center gap-2" style={{ color: '#888', fontSize: 12, marginTop: 6 }}>
                <input type="checkbox" checked={missionUseCheck} onChange={e => setMissionUseCheck(e.target.checked)} />
                Потребує кидка кубика (перевірка характеристики)
              </label>
              {missionUseCheck && (
                <div className="flex gap-2 items-center">
                  <select value={missionCheckStat} onChange={e => setMissionCheckStat(e.target.value as StatKey)}>
                    {STAT_KEYS.map(k => <option key={k} value={k}>{STAT_LABELS[k]}</option>)}
                  </select>
                  <span style={{ color: '#666', fontSize: 12 }}>проти СК</span>
                  <input type="number" value={missionCheckDC} onChange={e => setMissionCheckDC(Number(e.target.value))} style={{ width: 70 }} />
                </div>
              )}
              {!missionUseCheck && (
                <p style={{ color: '#555', fontSize: 11 }}>Без кидка — місія зараховується автоматично, нагорода видається одразу.</p>
              )}

              <label style={{ color: '#888', fontSize: 12, marginTop: 6 }}>Нагорода</label>
              <select value={missionRewardType} onChange={e => setMissionRewardType(e.target.value as MissionRewardType)}>
                <option value="none">Без нагороди</option>
                <option value="item">Предмет</option>
                <option value="hp">Відновити ОЗ</option>
                <option value="stat">Підняти характеристику</option>
              </select>
              {missionRewardType === 'item' && (
                <div className="flex flex-col gap-2">
                  {missionRewardItems.length > 0 && (
                    <div className="flex flex-col gap-1">
                      {missionRewardItems.map((it, i) => (
                        <div key={i} className="flex items-center justify-between" style={{ background: '#0a0a0a', border: '1px solid #1e2230', borderRadius: 4, padding: '4px 10px' }}>
                          <span style={{ color: '#ccc', fontSize: 12 }}>{getItem(it.itemKey)?.name ?? it.itemKey} ×{it.qty}</span>
                          <button type="button" onClick={() => setMissionRewardItems(items => items.filter((_, idx) => idx !== i))}
                            style={{ color: '#c0392b', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 items-center">
                    <select value={pickItemKey} onChange={e => setPickItemKey(e.target.value)} style={{ flex: 1 }}>
                      {ALL_ITEMS.map(it => <option key={it.key} value={it.key}>{it.name}</option>)}
                    </select>
                    <input type="number" min={1} value={pickItemQty} onChange={e => setPickItemQty(Number(e.target.value))} style={{ width: 60 }} />
                    <button type="button"
                      onClick={() => {
                        if (!pickItemKey) return
                        setMissionRewardItems(items => [...items, { itemKey: pickItemKey, qty: Math.max(1, pickItemQty) }])
                        setPickItemQty(1)
                      }}
                      style={{ fontSize: 12, color: '#27ae60', background: 'none', border: '1px solid #1a2a1a', borderRadius: 4, padding: '6px 10px', cursor: 'pointer' }}>
                      + Додати
                    </button>
                  </div>
                </div>
              )}
              {missionRewardType === 'hp' && (
                <div className="flex gap-2 items-center">
                  <span style={{ color: '#666', fontSize: 12 }}>Відновити ОЗ:</span>
                  <input type="number" min={1} value={missionRewardHp} onChange={e => setMissionRewardHp(Number(e.target.value))} style={{ width: 70 }} />
                </div>
              )}
              {missionRewardType === 'stat' && (
                <div className="flex gap-2 items-center">
                  <select value={missionRewardStat} onChange={e => setMissionRewardStat(e.target.value as StatKey)}>
                    {STAT_KEYS.map(k => <option key={k} value={k}>{STAT_LABELS[k]}</option>)}
                  </select>
                  <span style={{ color: '#666', fontSize: 12 }}>+</span>
                  <input type="number" min={1} value={missionRewardStatAmount} onChange={e => setMissionRewardStatAmount(Number(e.target.value))} style={{ width: 60 }} />
                </div>
              )}

              <button
                onClick={async () => {
                  const ok = await call('/api/gm/mission', {
                    title: missionTitle, text: missionText,
                    targetCharId: missionTarget || null,
                    checkStat: missionUseCheck ? missionCheckStat : null,
                    checkDC: missionCheckDC,
                    rewardType: missionRewardType,
                    items: missionRewardItems,
                    hpAmount: missionRewardHp,
                    statKey: missionRewardStat, statAmount: missionRewardStatAmount,
                  })
                  if (ok) {
                    setMissionTitle(''); setMissionText(''); setMissionTarget(''); setMissionUseCheck(false); setMissionRewardType('none'); setMissionRewardItems([])
                  }
                }}
                disabled={loading || !missionTitle.trim() || !missionText.trim() || (missionRewardType === 'item' && missionRewardItems.length === 0)}
                className="btn-primary" style={{ marginTop: 8 }}>
                Створити місію
              </button>
              {missionRewardType === 'item' && missionRewardItems.length === 0 && (
                <p style={{ color: '#c0392b', fontSize: 11 }}>Додай хоча б один предмет вище (кнопка "+ Додати"), щоб можна було створити місію.</p>
              )}
            </div>
            <p style={{ color: '#555', fontSize: 12, marginTop: 8 }}>
              Гравець(-ці) побачать її на головній сторінці й самі натиснуть "Виконати" — кидок (якщо є) і нагорода відбудуться в них.
            </p>
          </div>

          {missions.length > 0 && (
            <div className="card">
              <h2 style={{ color: '#c9a227', fontSize: 15, marginBottom: 12 }}>Створені місії</h2>
              <div className="flex flex-col gap-2">
                {missions.map(m => {
                  const completedCount = Object.keys(m.completions).length
                  return (
                    <div key={m.id} className="flex justify-between items-start gap-3" style={{ background: '#0a0a0a', border: '1px solid #1e2230', borderRadius: 6, padding: '8px 12px' }}>
                      <div>
                        <div style={{ color: '#e5e5e5', fontSize: 13 }}>{m.title} <span style={{ color: '#666', fontSize: 11 }}>— {m.targetName ? `${m.targetName} (#${m.targetCharId})` : 'усі гравці'}</span></div>
                        <div style={{ color: '#666', fontSize: 11, marginTop: 2 }}>
                          {m.checkStat ? `${STAT_LABELS[m.checkStat]} проти СК ${m.checkDC}` : 'без кидка'} · нагорода: {missionRewardSummary(m.reward) ?? 'немає'}
                          {completedCount > 0 && <> · виконано: {completedCount}</>}
                        </div>
                      </div>
                      <button onClick={() => call('/api/gm/mission/delete', { missionId: m.id })} disabled={loading}
                        style={{ fontSize: 11, color: '#c0392b', background: 'none', border: '1px solid #2a1a1a', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', flexShrink: 0 }}>
                        Видалити
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'inbox' && (
        <div className="flex flex-col gap-3">
          {inbox.length === 0 && <p style={{ color: '#555' }}>Пошта порожня.</p>}
          {inbox.map((l, i) => (
            <div key={i} className="card" style={{ borderColor: l.type === 'report' ? '#3a1010' : '#2a241c' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="tag" style={l.type === 'report' ? {} : { borderColor: '#3a3a8a', color: '#7289da' }}>
                  {l.type === 'report' ? `🚩 Скарга на ${l.targetName}` : '✉️ Лист'}
                </span>
                <span style={{ color: '#555', fontSize: 11 }}>{new Date(l.at).toLocaleString('uk-UA')}</span>
              </div>
              <p style={{ color: '#666', fontSize: 12, marginBottom: 6 }}>Від: {l.from}</p>
              <p style={{ color: '#ccc', fontSize: 14, lineHeight: 1.6, marginBottom: 10 }}>{l.text}</p>
              <div className="flex gap-2">
                <input value={replyDrafts[i] ?? ''} onChange={e => setReplyDrafts(d => ({ ...d, [i]: e.target.value }))}
                  placeholder={`Відповісти ${l.from}...`} style={{ flex: 1 }} />
                <button
                  onClick={async () => {
                    if (await call('/api/gm/inbox/reply', { toNickname: l.from, text: replyDrafts[i] ?? '' })) {
                      setReplyDrafts(d => ({ ...d, [i]: '' }))
                    }
                  }}
                  disabled={loading || !(replyDrafts[i] ?? '').trim()} className="btn-gold">
                  Надіслати
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'logs' && (
        <div className="card">
          <div className="flex justify-between items-center mb-3">
            <h2 style={{ color: '#c9a227', fontSize: 15 }}>Активність на сервері (останні 48 год)</h2>
            <button onClick={fetchLogs} style={{ fontSize: 12, color: '#a68a4a', background: 'none', border: '1px solid #2a241c', borderRadius: 4, padding: '5px 12px', cursor: 'pointer' }}>
              🔄 Оновити
            </button>
          </div>
          {logs.length === 0 && <p style={{ color: '#555', fontSize: 13 }}>Поки що порожньо.</p>}
          <div className="flex flex-col gap-1" style={{ maxHeight: 600, overflowY: 'auto' }}>
            {logs.map((l, i) => (
              <div key={i} className="flex gap-3" style={{ fontSize: 12, borderBottom: '1px solid #1e2230', padding: '4px 0' }}>
                <span style={{ color: '#555', flexShrink: 0, fontFamily: 'monospace' }}>{new Date(l.at).toLocaleString('uk-UA')}</span>
                <span style={{ color: '#ccc' }}>{l.text}</span>
              </div>
            ))}
          </div>
          <p style={{ color: '#555', fontSize: 11, marginTop: 10 }}>Записи старші за 48 годин видаляються автоматично.</p>
        </div>
      )}
    </div>
  )
}
