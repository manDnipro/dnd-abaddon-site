export const MALE_AVATAR_COUNT = 17
export const FEMALE_AVATAR_COUNT = 9

export const AVATARS: string[] = [
  ...Array.from({ length: MALE_AVATAR_COUNT }, (_, i) => `/npc/male/portrait_${i + 1}.png`),
  ...Array.from({ length: FEMALE_AVATAR_COUNT }, (_, i) => `/npc/female/portrait_${i + 1}.png`),
]

export function isValidAvatar(path: string): boolean {
  return AVATARS.includes(path)
}
