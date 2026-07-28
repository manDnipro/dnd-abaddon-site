'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const BASE_LINKS = [
  { href: '/', label: 'Головна' },
  { href: '/character/inventory', label: 'Спорядження' },
  { href: '/character/actions', label: 'Дії' },
  { href: '/character/trade', label: 'Торгівля' },
  { href: '/character/barter', label: 'Обмін' },
  { href: '/character/social', label: 'Табір' },
  { href: '/character/expedition', label: 'Вилазка' },
  { href: '/gm', label: 'ГМ' },
]
const CREATE_LINK = { href: '/character/create', label: 'Створити персонажа' }

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [hasLivingCharacter, setHasLivingCharacter] = useState(false)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    fetch('/api/character/mine').then(r => r.json()).then(d => {
      setHasLivingCharacter(!!d.character && !d.character.dead)
      setAvatar(d.character?.avatar ?? null)
      setLoggedIn(d.character !== undefined)
    }).catch(() => {})
  }, [pathname])

  const links = hasLivingCharacter ? BASE_LINKS : [BASE_LINKS[0], CREATE_LINK, ...BASE_LINKS.slice(1)]

  return (
    <nav style={{ borderBottom: '1px solid #2a241c', background: 'rgba(10,9,8,0.9)', backdropFilter: 'blur(6px)' }} className="sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" onClick={() => setOpen(false)} style={{ fontFamily: 'Butcherman, serif', fontSize: 20, color: '#a68a4a', letterSpacing: '0.04em' }}>
          ABADDON
        </Link>

        <div className="hidden sm:flex items-center gap-4 flex-wrap">
          {links.map(l => (
            <Link key={l.href} href={l.href} className="nav-link"
              style={pathname === l.href ? { color: '#c9a94f' } : {}}>
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {loggedIn && (
            <Link href="/" title="Профіль" style={{
              position: 'relative', width: 34, height: 34, borderRadius: '50%', overflow: 'hidden',
              border: '2px solid #a68a4a', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#0a0908', color: '#a68a4a', fontSize: 15,
            }}>
              {avatar ? <Image src={avatar} alt="Профіль" fill style={{ objectFit: 'cover' }} /> : '👤'}
            </Link>
          )}
          <button onClick={() => setOpen(o => !o)} className="sm:hidden"
            style={{ background: 'none', border: '1px solid #2a241c', color: '#a68a4a', padding: '6px 10px', borderRadius: 3, fontSize: 18, lineHeight: 1, cursor: 'pointer' }}>
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {open && (
        <div className="sm:hidden flex flex-col" style={{ borderTop: '1px solid #2a241c', padding: '10px 16px', background: 'rgba(8,7,6,0.98)' }}>
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              style={{
                padding: '12px 8px', fontFamily: "'Special Elite', monospace", fontSize: 14, letterSpacing: '0.05em',
                color: pathname === l.href ? '#c9a94f' : '#8a8378', borderBottom: '1px dashed #201b15',
              }}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
