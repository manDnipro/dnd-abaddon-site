'use client'
import { useEffect, useState } from 'react'
import { Character } from '@/lib/types'
import { getItem, estimateTradeValue } from '@/lib/items'

type Trader = { id: string; name: string; tradeLevel: number; stock: { itemKey: string; quantity: number }[]; trust: number }

export default function TradePage() {
  const [character, setCharacter] = useState<Character | null | undefined>(undefined)
  const [traders, setTraders] = useState<Trader[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [wantItem, setWantItem] = useState<string>('')
  const [wantQty, setWantQty] = useState(1)
  const [giveItem, setGiveItem] = useState<string>('')
  const [giveQty, setGiveQty] = useState(1)
  const [log, setLog] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    const [c, t] = await Promise.all([
      fetch('/api/character/mine').then(r => r.json()),
      fetch('/api/trade/npc').then(r => r.json()),
    ])
    setCharacter(c.character)
    setTraders(t)
  }
  useEffect(() => { load() }, [])

  async function submitTrade(npcId: string) {
    if (!wantItem || !giveItem) { setError('Обери що хочеш отримати і що готовий віддати'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/trade/npc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ npcId, wantItemId: wantItem, wantQty, giveItemId: giveItem, giveQty }),
    })
    const d = await res.json()
    setLoading(false)
    if (!res.ok) { setError(d.error || 'Помилка'); return }
    setLog(l => [...d.log, ...l])
    setCharacter(d.character)
    await load()
  }

  if (character === undefined) return <p style={{ color: '#555' }}>Шукаю, хто ще торгує...</p>
  if (character === null) return <p style={{ color: '#888' }}>Нема кому міняти — спершу створи персонажа.</p>
  if (character.status !== 'approved') return <p style={{ color: '#888' }}>Тобі ще не довіряють настільки, щоб торгувати.</p>

  return (
    <div>
      <h1 style={{ color: '#e5e5e5', fontSize: 24, marginBottom: 4 }}>Хто що міняє</h1>
      <p style={{ color: '#666', marginBottom: 20, fontSize: 13 }}>Кожен тут виживає по-своєму. Запропонуй чесно — і, може, домовитесь.</p>

      {error && <p style={{ color: '#c0392b', marginBottom: 16 }}>🚫 {error}</p>}

      <div className="flex flex-col gap-3 mb-6">
        {traders.map(trader => (
          <div key={trader.id} className="card">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpanded(expanded === trader.id ? null : trader.id)}>
              <div>
                <span style={{ color: '#e5e5e5', fontSize: 15 }}>{trader.name}</span>
                <span style={{ color: '#666', fontSize: 11, marginLeft: 8 }}>довіра: {trader.trust}</span>
              </div>
              <span style={{ color: '#a68a4a', fontSize: 12 }}>{expanded === trader.id ? '▲' : '▼'}</span>
            </div>

            {expanded === trader.id && (
              <div className="mt-4">
                <p style={{ color: '#c9a227', fontSize: 13, marginBottom: 8 }}>Що в нього є</p>
                <div className="flex flex-col gap-1 mb-4">
                  {trader.stock.map(s => {
                    const item = getItem(s.itemKey)
                    return (
                      <label key={s.itemKey} className="flex items-center gap-2" style={{ fontSize: 13, color: wantItem === s.itemKey ? '#c9a94f' : '#ccc' }}>
                        <input type="radio" name="want" checked={wantItem === s.itemKey} onChange={() => { setWantItem(s.itemKey); setWantQty(1) }} style={{ width: 'auto' }} />
                        {item?.name ?? s.itemKey} ×{s.quantity} <span style={{ color: '#555' }}>(цінність ~{estimateTradeValue(item!)})</span>
                      </label>
                    )
                  })}
                </div>
                {wantItem && (
                  <div className="flex items-center gap-2 mb-4">
                    <span style={{ color: '#888', fontSize: 12 }}>Кількість:</span>
                    <input type="number" min={1} max={trader.stock.find(s => s.itemKey === wantItem)?.quantity ?? 1}
                      value={wantQty} onChange={e => setWantQty(Math.max(1, parseInt(e.target.value) || 1))} style={{ width: 70 }} />
                  </div>
                )}

                <p style={{ color: '#c9a227', fontSize: 13, marginBottom: 8 }}>Чим готовий поступитись</p>
                <div className="flex flex-col gap-1 mb-4">
                  {character.inventory.map(s => {
                    const item = getItem(s.itemId)
                    if (!item) return null
                    return (
                      <label key={s.itemId} className="flex items-center gap-2" style={{ fontSize: 13, color: giveItem === s.itemId ? '#c9a94f' : '#ccc' }}>
                        <input type="radio" name="give" checked={giveItem === s.itemId} onChange={() => { setGiveItem(s.itemId); setGiveQty(1) }} style={{ width: 'auto' }} />
                        {item.name} ×{s.qty} <span style={{ color: '#555' }}>(цінність ~{estimateTradeValue(item)})</span>
                      </label>
                    )
                  })}
                </div>
                {giveItem && (
                  <div className="flex items-center gap-2 mb-4">
                    <span style={{ color: '#888', fontSize: 12 }}>Кількість:</span>
                    <input type="number" min={1} max={character.inventory.find(s => s.itemId === giveItem)?.qty ?? 1}
                      value={giveQty} onChange={e => setGiveQty(Math.max(1, parseInt(e.target.value) || 1))} style={{ width: 70 }} />
                  </div>
                )}

                <button onClick={() => submitTrade(trader.id)} disabled={loading} className="btn-primary">Спробувати домовитись</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {log.length > 0 && (
        <div className="card" style={{ borderColor: '#3a1010' }}>
          <p style={{ fontFamily: "'Special Elite', monospace", fontSize: 11, color: '#a68a4a', letterSpacing: '0.2em', marginBottom: 14 }}>ПЕРЕГОВОРИ</p>
          <div className="flex flex-col gap-2">
            {log.map((line, i) => <p key={i} style={{ color: '#c9c4ba', fontSize: 13, lineHeight: 1.6, fontFamily: "'Special Elite', monospace" }}>{line}</p>)}
          </div>
        </div>
      )}
    </div>
  )
}
