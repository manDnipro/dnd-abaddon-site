'use client'
import { Character, ClothingSlot } from '@/lib/types'
import { getItem, getItemRarity, ItemRarity, ItemType } from '@/lib/items'
import { getDurability, isBroken } from '@/lib/durability'

const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#9a9a9a', uncommon: '#5cb87a', rare: '#4a90d9', epic: '#a24ad9', legendary: '#e0a03a',
}
const SLOT_EMOJI: Record<ClothingSlot, string> = {
  head: '🪖', torso: '🦺', legs: '👖', feet: '🥾', accessory: '🔧', backpack: '🎒',
}
const TYPE_EMOJI: Record<ItemType, string> = {
  weapon_melee: '🗡️', weapon_ranged: '🔫', food: '🍫', water: '💧', medical: '💊', material: '🔩', clothing: '👕', misc: '📦',
}
// Positions as % of the panel — tuned to sit on/near the matching body part of the wireframe figure.
const SLOT_POSITION: Record<ClothingSlot, { top: string; left: string }> = {
  head: { top: '4%', left: '50%' },
  backpack: { top: '8%', left: '86%' },
  torso: { top: '30%', left: '50%' },
  accessory: { top: '46%', left: '14%' },
  legs: { top: '62%', left: '50%' },
  feet: { top: '92%', left: '50%' },
}

function EquipSlot({
  itemName, color, broken, emoji, disabled, onClick, label,
}: {
  itemName: string | null; color: string; broken: boolean; emoji: string; disabled?: boolean; onClick?: () => void; label: string
}) {
  return (
    <button
      disabled={disabled || !itemName}
      onClick={onClick}
      title={itemName ? `${itemName} — зняти` : `${label}: порожньо`}
      style={{
        width: 36, height: 36, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, cursor: itemName && !disabled ? 'pointer' : 'default',
        background: '#0a0a0a',
        border: `1px solid ${itemName ? (broken ? '#c0392b' : color) : '#3a3a3a'}`,
        boxShadow: itemName ? `0 0 8px ${color}40, inset 0 0 6px ${color}20` : 'none',
        opacity: itemName ? 1 : 0.5,
      }}>
      {emoji}
    </button>
  )
}

export default function EquipmentSilhouette({
  character, onUnequip, disabled,
}: {
  character: Character
  onUnequip: (slot: ClothingSlot) => void
  disabled?: boolean
}) {
  const carried = character.inventory.filter(s => {
    const it = getItem(s.itemId)
    return it && it.type !== 'clothing'
  }).slice(0, 4)

  return (
    <div style={{ background: '#050505', border: '1px solid #2a2a2a', borderRadius: 4, padding: '10px 12px 14px', maxWidth: 260, margin: '0 auto' }}>
      <p style={{
        textAlign: 'center', color: '#888', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
        borderBottom: '1px solid #222', paddingBottom: 8, marginBottom: 8,
      }}>
        Спорядження
      </p>

      <div style={{ position: 'relative', width: '100%', aspectRatio: '220 / 340' }}>
        <svg viewBox="0 0 220 340" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.4 }}>
          <circle cx="110" cy="34" r="22" fill="none" stroke="#555" strokeWidth="1.5" />
          <line x1="110" y1="56" x2="110" y2="120" stroke="#555" strokeWidth="1.5" />
          <line x1="110" y1="70" x2="60" y2="150" stroke="#555" strokeWidth="1.5" />
          <line x1="110" y1="70" x2="160" y2="150" stroke="#555" strokeWidth="1.5" />
          <path d="M75,70 Q110,58 145,70 L155,175 Q110,190 65,175 Z" fill="none" stroke="#555" strokeWidth="1.5" />
          <line x1="90" y1="188" x2="80" y2="300" stroke="#555" strokeWidth="1.5" />
          <line x1="130" y1="188" x2="140" y2="300" stroke="#555" strokeWidth="1.5" />
        </svg>

        {(Object.keys(SLOT_POSITION) as ClothingSlot[]).map(slot => {
          const itemId = character.equipped[slot]
          const item = itemId ? getItem(itemId) : undefined
          const color = item ? RARITY_COLORS[getItemRarity(item)] : '#3a3a3a'
          const broken = Boolean(itemId && isBroken(getDurability(character, itemId)))
          const pos = SLOT_POSITION[slot]
          return (
            <div key={slot} style={{ position: 'absolute', top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}>
              <EquipSlot
                itemName={item?.name ?? null} color={color} broken={broken} emoji={SLOT_EMOJI[slot]}
                disabled={disabled} onClick={() => item && onUnequip(slot)} label={slot}
              />
            </div>
          )
        })}
      </div>

      <p style={{
        textAlign: 'center', color: '#888', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
        borderTop: '1px solid #222', borderBottom: '1px solid #222', padding: '8px 0', margin: '10px 0 8px',
      }}>
        Hotbar
      </p>
      <div className="flex justify-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => {
          const stack = carried[i]
          const item = stack ? getItem(stack.itemId) : undefined
          const color = item ? RARITY_COLORS[getItemRarity(item)] : '#3a3a3a'
          return (
            <div key={i} title={item?.name} style={{
              position: 'relative', width: 32, height: 32, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, background: '#0a0a0a', border: `1px solid ${item ? color : '#2a2a2a'}`, opacity: item ? 1 : 0.4,
            }}>
              {item && TYPE_EMOJI[item.type]}
              {stack && stack.qty > 1 && (
                <span style={{ position: 'absolute', bottom: -1, right: 1, fontSize: 9, color: '#ccc' }}>{stack.qty}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
