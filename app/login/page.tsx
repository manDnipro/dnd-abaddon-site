'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, password }),
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
      <h1 style={{ color: '#e5e5e5', fontSize: 24, marginBottom: 4 }}>Повернення до табору</h1>
      <p style={{ color: '#666', marginBottom: 20, fontSize: 13, fontFamily: "'Special Elite', monospace" }}>Вартові впізнають тебе за іменем і паролем.</p>
      <form onSubmit={submit} className="card flex flex-col gap-4">
        <div>
          <label className="block text-sm mb-1" style={{ color: '#aaa' }}>Нікнейм</label>
          <input value={nickname} onChange={e => setNickname(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1" style={{ color: '#aaa' }}>Пароль</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        {error && <p style={{ color: '#c0392b', fontSize: 14 }}>🚫 {error}</p>}
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Впускаю...' : 'Увійти'}</button>
      </form>
    </div>
  )
}
