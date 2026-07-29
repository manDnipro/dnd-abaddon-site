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

// The 12-position paper-doll layout the player drew: 3 rows of side squares flanking the torso, a
// head square, a chest square, a waist square (between the two hand circles), a pelvis square, and
// a feet square. Only 6 of these map to gear the game actually tracks — the rest are drawn dim/
// locked ("🔒 заплановано") rather than hidden, so the panel matches the reference 1:1 but doesn't
// pretend to have interactive slots for categories the game doesn't have yet.
type SlotShape = 'square' | 'circle'
interface LayoutSlot { top: string; left: string; shape: SlotShape; clothingSlot: ClothingSlot | null }
const LAYOUT: LayoutSlot[] = [
  { top: '4%', left: '18%', shape: 'square', clothingSlot: null },
  { top: '4%', left: '50%', shape: 'square', clothingSlot: 'head' },
  { top: '4%', left: '82%', shape: 'square', clothingSlot: 'backpack' },

  { top: '25%', left: '18%', shape: 'square', clothingSlot: null },
  { top: '25%', left: '50%', shape: 'square', clothingSlot: 'torso' },
  { top: '25%', left: '82%', shape: 'square', clothingSlot: null },

  { top: '46%', left: '15%', shape: 'circle', clothingSlot: null },
  { top: '46%', left: '50%', shape: 'square', clothingSlot: 'accessory' },
  { top: '46%', left: '85%', shape: 'circle', clothingSlot: null },

  { top: '66%', left: '18%', shape: 'square', clothingSlot: null },
  { top: '66%', left: '50%', shape: 'square', clothingSlot: 'legs' },
  { top: '66%', left: '82%', shape: 'square', clothingSlot: null },

  { top: '90%', left: '50%', shape: 'square', clothingSlot: 'feet' },
]

function EquipSlot({
  itemName, color, broken, emoji, shape, disabled, onClick,
}: {
  itemName: string | null; color: string; broken: boolean; emoji: string | null; shape: SlotShape; disabled?: boolean; onClick?: () => void
}) {
  const locked = emoji === null
  return (
    <button
      disabled={disabled || !itemName || locked}
      onClick={onClick}
      title={locked ? 'Заплановано на майбутнє' : itemName ? `${itemName} — зняти` : 'порожньо'}
      style={{
        width: 34, height: 34, borderRadius: shape === 'circle' ? '50%' : 3,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, cursor: itemName && !disabled ? 'pointer' : 'default',
        background: '#0a0a0a',
        border: `1px solid ${locked ? '#221f1a' : itemName ? (broken ? '#c0392b' : color) : '#3a3a3a'}`,
        boxShadow: itemName ? `0 0 8px ${color}40, inset 0 0 6px ${color}20` : 'none',
        opacity: locked ? 0.35 : itemName ? 1 : 0.55,
      }}>
      {locked ? '🔒' : emoji}
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
  }).slice(0, 5)

  return (
    <div style={{ background: '#050505', border: '1px solid #2a2a2a', borderRadius: 4, padding: '10px 12px 14px', maxWidth: 300, margin: '0 auto' }}>
      <p style={{
        textAlign: 'center', color: '#888', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
        borderBottom: '1px solid #222', paddingBottom: 8, marginBottom: 10,
      }}>
        Спорядження
      </p>

      <div style={{ position: 'relative', width: '100%', aspectRatio: '260 / 340' }}>
        <svg viewBox="0 0 260 340" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.35 }}>
          <circle cx="130" cy="26" r="18" fill="none" stroke="#666" strokeWidth="1.5" />
          <path d="M130,44 L130,58" stroke="#666" strokeWidth="1.5" fill="none" />
          <path d="M95,66 Q130,52 165,66 L172,150 Q130,168 88,150 Z" fill="none" stroke="#666" strokeWidth="1.5" />
          <path d="M95,66 L60,110 Q52,145 62,160" fill="none" stroke="#666" strokeWidth="1.5" />
          <path d="M165,66 L200,110 Q208,145 198,160" fill="none" stroke="#666" strokeWidth="1.5" />
          <path d="M105,168 L98,300 L112,300 L118,220" fill="none" stroke="#666" strokeWidth="1.5" />
          <path d="M155,168 L162,300 L148,300 L142,220" fill="none" stroke="#666" strokeWidth="1.5" />
        </svg>

        {LAYOUT.map((pos, i) => {
          const slot = pos.clothingSlot
          const itemId = slot ? character.equipped[slot] : null
          const item = itemId ? getItem(itemId) : undefined
          const color = item ? RARITY_COLORS[getItemRarity(item)] : '#3a3a3a'
          const broken = Boolean(itemId && isBroken(getDurability(character, itemId)))
          return (
            <div key={i} style={{ position: 'absolute', top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}>
              <EquipSlot
                itemName={item?.name ?? null} color={color} broken={broken}
                emoji={slot ? SLOT_EMOJI[slot] : null} shape={pos.shape}
                disabled={disabled} onClick={() => slot && item && onUnequip(slot)}
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
        {Array.from({ length: 5 }).map((_, i) => {
          const stack = carried[i]
          const item = stack ? getItem(stack.itemId) : undefined
          const color = item ? RARITY_COLORS[getItemRarity(item)] : '#3a3a3a'
          return (
            <div key={i} title={item?.name} style={{
              position: 'relative', width: 30, height: 30, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, background: '#0a0a0a', border: `1px solid ${item ? color : '#2a2a2a'}`, opacity: item ? 1 : 0.4,
            }}>
              {item && TYPE_EMOJI[item.type]}
              {stack && stack.qty > 1 && (
                <span style={{ position: 'absolute', bottom: -1, right: 1, fontSize: 8, color: '#ccc' }}>{stack.qty}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
