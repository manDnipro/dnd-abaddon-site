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

// Positions measured pixel-for-pixel off the player-supplied template (public/equipment/silhouette.png,
// 620×1174 after cropping the panel chrome out) — % of the image's own width/height, so they stay
// aligned to the drawn squares/circles at any render size. Only 6 of the 12 body slots correspond to
// gear the game actually tracks; the rest render as dim, permanently-disabled 🔒 placeholders so the
// panel matches the template exactly without pretending to have working slots for categories the game
// doesn't have yet.
type SlotShape = 'square' | 'circle'
interface LayoutSlot { top: string; left: string; shape: SlotShape; clothingSlot: ClothingSlot | null }
const LAYOUT: LayoutSlot[] = [
  { top: '16.4%', left: '24.4%', shape: 'square', clothingSlot: null },
  { top: '13.9%', left: '49.4%', shape: 'square', clothingSlot: 'head' },
  { top: '16.4%', left: '72.4%', shape: 'square', clothingSlot: 'backpack' },

  { top: '28.6%', left: '21.8%', shape: 'square', clothingSlot: null },
  { top: '28.6%', left: '75.8%', shape: 'square', clothingSlot: null },

  { top: '43.0%', left: '22.6%', shape: 'circle', clothingSlot: 'accessory' },
  { top: '40.5%', left: '49.4%', shape: 'square', clothingSlot: 'torso' },
  { top: '43.0%', left: '75.0%', shape: 'circle', clothingSlot: null },

  { top: '56.6%', left: '25.3%', shape: 'square', clothingSlot: null },
  { top: '56.0%', left: '49.4%', shape: 'square', clothingSlot: 'legs' },
  { top: '56.6%', left: '72.4%', shape: 'square', clothingSlot: null },

  { top: '70.8%', left: '49.4%', shape: 'square', clothingSlot: 'feet' },
]
const HOTBAR_X = ['11.0%', '29.4%', '48.2%', '67.1%', '86.0%']
const HOTBAR_Y = '90.4%'
const SLOT_SIZE = '14.5%'

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
    <div style={{ position: 'relative', width: '100%', maxWidth: 300, margin: '0 auto', aspectRatio: '620 / 1174' }}>
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
            position: 'absolute', top: HOTBAR_Y, left, width: '13%', aspectRatio: '1', transform: 'translate(-50%, -50%)',
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
