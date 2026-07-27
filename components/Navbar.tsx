'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const LINKS = [
  { href: '/', label: 'Головна' },
  { href: '/character/create', label: 'Створити персонажа' },
  { href: '/character/inventory', label: 'Спорядження' },
  { href: '/character/actions', label: 'Дії' },
  { href: '/character/trade', label: 'Торгівля' },
  { href: '/character/barter', label: 'Обмін' },
  { href: '/character/expedition', label: 'Вилазка' },
  { href: '/gm', label: 'ГМ' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <nav style={{ borderBottom: '1px solid #2a241c', background: 'rgba(10,9,8,0.9)', backdropFilter: 'blur(6px)' }} className="sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" onClick={() => setOpen(false)} style={{ fontFamily: 'Butcherman, serif', fontSize: 20, color: '#a68a4a', letterSpacing: '0.04em' }}>
          ABADDON
        </Link>

        <div className="hidden sm:flex items-center gap-4 flex-wrap">
          {LINKS.map(l => (
            <Link key={l.href} href={l.href} className="nav-link"
              style={pathname === l.href ? { color: '#c9a94f' } : {}}>
              {l.label}
            </Link>
          ))}
        </div>

        <button onClick={() => setOpen(o => !o)} className="sm:hidden"
          style={{ background: 'none', border: '1px solid #2a241c', color: '#a68a4a', padding: '6px 10px', borderRadius: 3, fontSize: 18, lineHeight: 1, cursor: 'pointer' }}>
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open && (
        <div className="sm:hidden flex flex-col" style={{ borderTop: '1px solid #2a241c', padding: '10px 16px', background: 'rgba(8,7,6,0.98)' }}>
          {LINKS.map(l => (
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
