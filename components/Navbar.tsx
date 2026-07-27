'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/', label: 'Головна' },
  { href: '/character/create', label: 'Створити персонажа' },
  { href: '/character/inventory', label: 'Спорядження' },
  { href: '/character/expedition', label: 'Вилазка' },
  { href: '/gm', label: 'ГМ' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav style={{ borderBottom: '1px solid #2a241c', background: 'rgba(10,9,8,0.85)', backdropFilter: 'blur(6px)' }} className="sticky top-0 z-50">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
        <Link href="/" style={{ fontFamily: 'Butcherman, serif', fontSize: 20, color: '#a68a4a', letterSpacing: '0.04em' }}>
          ABADDON
        </Link>
        <div className="flex items-center gap-4 flex-wrap">
          {LINKS.map(l => (
            <Link key={l.href} href={l.href} className="nav-link"
              style={pathname === l.href ? { color: '#c9a94f' } : {}}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
