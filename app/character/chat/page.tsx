'use client'
import { useEffect, useRef, useState } from 'react'
import { Character } from '@/lib/types'
import { ChatMessage } from '@/lib/chat'

const POLL_MS = 5_000

function formatTime(at: number): string {
  return new Date(at).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function ChatPage() {
  const [character, setCharacter] = useState<Character | null | undefined>(undefined)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  async function loadMessages() {
    const res = await fetch('/api/chat')
    if (res.ok) setMessages(await res.json())
  }

  useEffect(() => {
    fetch('/api/character/mine').then(r => r.json()).then(d => setCharacter(d.character))
    loadMessages()
    const t = setInterval(loadMessages, POLL_MS)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function send() {
    if (!text.trim() || sending) return
    setSending(true)
    setError('')
    const res = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }),
    })
    setSending(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error || 'Не вдалось відправити')
      return
    }
    setText('')
    await loadMessages()
  }

  if (character === undefined) return <p style={{ color: '#555' }}>Завантажую чат...</p>
  if (character === null) return <p style={{ color: '#888' }}>Спершу увійди в акаунт.</p>
  const canChat = character.status === 'approved' && !character.dead

  return (
    <div>
      <p style={{ fontFamily: "'Special Elite', monospace", fontSize: 11, color: '#a68a4a', letterSpacing: '0.2em', marginBottom: 10 }}>
        💬 ЗАГАЛЬНИЙ ЧАТ ТАБОРУ
      </p>
      <p style={{ color: '#555', fontSize: 11, marginBottom: 10 }}>Повідомлення зберігаються 48 годин, потім зникають самі.</p>

      <div className="card mb-3" style={{ height: '55vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && <p style={{ color: '#555', fontSize: 13 }}>Ще нічого не написано — будь першим.</p>}
        {messages.map((m, i) => (
          <div key={i} style={{ fontSize: 13, lineHeight: 1.6 }}>
            <span style={{ color: '#c9a94f', fontWeight: 700, fontFamily: "'Special Elite', monospace" }}>{m.from}</span>
            <span style={{ color: '#555', fontSize: 11, marginLeft: 6 }}>{formatTime(m.at)}</span>
            <p style={{ color: '#c9c4ba', marginTop: 2, wordBreak: 'break-word' }}>{m.text}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {canChat ? (
        <div className="flex gap-2">
          <input
            value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send() }}
            placeholder="Написати в чат..." style={{ flex: 1 }} maxLength={500}
          />
          <button onClick={send} disabled={sending || !text.trim()} className="btn-gold">Надіслати</button>
        </div>
      ) : (
        <p style={{ color: '#666', fontSize: 13 }}>
          {character.dead ? '☠️ Мертві персонажі не можуть писати в чат.' : 'Чат стане доступним після затвердження персонажа ГМ-ом.'}
        </p>
      )}
      {error && <p style={{ color: '#c0392b', fontSize: 12, marginTop: 6 }}>{error}</p>}
    </div>
  )
}
