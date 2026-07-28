'use client'
import { useEffect, useState } from 'react'

// Matches the "X проти СК/захисту Y" tail that every d20 check in the game log ends with
// (search rolls, fatigue/flee saves, negotiation, stat checks, camp jobs...).
const ROLL_RE = /(-?\d+)\s+проти\s+(СК|захисту)\s+(\d+)/

/** Renders a game log line, animating a little d20 badge in over the roll total when the line
 *  contains one — so "13 проти СК 8" reads as an actual dice roll, not just a number in a sentence. */
export default function DiceLogLine({ text }: { text: string }) {
  const [rolled, setRolled] = useState(false)
  useEffect(() => {
    const t = requestAnimationFrame(() => setRolled(true))
    return () => cancelAnimationFrame(t)
  }, [])

  const m = ROLL_RE.exec(text)
  if (!m) return <>{text}</>

  const total = parseInt(m[1], 10)
  const target = parseInt(m[3], 10)
  const success = total >= target
  const color = success ? '#5cb87a' : '#c0392b'
  const before = text.slice(0, m.index)
  const after = text.slice(m.index + m[0].length)

  return (
    <>
      {before}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, verticalAlign: 'middle' }}>
        <span aria-hidden style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 22, height: 22, fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
          color: '#0a0a0a', background: color, borderRadius: '30%',
          transform: rolled ? 'rotate(0deg) scale(1)' : 'rotate(-120deg) scale(0.3)',
          opacity: rolled ? 1 : 0,
          transition: 'transform 0.4s cubic-bezier(.34,1.56,.64,1), opacity 0.25s ease',
        }}>{total}</span>
        <span>проти {m[2]} {target}</span>
      </span>
      {after}
    </>
  )
}
