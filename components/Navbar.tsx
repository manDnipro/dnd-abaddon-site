'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const BASE_LINKS = [
  { href: '/', label: 'Головна' },
  { href: '/character/sheet', label: 'Картка' },
  { href: '/character/inventory', label: 'Спорядження' },
  { href: '/character/actions', label: 'Дії' },
  { href: '/character/trade', label: 'Торгівля' },
  { href: '/character/barter', label: 'Обмін' },
  { href: '/character/social', label: 'Табір' },
  { href: '/character/chat', label: 'Чат' },
  { href: '/character/expedition', label: 'Вилазка' },
  { href: '/gm', label: 'ГМ' },
]
const CREATE_LINK = { href: '/character/create', label: 'Створити персонажа' }

type Panel = null | 'menu' | 'message' | 'report'

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [hasLivingCharacter, setHasLivingCharacter] = useState(false)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [panel, setPanel] = useState<Panel>(null)
  const [messageText, setMessageText] = useState('')
  const [reportTarget, setReportTarget] = useState('')
  const [reportReason, setReportReason] = useState('')
  const [others, setOthers] = useState<{ id: string; name: string }[]>([])
  const [status, setStatus] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/character/mine').then(r => r.json()).then(d => {
      setHasLivingCharacter(!!d.character && !d.character.dead)
      setAvatar(d.character?.avatar ?? null)
      setLoggedIn(d.character !== undefined)
    }).catch(() => {})
  }, [pathname])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setPanel(null)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const links = hasLivingCharacter ? BASE_LINKS : [BASE_LINKS[0], CREATE_LINK, ...BASE_LINKS.slice(1)]

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setPanel(null)
    // router.push('/') is a no-op when already on "/", and router.refresh() only revalidates
    // server-rendered data — neither resets this component's own client-side auth state (or the
    // homepage's). A hard reload guarantees every component re-reads the now-cleared session.
    window.location.href = '/'
  }

  async function sendMessage() {
    if (!messageText.trim()) return
    const res = await fetch('/api/gm/inbox/message', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: messageText }),
    })
    setStatus(res.ok ? '✅ Лист відправлено ГМ.' : '🚫 Не вдалось відправити.')
    if (res.ok) setMessageText('')
    setTimeout(() => { setStatus(''); setPanel(null) }, 1500)
  }

  async function openReport() {
    setPanel('report')
    const o = await fetch('/api/character/others').then(r => r.json()).catch(() => [])
    setOthers(o)
  }

  async function sendReport() {
    if (!reportTarget || !reportReason.trim()) return
    const res = await fetch('/api/gm/inbox/report', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetCharId: reportTarget, reason: reportReason }),
    })
    setStatus(res.ok ? '✅ Скаргу передано ГМ.' : '🚫 Не вдалось відправити.')
    if (res.ok) { setReportReason(''); setReportTarget('') }
    setTimeout(() => { setStatus(''); setPanel(null) }, 1500)
  }

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
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button onClick={() => setPanel(p => p ? null : 'menu')} title="Профіль" style={{
                position: 'relative', width: 34, height: 34, borderRadius: '50%', overflow: 'hidden',
                border: '2px solid #a68a4a', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#0a0908', color: '#a68a4a', fontSize: 15, cursor: 'pointer',
              }}>
                {avatar ? <Image src={avatar} alt="Профіль" fill style={{ objectFit: 'cover' }} /> : '👤'}
              </button>

              {panel === 'menu' && (
                <div style={{
                  position: 'absolute', right: 0, top: 44, width: 220, background: '#0d0b09', border: '1px solid #2a241c',
                  borderRadius: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.6)', zIndex: 60, overflow: 'hidden',
                }}>
                  <MenuItem label="📋 Картка персонажа" href="/character/sheet" onClick={() => setPanel(null)} />
                  <MenuItem label="✉️ Звернутися до ГМ" onClick={() => setPanel('message')} />
                  <MenuItem label="🚩 Поскаржитись на гравця" onClick={openReport} />
                  <MenuItem label="🚪 Вийти з акаунту" onClick={logout} danger />
                </div>
              )}

              {panel === 'message' && (
                <div style={{
                  position: 'absolute', right: 0, top: 44, width: 280, background: '#0d0b09', border: '1px solid #2a241c',
                  borderRadius: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.6)', zIndex: 60, padding: 14,
                }}>
                  <p style={{ color: '#a68a4a', fontSize: 12, letterSpacing: '0.1em', marginBottom: 8, fontFamily: "'Special Elite', monospace" }}>ЛИСТ ДО ГМ</p>
                  <textarea value={messageText} onChange={e => setMessageText(e.target.value)} rows={4} placeholder="Що хочеш переказати головному гравцю?" className="mb-2" />
                  {status && <p style={{ color: '#c9a94f', fontSize: 12, marginBottom: 8 }}>{status}</p>}
                  <div className="flex gap-2">
                    <button onClick={sendMessage} disabled={!messageText.trim()} className="btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}>Надіслати</button>
                    <button onClick={() => setPanel(null)} style={{ color: '#888', background: 'none', border: '1px solid #2a241c', borderRadius: 4, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>Скасувати</button>
                  </div>
                </div>
              )}

              {panel === 'report' && (
                <div style={{
                  position: 'absolute', right: 0, top: 44, width: 280, background: '#0d0b09', border: '1px solid #2a241c',
                  borderRadius: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.6)', zIndex: 60, padding: 14,
                }}>
                  <p style={{ color: '#a68a4a', fontSize: 12, letterSpacing: '0.1em', marginBottom: 8, fontFamily: "'Special Elite', monospace" }}>СКАРГА НА ГРАВЦЯ</p>
                  <select value={reportTarget} onChange={e => setReportTarget(e.target.value)} className="mb-2">
                    <option value="">Обери гравця...</option>
                    {others.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                  <textarea value={reportReason} onChange={e => setReportReason(e.target.value)} rows={3} placeholder="Що сталось?" className="mb-2" />
                  {status && <p style={{ color: '#c9a94f', fontSize: 12, marginBottom: 8 }}>{status}</p>}
                  <div className="flex gap-2">
                    <button onClick={sendReport} disabled={!reportTarget || !reportReason.trim()} className="btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}>Надіслати</button>
                    <button onClick={() => setPanel(null)} style={{ color: '#888', background: 'none', border: '1px solid #2a241c', borderRadius: 4, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>Скасувати</button>
                  </div>
                </div>
              )}
            </div>
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

function MenuItem({ label, href, onClick, danger }: { label: string; href?: string; onClick?: () => void; danger?: boolean }) {
  const style: React.CSSProperties = {
    display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 13,
    color: danger ? '#c0392b' : '#ccc', background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: "'Special Elite', monospace", borderBottom: '1px solid #1a1712',
  }
  if (href) return <Link href={href} onClick={onClick} style={style}>{label}</Link>
  return <button onClick={onClick} style={style}>{label}</button>
}
