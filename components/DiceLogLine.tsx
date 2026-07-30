'use client'
import { useEffect, useState } from 'react'

// Matches the "X проти СК/захисту Y" tail that every d20 check in the game log ends with
// (search rolls, fatigue/flee saves, negotiation, stat checks, camp jobs...).
const ROLL_RE = /(-?\d+)\s+проти\s+(СК|захисту)\s+(\d+)/

/** Cycles through random 1..sides values for `duration`ms (a real "tumble"), then locks onto
 *  `final` and flips `settled` — used to fake a physical dice roll from a single known result. */
function useTumble(final: number, sides = 20, duration = 600, tickMs = 45) {
  const [display, setDisplay] = useState(final)
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    setSettled(false)
    const interval = setInterval(() => setDisplay(1 + Math.floor(Math.random() * sides)), tickMs)
    const timeout = setTimeout(() => {
      clearInterval(interval)
      setDisplay(final)
      setSettled(true)
    }, duration)
    return () => { clearInterval(interval); clearTimeout(timeout) }
  }, [final, sides, duration, tickMs])
  return { display, settled }
}

function DiceBadge({ value, success }: { value: number; success: boolean }) {
  const { display, settled } = useTumble(value)
  const color = success ? '#5cb87a' : '#c0392b'
  const shade = success ? '#2f6b45' : '#7a2419'
  const glow = success ? 'rgba(92,184,122,0.7)' : 'rgba(192,57,43,0.7)'
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 30, height: 30, margin: '0 4px', verticalAlign: 'middle',
        fontFamily: "'Special Elite', monospace", fontSize: 14, fontWeight: 700,
        color: '#0a0a08', lineHeight: 1,
        background: `linear-gradient(155deg, ${color}, ${shade})`,
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        boxShadow: settled
          ? `0 0 0 2px rgba(0,0,0,0.55), 0 0 14px ${glow}, inset 0 1px 2px rgba(255,255,255,0.35)`
          : '0 0 0 2px rgba(0,0,0,0.55)',
        transform: settled ? 'rotate(0deg) scale(1)' : 'rotate(-22deg) scale(0.82)',
        transition: 'transform 0.35s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s ease',
      }}
    >
      {display}
    </span>
  )
}

/** Renders a game log line, animating a tumbling d20 badge over the roll total when the line
 *  contains one — so "13 проти СК 8" reads as an actual dice roll landing, not just a number. */
export default function DiceLogLine({ text }: { text: string }) {
  const m = ROLL_RE.exec(text)
  if (!m) return <>{text}</>

  const total = parseInt(m[1], 10)
  const target = parseInt(m[3], 10)
  const success = total >= target
  const before = text.slice(0, m.index)
  const after = text.slice(m.index + m[0].length)

  return (
    <>
      {before}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, verticalAlign: 'middle' }}>
        <DiceBadge value={total} success={success} />
        <span>проти {m[2]} {target}</span>
      </span>
      {after}
    </>
  )
}
