'use client'
import { useState } from 'react'

/** Small collapsible explainer so players understand the D&D-style d20 system driving every roll
 *  in the game log — nothing here decides outcomes on its own, dice do. */
export default function DiceRulesInfo() {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginBottom: 14 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: 'none', border: '1px solid #3a1010', color: '#a68a4a', borderRadius: 4,
        padding: '3px 10px', fontSize: 11, cursor: 'pointer', fontFamily: "'Special Elite', monospace",
      }}>
        🎲 Як працюють кидки?{open ? ' ▲' : ' ▼'}
      </button>
      {open && (
        <div style={{ marginTop: 8, padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a241c', borderRadius: 4 }}>
          <p style={{ color: '#999', fontSize: 12, lineHeight: 1.7, fontFamily: "'Special Elite', monospace" }}>
            Усе в грі вирішує кубик d20 (20-гранний), як у класичному D&D. До кидка додається модифікатор
            характеристики (значення стату − 3), і якщо сума ≥ за СК (складність) чи захист ворога — успіх.
            Природна 20 на кубику — завжди крит (подвійна шкода), природна 1 — завжди провал, незалежно від бонусів.
            Зелена цифра в журналі — успішний кидок, червона — невдалий.
          </p>
        </div>
      )}
    </div>
  )
}
