'use client'
import { useEffect, useState, useCallback } from 'react'
import { Character, STAT_LABELS, formatModifier, statModifier } from '@/lib/types'
import { RPMission, missionRewardSummary } from '@/lib/rpMissions'
import { PlayerMessage } from '@/lib/playerInbox'

type PDATab = 'missions' | 'messages'

export default function PlayerPDA() {
  const [character, setCharacter] = useState<Character | null>(null)
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<PDATab>('missions')
  const [missions, setMissions] = useState<RPMission[]>([])
  const [messages, setMessages] = useState<PlayerMessage[]>([])
  const [missionLoading, setMissionLoading] = useState<string | null>(null)
  const [missionResult, setMissionResult] = useState<{ title: string; log: string[] } | null>(null)

  const refresh = useCallback(async () => {
    const meRes = await fetch('/api/character/mine')
    const me = await meRes.json()
    setCharacter(me.character ?? null)
    if (!me.character || me.character.status !== 'approved' || me.character.dead) return
    const [missionsRes, messagesRes] = await Promise.all([
      fetch('/api/character/missions'), fetch('/api/character/inbox'),
    ])
    if (missionsRes.ok) setMissions(await missionsRes.json())
    if (messagesRes.ok) setMessages(await messagesRes.json())
  }, [])

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 30_000)
    return () => clearInterval(t)
  }, [refresh])

  async function openTab(next: PDATab) {
    setTab(next)
    if (next === 'messages' && messages.some(m => !m.read)) {
      await fetch('/api/character/inbox/read', { method: 'POST' })
      setMessages(ms => ms.map(m => ({ ...m, read: true })))
    }
  }

  async function attemptMission(missionId: string, title: string) {
    setMissionLoading(missionId)
    const res = await fetch('/api/character/missions/attempt', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ missionId }),
    })
    const d = await res.json()
    setMissionLoading(null)
    if (!res.ok) return
    setMissionResult({ title, log: d.log })
    refresh()
  }

  if (!character || character.status !== 'approved' || character.dead) return null

  const unreadCount = messages.filter(m => !m.read).length
  const badgeCount = unreadCount + missions.length

  return (
    <div style={{ position: 'fixed', right: 18, bottom: 18, zIndex: 200 }}>
      {open && (
        <div style={{
          position: 'absolute', bottom: 64, right: 0, width: 340, maxHeight: '70vh', overflowY: 'auto',
          background: '#0d0b08', border: '2px solid #3a342a', borderRadius: 6,
          boxShadow: '0 8px 32px rgba(0,0,0,0.7), inset 0 0 40px rgba(0,0,0,0.5)',
        }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #2a241c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: "'Special Elite', monospace", fontSize: 11, color: '#a68a4a', letterSpacing: '0.15em' }}>📟 КПК ВИЖИВШОГО</span>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>

          <div className="flex" style={{ borderBottom: '1px solid #2a241c' }}>
            <button onClick={() => openTab('missions')}
              style={{
                flex: 1, padding: '8px 0', fontSize: 12, cursor: 'pointer', background: 'none',
                border: 'none', borderBottom: tab === 'missions' ? '2px solid #a68a4a' : '2px solid transparent',
                color: tab === 'missions' ? '#c9a94f' : '#777',
              }}>
              📜 Місії {missions.length > 0 && <span style={{ color: '#c0392b' }}>({missions.length})</span>}
            </button>
            <button onClick={() => openTab('messages')}
              style={{
                flex: 1, padding: '8px 0', fontSize: 12, cursor: 'pointer', background: 'none',
                border: 'none', borderBottom: tab === 'messages' ? '2px solid #a68a4a' : '2px solid transparent',
                color: tab === 'messages' ? '#c9a94f' : '#777',
              }}>
              ✉️ Пошта {unreadCount > 0 && <span style={{ color: '#c0392b' }}>({unreadCount})</span>}
            </button>
          </div>

          <div style={{ padding: 14 }}>
            {tab === 'missions' && (
              <>
                {missionResult && (
                  <div className="mb-4" style={{ background: '#0a0a0a', border: '1px solid #a68a4a', borderRadius: 4, padding: '8px 10px' }}>
                    <div className="flex justify-between items-start mb-1">
                      <span style={{ color: '#c9a94f', fontSize: 12, fontWeight: 700 }}>«{missionResult.title}»</span>
                      <button onClick={() => setMissionResult(null)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 13 }}>✕</button>
                    </div>
                    <div className="flex flex-col gap-1">
                      {missionResult.log.map((line, i) => (
                        <p key={i} style={{ color: '#a99c8a', fontSize: 11, lineHeight: 1.5 }}>{line}</p>
                      ))}
                    </div>
                  </div>
                )}
                {missions.length === 0 ? (
                  <p style={{ color: '#555', fontSize: 12 }}>Наразі для тебе немає місій.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {missions.map(m => {
                      const rewardLabel = missionRewardSummary(m.reward)
                      const checkLabel = m.checkStat
                        ? `🎲 ${STAT_LABELS[m.checkStat]} ${formatModifier(statModifier(character.stats[m.checkStat]))} проти СК ${m.checkDC}`
                        : null
                      return (
                        <div key={m.id} style={{ borderBottom: '1px solid #1e2230', paddingBottom: 12 }}>
                          <p style={{ color: '#c9a94f', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{m.title}</p>
                          <p style={{ color: '#bbb', fontSize: 12, lineHeight: 1.6, marginBottom: 6 }}>{m.text}</p>
                          <p style={{ color: '#666', fontSize: 11, marginBottom: 8 }}>
                            {checkLabel ?? 'без кидка'}{rewardLabel && <> · {rewardLabel}</>}
                          </p>
                          <button onClick={() => attemptMission(m.id, m.title)} disabled={missionLoading === m.id} className="btn-gold" style={{ fontSize: 12, padding: '5px 12px' }}>
                            {missionLoading === m.id ? 'Виконую...' : 'Виконати'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {tab === 'messages' && (
              messages.length === 0 ? (
                <p style={{ color: '#555', fontSize: 12 }}>Пошта порожня.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {messages.map(m => (
                    <div key={m.id} style={{ background: '#0a0a0a', border: '1px solid #1e2230', borderRadius: 4, padding: '8px 10px' }}>
                      <div className="flex justify-between" style={{ marginBottom: 4 }}>
                        <span style={{ color: '#7289da', fontSize: 11, fontWeight: 700 }}>{m.from}</span>
                        <span style={{ color: '#555', fontSize: 10 }}>{new Date(m.at).toLocaleString('uk-UA')}</span>
                      </div>
                      <p style={{ color: '#ccc', fontSize: 12, lineHeight: 1.6 }}>{m.text}</p>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      )}

      <button onClick={() => setOpen(o => !o)} title="КПК"
        style={{
          position: 'relative', width: 52, height: 52, borderRadius: 8,
          background: 'linear-gradient(160deg, #2a2620, #17140f)', border: '2px solid #4a4436',
          boxShadow: '0 4px 18px rgba(0,0,0,0.6)', cursor: 'pointer', fontSize: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
        📟
        {badgeCount > 0 && (
          <span style={{
            position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, borderRadius: 9,
            background: '#c0392b', color: '#fff', fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
            border: '2px solid #0a0908',
          }}>
            {badgeCount}
          </span>
        )}
      </button>
    </div>
  )
}
