'use client'
import { Character, ClothingSlot } from '@/lib/types'
import { getItem, getItemRarity, ItemRarity } from '@/lib/items'
import { getDurability, isBroken } from '@/lib/durability'

const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#9a9a9a', uncommon: '#5cb87a', rare: '#4a90d9', epic: '#a24ad9', legendary: '#e0a03a',
}
const SLOT_EMOJI: Record<ClothingSlot, string> = {
  head: '🧢', torso: '👕', legs: '👖', feet: '👢', accessory: '💍', backpack: '🎒',
}
// Positions as % of the silhouette's bounding box — tuned to sit roughly on the matching body part.
const SLOT_POSITION: Record<ClothingSlot, { top: string; left: string }> = {
  head: { top: '6%', left: '50%' },
  accessory: { top: '24%', left: '78%' },
  torso: { top: '32%', left: '50%' },
  backpack: { top: '32%', left: '22%' },
  legs: { top: '62%', left: '50%' },
  feet: { top: '92%', left: '50%' },
}

export default function EquipmentSilhouette({
  character, onUnequip, disabled,
}: {
  character: Character
  onUnequip: (slot: ClothingSlot) => void
  disabled?: boolean
}) {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 220, margin: '0 auto', aspectRatio: '220 / 400' }}>
      <svg viewBox="0 0 220 400" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <circle cx="110" cy="38" r="30" fill="#161310" stroke="#2a241c" strokeWidth="2" />
        <polygon points="70,70 150,70 165,205 55,205" fill="#161310" stroke="#2a241c" strokeWidth="2" />
        <rect x="60" y="205" width="42" height="140" rx="10" fill="#161310" stroke="#2a241c" strokeWidth="2" />
        <rect x="118" y="205" width="42" height="140" rx="10" fill="#161310" stroke="#2a241c" strokeWidth="2" />
        <ellipse cx="81" cy="360" rx="26" ry="14" fill="#161310" stroke="#2a241c" strokeWidth="2" />
        <ellipse cx="139" cy="360" rx="26" ry="14" fill="#161310" stroke="#2a241c" strokeWidth="2" />
      </svg>

      {(Object.keys(SLOT_POSITION) as ClothingSlot[]).map(slot => {
        const itemId = character.equipped[slot]
        const item = itemId ? getItem(itemId) : undefined
        const color = item ? RARITY_COLORS[getItemRarity(item)] : '#3a3428'
        const broken = itemId && isBroken(getDurability(character, itemId))
        const pos = SLOT_POSITION[slot]
        return (
          <button
            key={slot}
            disabled={disabled || !item}
            onClick={() => item && onUnequip(slot)}
            title={item ? `${item.name} — зняти` : `${slot}: порожньо`}
            style={{
              position: 'absolute', top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)',
              width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, cursor: item && !disabled ? 'pointer' : 'default',
              background: item ? 'rgba(20,17,13,0.9)' : 'rgba(10,10,10,0.6)',
              border: `2px solid ${broken ? '#c0392b' : color}`,
              boxShadow: item ? `0 0 10px ${color}55` : 'none',
            }}>
            {SLOT_EMOJI[slot]}
          </button>
        )
      })}
    </div>
  )
}
