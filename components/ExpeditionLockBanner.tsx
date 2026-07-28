'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ExpeditionState } from '@/lib/types'

export default function ExpeditionLockBanner({ expedition }: { expedition: NonNullable<ExpeditionState> }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const secondsLeft = Math.max(0, Math.ceil((expedition.arrivesAt - now) / 1000))
  const traveling = expedition.phase !== 'on_site' && secondsLeft > 0

  return (
    <div className="card text-center" style={{ borderColor: '#6b1010' }}>
      <p style={{ color: '#e0a03a', marginBottom: 10, fontFamily: "'Special Elite', monospace" }}>
        🚶 Ти зараз на вилазці — табір недоступний, поки не повернешся.
      </p>
      {traveling ? (
        <>
          <p style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>
            {expedition.phase === 'traveling_out' ? 'До місця ще' : 'До табору ще'}
          </p>
          <p style={{ color: '#c9a227', fontSize: 28, fontWeight: 700, fontFamily: 'monospace', marginBottom: 12 }}>
            {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
          </p>
        </>
      ) : (
        <p style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>Ти на місці — доступ відкриється, коли сам вирушиш назад.</p>
      )}
      <Link href="/character/expedition" className="btn-gold">🔍 До вилазки</Link>
    </div>
  )
}
