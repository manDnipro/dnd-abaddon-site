'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { STAT_LABELS, STAT_BUDGET, STAT_MIN, STAT_MAX, Stats } from '@/lib/types'

const STAT_KEYS = Object.keys(STAT_LABELS) as (keyof Stats)[]

export default function CreateCharacterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [stats, setStats] = useState<Stats>({ str: 3, agi: 3, end: 3, per: 3, int: 3, cha: 3 })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const sum = Object.values(stats).reduce((a, b) => a + b, 0)
  const remaining = STAT_BUDGET - sum

  function setStat(key: keyof Stats, value: number) {
    if (value < STAT_MIN || value > STAT_MAX) return
    setStats(s => ({ ...s, [key]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (remaining !== 0) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/character/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, stats }),
    })
    setLoading(false)
    if (res.ok) {
      router.push('/')
    } else {
      const d = await res.json()
      setError(d.error || 'Помилка')
    }
  }

  return (
    <div>
      <h1 style={{ color: '#e5e5e5', fontSize: 24, marginBottom: 20 }}>Створення персонажа</h1>
      <form onSubmit={submit} className="card flex flex-col gap-4">
        <div>
          <label className="block text-sm mb-1" style={{ color: '#aaa' }}>Імʼя персонажа</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Наприклад: Волк" required />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span style={{ color: '#aaa', fontSize: 14 }}>Характеристики (від {STAT_MIN} до {STAT_MAX})</span>
            <span style={{ color: remaining === 0 ? '#27ae60' : '#c0392b', fontWeight: 700, fontSize: 14 }}>
              Залишилось: {remaining}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {STAT_KEYS.map(key => (
              <div key={key} className="flex items-center justify-between" style={{ background: '#0a0a0a', border: '1px solid #1e2230', borderRadius: 6, padding: '8px 12px' }}>
                <span style={{ color: '#ccc', fontSize: 14 }}>{STAT_LABELS[key]}</span>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setStat(key, stats[key] - 1)}
                    style={{ width: 28, height: 28, borderRadius: 4, border: '1px solid #2a2a2a', background: 'none', color: '#c9a227', cursor: 'pointer' }}>−</button>
                  <span style={{ color: '#c9a227', fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{stats[key]}</span>
                  <button type="button" onClick={() => setStat(key, stats[key] + 1)}
                    style={{ width: 28, height: 28, borderRadius: 4, border: '1px solid #2a2a2a', background: 'none', color: '#c9a227', cursor: 'pointer' }}>+</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <p style={{ color: '#c0392b', fontSize: 14 }}>🚫 {error}</p>}
        <button type="submit" className="btn-primary" disabled={loading || remaining !== 0}>
          {loading ? '...' : 'Надіслати на затвердження ГМ'}
        </button>
      </form>
    </div>
  )
}
