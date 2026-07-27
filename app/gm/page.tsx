'use client'
import { useEffect, useState } from 'react'
import { Character, STAT_LABELS, Stats } from '@/lib/types'

export default function GMPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState<Character[]>([])
  const [loading, setLoading] = useState(false)

  async function loadPending() {
    const res = await fetch('/api/gm/characters')
    if (res.ok) {
      setPending(await res.json())
      setAuthed(true)
    }
  }

  useEffect(() => { loadPending() }, [])

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const res = await fetch('/api/gm/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      loadPending()
    } else {
      const d = await res.json()
      setError(d.error || 'Помилка')
    }
  }

  async function review(id: string, action: 'approve' | 'reject') {
    setLoading(true)
    const note = action === 'reject' ? prompt('Причина відхилення (необовʼязково):') || undefined : undefined
    await fetch('/api/gm/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, note }),
    })
    await loadPending()
    setLoading(false)
  }

  if (!authed) {
    return (
      <div>
        <h1 style={{ color: '#e5e5e5', fontSize: 24, marginBottom: 20 }}>Панель ГМ</h1>
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

  return (
    <div>
      <h1 style={{ color: '#e5e5e5', fontSize: 24, marginBottom: 6 }}>Панель ГМ</h1>
      <p style={{ color: '#666', marginBottom: 20 }}>Персонажі, що очікують підтвердження: {pending.length}</p>

      {pending.length === 0 && <p style={{ color: '#555' }}>Черга порожня.</p>}

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
  )
}
