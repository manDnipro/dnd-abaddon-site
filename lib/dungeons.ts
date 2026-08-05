// Standalone story locations, separate from the 4 generic EXPEDITION_LEVELS (easy/medium/hard/
// extreme random-search tiers) — each dungeon gets its own hand-authored set of missions instead of
// the generic loot-roll search loop. Cards exist on the expedition page now as "СКОРО" placeholders;
// wire them up to real content once missions are written for each.
//
// Exception: 'epicenter' is already live — it's wired directly into EXPEDITION_LEVELS (lib/
// expedition.ts, key 'epicenter') as a real, playable, level-gated location with its own d30+ dice
// and building-materials-only loot table, not a placeholder. Kept out of this list so the expedition
// page doesn't render it twice (once as the real card, once as "СКОРО").
export interface Dungeon {
  key: string
  label: string
  subtitle: string
  image: string
}

export const DUNGEONS: Dungeon[] = [
  { key: 'nightshift', label: 'Нічна зміна', subtitle: 'Нічне патрулювання околиць табору, моніторинг орд зомбі', image: 'dungeon2_nightshift.jpg' },
  { key: 'raiders', label: 'Битва з рейдерами', subtitle: 'В центрі міста', image: 'dungeon3_raiders.jpg' },
  { key: 'hospital', label: 'Покинута лікарня', subtitle: 'Полювання на боса «О Пацієнт»', image: 'dungeon4_hospital.jpg' },
]
