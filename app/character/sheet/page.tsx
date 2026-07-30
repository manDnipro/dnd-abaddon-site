'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Character, StatKey, ClothingSlot, statModifier, formatModifier } from '@/lib/types'
import { getItem, getItemRarity, CLOTHING_SLOT_LABELS } from '@/lib/items'
import { getDurability, isBroken } from '@/lib/durability'
import { xpProgress, levelTitle } from '@/lib/levels'
import { reputationTier } from '@/lib/reputation'
import { characterTitle } from '@/lib/characterTitle'

const RARITY_COLORS: Record<string, string> = {
  common: '#9a9a9a', uncommon: '#5cb87a', rare: '#4a90d9', epic: '#a24ad9', legendary: '#e0a03a',
}
const SLOT_EMOJI: Record<ClothingSlot, string> = {
  head: '🪖', torso: '🦺', legs: '👖', feet: '🥾', accessory: '🔧', backpack: '🎒',
}
const STAT_ORDER: StatKey[] = ['str', 'agi', 'end', 'per', 'int']

// Every position below was pixel-measured off public/sheet/Anketa1.png (1149×1369) as a % of the
// image's own width/height, same technique as EquipmentSilhouette — see that component for the
// full crop → grid-read → draw-back-verify workflow. Re-measure from the source image if it's ever
// replaced, don't eyeball new numbers.
const POS = {
  avatar: { top: '6.94%', left: '8.27%', width: '21.76%', height: '24.11%' },
  nameBar: { top: '4.02%', left: '34.81%', width: '40.47%', height: '5.84%' },
  chaBar: { top: '10.96%', left: '34.81%', width: '42.21%', height: '3.29%' },
  bars: {
    hp: { top: '38.28%' }, hunger: { top: '42.37%' }, thirst: { top: '46.17%' },
    infection: { top: '49.96%' }, morale: { top: '53.76%' }, reputation: { top: '57.56%' },
  },
  barCommon: { left: '11.31%', width: '40.47%', height: '2.05%' },
  slots: {
    head: { top: '41.27%', left: '57.01%' }, torso: { top: '41.27%', left: '83.12%' },
    legs: { top: '51.50%', left: '57.01%' }, backpack: { top: '51.50%', left: '83.12%' },
    feet: { top: '60.26%', left: '57.01%' }, accessory: { top: '60.26%', left: '83.12%' },
  },
  slotSize: { width: '6.96%', height: '5.84%' },
  box: { expeditions: '7.83%', kills: '34.81%', saved: '61.79%' },
  boxCommon: { top: '70.85%', width: '24.37%', height: '8.77%' },
  bio: { top: '84.00%', left: '7.83%', width: '81.81%', height: '9.86%' },
}
const STAT_COLS: Record<StatKey, string> = { str: '37.42%', agi: '49.78%', end: '62.32%', per: '74.85%', int: '87.21%', cha: '' }
const STAT_CIRCLE = { top: '21.91%', width: '7.14%', height: '6.57%' }
const STAT_RECT = { top: '29.58%', width: '7.14%', height: '3.65%' }

const pct = (s: string) => parseFloat(s)

// The overlay copy of the sheet (laid on top so torn edges/tape/grime overlap the frame naturally
// — see the <Image> at the bottom of the component) must NOT cover any of the pockets above, or it
// hides the icons/numbers sitting in them. Punch a hole in it at every pocket via an SVG luminance
// mask (white = visible, black = hidden) built straight from the same POS numbers so it can't drift
// out of sync with where the content actually is. A small pad extends each hole past its measured
// edge — better to expose a sliver of otherwise-hidden decoration than clip a digit.
const MASK_HOLES: { top: number; left: number; width: number; height: number }[] = [
  { ...POS.avatar, top: pct(POS.avatar.top), left: pct(POS.avatar.left), width: pct(POS.avatar.width), height: pct(POS.avatar.height) },
  { top: pct(POS.nameBar.top), left: pct(POS.nameBar.left), width: pct(POS.nameBar.width), height: pct(POS.nameBar.height) },
  { top: pct(POS.chaBar.top), left: pct(POS.chaBar.left), width: pct(POS.chaBar.width), height: pct(POS.chaBar.height) },
  ...Object.values(POS.bars).map(b => ({ top: pct(b.top), left: pct(POS.barCommon.left), width: pct(POS.barCommon.width), height: pct(POS.barCommon.height) })),
  ...Object.values(POS.slots).map(s => ({ top: pct(s.top), left: pct(s.left), width: pct(POS.slotSize.width), height: pct(POS.slotSize.height) })),
  ...Object.values(POS.box).map(left => ({ top: pct(POS.boxCommon.top), left: pct(left), width: pct(POS.boxCommon.width), height: pct(POS.boxCommon.height) })),
  { top: pct(POS.bio.top), left: pct(POS.bio.left), width: pct(POS.bio.width), height: pct(POS.bio.height) },
  ...STAT_ORDER.map(k => ({ top: pct(STAT_CIRCLE.top), left: pct(STAT_COLS[k]), width: pct(STAT_CIRCLE.width), height: pct(STAT_CIRCLE.height) })),
  ...STAT_ORDER.map(k => ({ top: pct(STAT_RECT.top), left: pct(STAT_COLS[k]), width: pct(STAT_RECT.width), height: pct(STAT_RECT.height) })),
]

function overlayMaskDataUri(): string {
  const pad = 1.2
  const rects = MASK_HOLES.map(h =>
    `<rect x="${h.left - pad}" y="${h.top - pad}" width="${h.width + pad * 2}" height="${h.height + pad * 2}" fill="black" />`
  ).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">`
    + `<rect x="0" y="0" width="100" height="100" fill="white" />${rects}</svg>`
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`
}
const OVERLAY_MASK = overlayMaskDataUri()

export default function CharacterSheetPage() {
  const [character, setCharacter] = useState<Character | null | undefined>(undefined)

  useEffect(() => {
    fetch('/api/character/mine').then(r => r.json()).then(d => setCharacter(d.character))
  }, [])

  if (character === undefined) return <p style={{ color: '#555' }}>Гортаю особову справу...</p>
  if (character === null) return <p style={{ color: '#888' }}>Нема на кого дивитись.</p>

  const xp = xpProgress(character.xp)
  const repTier = reputationTier(character.reputation)

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 620, margin: '0 auto', aspectRatio: '1149 / 1369' }}>
      <Image src="/sheet/Anketa1.png" alt="Картка персонажа" fill style={{ objectFit: 'contain' }} sizes="620px" priority />

      <Box pos={POS.avatar}>
        {character.avatar ? (
          <Image src={character.avatar} alt={character.name} fill style={{ objectFit: 'cover' }} />
        ) : null}
      </Box>

      <Box pos={POS.nameBar} center>
        <span style={{ color: '#e5d9c3', fontFamily: "'Special Elite', monospace", fontSize: 'clamp(11px, 3.2vw, 20px)', fontWeight: 700, letterSpacing: '0.04em', textAlign: 'center', padding: '0 8%' }}>
          {character.name}{character.dead ? ' ☠️' : ''} — {characterTitle(character.stats)}
        </span>
      </Box>

      <Box pos={POS.chaBar} center>
        <span style={{ color: '#c9b98a', fontFamily: "'Special Elite', monospace", fontSize: 'clamp(9px, 2.4vw, 14px)', textAlign: 'center' }}>
          ✨ Харизма: {character.stats.cha} ({formatModifier(statModifier(character.stats.cha))}) · {levelTitle(xp.level)}
        </span>
      </Box>

      {STAT_ORDER.map(k => (
        <div key={k}>
          <Box pos={{ top: STAT_CIRCLE.top, left: STAT_COLS[k], width: STAT_CIRCLE.width, height: STAT_CIRCLE.height }} center round>
            <span style={{ color: '#e5d9c3', fontSize: 'clamp(14px, 4vw, 26px)', fontWeight: 700, fontFamily: "'Special Elite', monospace" }}>{character.stats[k]}</span>
          </Box>
          <Box pos={{ top: STAT_RECT.top, left: STAT_COLS[k], width: STAT_RECT.width, height: STAT_RECT.height }} center>
            <span style={{ color: '#9a8f7a', fontSize: 'clamp(8px, 2vw, 12px)', fontFamily: "'Special Elite', monospace" }}>{formatModifier(statModifier(character.stats[k]))}</span>
          </Box>
        </div>
      ))}

      <FillBar pos={POS.bars.hp} value={character.hp} max={character.maxHp} color="#b04a3a" />
      <FillBar pos={POS.bars.hunger} value={character.hunger} max={100} color="#a68a4a" />
      <FillBar pos={POS.bars.thirst} value={character.thirst} max={100} color="#3a7ab0" />
      <FillBar pos={POS.bars.infection} value={character.infection} max={100} color="#8e44ad" />
      <FillBar pos={POS.bars.morale} value={character.morale} max={100} color="#7a9c4a" />
      <FillBar pos={POS.bars.reputation} value={character.reputation} max={100} color="#c9a227" label={repTier.label} />

      {(Object.keys(POS.slots) as ClothingSlot[]).map(slot => {
        const equippedId = character.equipped[slot]
        const item = equippedId ? getItem(equippedId) : undefined
        const color = item ? RARITY_COLORS[getItemRarity(item)] : '#555'
        const broken = Boolean(equippedId && isBroken(getDurability(character, equippedId)))
        return (
          <Box key={slot} pos={{ ...POS.slots[slot], width: POS.slotSize.width, height: POS.slotSize.height }} center>
            <span title={item ? item.name : CLOTHING_SLOT_LABELS[slot]} style={{
              fontSize: 'clamp(16px, 4.5vw, 30px)', filter: item ? 'none' : 'grayscale(1) brightness(0.5)',
              textShadow: item ? `0 0 6px ${broken ? '#c0392b' : color}` : 'none', opacity: item ? 1 : 0.35,
            }}>
              {SLOT_EMOJI[slot]}
            </span>
          </Box>
        )
      })}

      <Box pos={{ top: POS.boxCommon.top, left: POS.box.expeditions, width: POS.boxCommon.width, height: POS.boxCommon.height }} center>
        <span style={{ color: '#e5d9c3', fontSize: 'clamp(20px, 6vw, 40px)', fontWeight: 700, fontFamily: "'Special Elite', monospace" }}>{character.expeditionsCompleted}</span>
      </Box>
      <Box pos={{ top: POS.boxCommon.top, left: POS.box.kills, width: POS.boxCommon.width, height: POS.boxCommon.height }} center>
        <span style={{ color: '#e5d9c3', fontSize: 'clamp(20px, 6vw, 40px)', fontWeight: 700, fontFamily: "'Special Elite', monospace" }}>{character.zombiesKilled}</span>
      </Box>
      <Box pos={{ top: POS.boxCommon.top, left: POS.box.saved, width: POS.boxCommon.width, height: POS.boxCommon.height }} center>
        <span style={{ color: '#e5d9c3', fontSize: 'clamp(20px, 6vw, 40px)', fontWeight: 700, fontFamily: "'Special Elite', monospace" }}>{character.playersSaved}</span>
      </Box>

      <Box pos={POS.bio}>
        <p style={{
          color: '#2a2318', fontSize: 'clamp(9px, 2.1vw, 13px)', lineHeight: 1.8, fontFamily: "'Special Elite', monospace",
          padding: '4% 3%', overflowY: 'auto', height: '100%', width: '100%',
        }}>
          {character.bio || '—'}
        </p>
      </Box>

      {/* The "pockets" in the artwork are truly transparent (alpha 0), not a black fill — so the
          same image laid down again on top of every field lets the paper's torn edges, tape, and
          grime naturally overlap the content instead of the content sitting flatly over a clean
          rectangle. Everything else on the sheet is interactive-free, but this one specifically
          must not eat clicks/scroll meant for the bio textarea underneath it. */}
      <Image
        src="/sheet/Anketa1.png" alt="" aria-hidden fill sizes="620px"
        style={{
          objectFit: 'contain', pointerEvents: 'none',
          maskImage: OVERLAY_MASK, WebkitMaskImage: OVERLAY_MASK,
          maskSize: '100% 100%', WebkitMaskSize: '100% 100%',
          maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
        }}
      />
    </div>
  )
}

function Box({ pos, children, center, round }: { pos: { top: string; left: string; width: string; height: string }; children: React.ReactNode; center?: boolean; round?: boolean }) {
  return (
    <div style={{
      position: 'absolute', top: pos.top, left: pos.left, width: pos.width, height: pos.height,
      display: center ? 'flex' : undefined, alignItems: center ? 'center' : undefined, justifyContent: center ? 'center' : undefined,
      overflow: 'hidden', borderRadius: round ? '50%' : 0,
    }}>
      {children}
    </div>
  )
}

function FillBar({ pos, value, max, color, label }: { pos: { top: string }; value: number; max: number; color: string; label?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div style={{ position: 'absolute', top: pos.top, left: POS.barCommon.left, width: POS.barCommon.width, height: POS.barCommon.height, display: 'flex', alignItems: 'center' }}>
      {/* A faint track background + border so a near-empty bar (low hunger/thirst, 0 infection) still
          reads as "a bar that's mostly empty" rather than looking like nothing rendered at all. */}
      <div style={{
        width: '100%', height: '55%', borderRadius: 8, overflow: 'hidden',
        background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.15)', boxSizing: 'border-box',
      }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{
        position: 'absolute', right: '2%', color: '#fff', fontSize: 'clamp(8px, 1.9vw, 12px)', fontWeight: 700,
        fontFamily: "'Special Elite', monospace",
        textShadow: '0 0 2px #000, 0 0 2px #000, 0 0 4px #000, 1px 1px 1px #000, -1px -1px 1px #000',
      }}>
        {value}/{max}{label ? ` · ${label}` : ''}
      </span>
    </div>
  )
}
