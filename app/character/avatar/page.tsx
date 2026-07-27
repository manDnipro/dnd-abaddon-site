'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Character } from '@/lib/types'
import { AVATARS } from '@/lib/avatars'

export default function AvatarPage() {
  const router = useRouter()
  const [character, setCharacter] = useState<Character | null | undefined>(undefined)
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/character/mine').then(r => r.json()).then(d => {
      setCharacter(d.character)
      if (d.character?.avatar) {
        const i = AVATARS.indexOf(d.character.avatar)
        if (i >= 0) setIndex(i)
      }
    })
  }, [])

  if (character === undefined) return <p style={{ color: '#555' }}>Шукаю дзеркало серед уламків...</p>
  if (character === null) return <p style={{ color: '#888' }}>Нема кому дивитись у дзеркало.</p>

  async function choose() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/character/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar: AVATARS[index] }),
    })
    setLoading(false)
    if (res.ok) router.push('/')
    else setError((await res.json()).error || 'Помилка')
  }

  return (
    <div>
      <h1 style={{ color: '#e5e5e5', fontSize: 24, marginBottom: 4 }}>Хто дивиться на тебе з дзеркала</h1>
      <p style={{ color: '#666', marginBottom: 20, fontSize: 13, fontFamily: "'Special Elite', monospace", textAlign: 'center' }}>Обери обличчя, яке запам'ятає табір.</p>
      <div className="card text-center" style={{ maxWidth: 340, margin: '0 auto' }}>
        <div style={{ position: 'relative', width: 220, height: 220, margin: '0 auto 20px', borderRadius: 6, overflow: 'hidden', border: '1px solid #2a241c' }}>
          <Image src={AVATARS[index]} alt="Аватар" fill style={{ objectFit: 'cover' }} />
        </div>
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setIndex(i => (i - 1 + AVATARS.length) % AVATARS.length)}
            style={{ width: 40, height: 40, borderRadius: 4, border: '1px solid #2a241c', background: 'none', color: '#a68a4a', fontSize: 18, cursor: 'pointer' }}>⬅️</button>
          <span style={{ color: '#888', fontSize: 13 }}>{index + 1} / {AVATARS.length}</span>
          <button onClick={() => setIndex(i => (i + 1) % AVATARS.length)}
            style={{ width: 40, height: 40, borderRadius: 4, border: '1px solid #2a241c', background: 'none', color: '#a68a4a', fontSize: 18, cursor: 'pointer' }}>➡️</button>
        </div>
        {error && <p style={{ color: '#c0392b', fontSize: 13, marginBottom: 12 }}>🚫 {error}</p>}
        <button onClick={choose} disabled={loading} className="btn-primary">{loading ? 'Дивлюсь у дзеркало...' : '✅ Це я'}</button>
      </div>
    </div>
  )
}
