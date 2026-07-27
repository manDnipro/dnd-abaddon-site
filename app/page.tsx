'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Character, STAT_LABELS, Stats } from '@/lib/types'

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
      <h1 style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 'clamp(28px, 7vw, 44px)', color: '#c9a227', letterSpacing: '0.12em', marginBottom: 8 }}>
        ABADDON
      </h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Настільна гра виживання у світі після зомбі-апокаліпсису</p>

      {nickname === undefined && <p style={{ color: '#555' }}>Завантаження...</p>}

      {nickname === null && (
        <div className="card">
          <p style={{ color: '#aaa', marginBottom: 16 }}>Увійди або зареєструйся, щоб створити персонажа.</p>
          <div className="flex gap-3">
            <Link href="/login" className="btn-primary">Увійти</Link>
            <Link href="/register" className="btn-gold">Реєстрація</Link>
          </div>
        </div>
      )}

      {nickname && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <p style={{ color: '#aaa' }}>Ти в грі як <span style={{ color: '#c9a227', fontWeight: 700 }}>{nickname}</span></p>
            <button onClick={logout} style={{ color: '#555', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>Вийти</button>
          </div>

          {character === undefined && <p style={{ color: '#555' }}>Завантаження персонажа...</p>}

          {character === null && (
            <div>
              <p style={{ color: '#888', marginBottom: 16 }}>У тебе ще немає персонажа.</p>
              <Link href="/character/create" className="btn-primary">Створити персонажа</Link>
            </div>
          )}

          {character && (
            <div>
              <h2 style={{ color: '#e5e5e5', fontSize: 20, marginBottom: 6 }}>{character.name}</h2>
              {character.status === 'pending' && (
                <span className="tag">⏳ Очікує підтвердження ГМ</span>
              )}
              {character.status === 'approved' && (
                <span className="tag" style={{ borderColor: '#27ae60', color: '#27ae60' }}>✅ Затверджено</span>
              )}
              {character.status === 'rejected' && (
                <span className="tag">❌ Відхилено {character.reviewNote ? `— ${character.reviewNote}` : ''}</span>
              )}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {(Object.entries(character.stats) as [keyof Stats, number][]).map(([k, v]) => (
                  <div key={k} style={{ background: '#0a0a0a', border: '1px solid #1e2230', borderRadius: 6, padding: '6px 10px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666', fontSize: 13 }}>{STAT_LABELS[k]}</span>
                    <span style={{ color: '#c9a227', fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
              </div>
              {character.status === 'approved' && (
                <Link href="/character/inventory" className="btn-gold inline-block mt-4">🎒 Спорядження</Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
