'use client'
import Image from 'next/image'
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

// Positions measured pixel-for-pixel off the player's second (transparent-PNG) template —
// public/equipment/silhouette.png, cropped to just the drawn panel and upscaled 3x, 579×888 — as %
// of the image's own width/height so they stay aligned at any render size. This version has 13 body
// slots (an extra chest square the first drawing didn't have) + a waist square; only 6 map to gear
// the game actually tracks, the rest render as dim, permanently-disabled 🔒 placeholders.
type SlotShape = 'square' | 'circle'
interface LayoutSlot { top: string; left: string; shape: SlotShape; clothingSlot: ClothingSlot | null }
const LAYOUT: LayoutSlot[] = [
  { top: '14.7%', left: '54.1%', shape: 'square', clothingSlot: 'head' },
  { top: '17.2%', left: '35.9%', shape: 'square', clothingSlot: null },
  { top: '17.2%', left: '71.8%', shape: 'square', clothingSlot: 'backpack' },

  { top: '25.5%', left: '54.1%', shape: 'square', clothingSlot: 'torso' },
  { top: '28.7%', left: '34.0%', shape: 'square', clothingSlot: null },
  { top: '28.7%', left: '73.8%', shape: 'square', clothingSlot: null },

  { top: '40.0%', left: '54.1%', shape: 'square', clothingSlot: 'accessory' },
  { top: '44.0%', left: '35.9%', shape: 'circle', clothingSlot: null },
  { top: '44.0%', left: '71.8%', shape: 'circle', clothingSlot: null },

  { top: '55.3%', left: '54.1%', shape: 'square', clothingSlot: 'legs' },
  { top: '56.2%', left: '35.8%', shape: 'square', clothingSlot: null },
  { top: '56.2%', left: '71.8%', shape: 'square', clothingSlot: null },

  { top: '69.3%', left: '54.1%', shape: 'square', clothingSlot: 'feet' },
]
const HOTBAR_X = ['28.7%', '41.8%', '55.1%', '67.9%', '81.0%']
const HOTBAR_Y = '88.3%'
const SLOT_SIZE = '12.5%'
const HOTBAR_SIZE = '12.5%'

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
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        transform: 'translate(-50%, -50%)', borderRadius: shape === 'circle' ? '50%' : '12%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '52%', cursor: itemName && !disabled ? 'pointer' : 'default',
        background: locked ? 'transparent' : itemName ? 'rgba(4,4,4,0.92)' : 'transparent',
        border: locked ? 'none' : `1.5px solid ${itemName ? (broken ? '#c0392b' : color) : 'transparent'}`,
        boxShadow: itemName ? '0 2px 5px rgba(0,0,0,0.7)' : 'none',
        opacity: locked ? 0 : itemName ? 1 : 0,
      }}>
      {locked ? '' : emoji}
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
    <div style={{ position: 'relative', width: '100%', maxWidth: 300, margin: '0 auto', aspectRatio: '579 / 888' }}>
      <Image src="/equipment/silhouette.png" alt="Спорядження" fill style={{ objectFit: 'contain' }} sizes="300px" />

      {LAYOUT.map((pos, i) => {
        const slot = pos.clothingSlot
        const itemId = slot ? character.equipped[slot] : null
        const item = itemId ? getItem(itemId) : undefined
        const color = item ? RARITY_COLORS[getItemRarity(item)] : '#3a3a3a'
        const broken = Boolean(itemId && isBroken(getDurability(character, itemId)))
        return (
          <div key={i} style={{ position: 'absolute', top: pos.top, left: pos.left, width: SLOT_SIZE, aspectRatio: '1' }}>
            <EquipSlot
              itemName={item?.name ?? null} color={color} broken={broken}
              emoji={slot ? SLOT_EMOJI[slot] : null} shape={pos.shape}
              disabled={disabled} onClick={() => slot && item && onUnequip(slot)}
            />
          </div>
        )
      })}

      {HOTBAR_X.map((left, i) => {
        const stack = carried[i]
        const item = stack ? getItem(stack.itemId) : undefined
        const color = item ? RARITY_COLORS[getItemRarity(item)] : '#3a3a3a'
        return (
          <div key={i} title={item?.name} style={{
            position: 'absolute', top: HOTBAR_Y, left, width: HOTBAR_SIZE, aspectRatio: '1', transform: 'translate(-50%, -50%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '42%',
            background: item ? 'rgba(4,4,4,0.92)' : 'transparent', borderRadius: '12%',
            border: item ? `1.5px solid ${color}` : 'none', boxShadow: item ? '0 2px 5px rgba(0,0,0,0.7)' : 'none',
          }}>
            {item && TYPE_EMOJI[item.type]}
            {stack && stack.qty > 1 && (
              <span style={{ position: 'absolute', bottom: '2%', right: '6%', fontSize: '11px', color: '#ccc' }}>{stack.qty}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
