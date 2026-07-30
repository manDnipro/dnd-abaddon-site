import { redis } from './redis'

/** char:owner:{owner} is always written as a string id (see character/create, gm/create-character),
 *  but Upstash's REST client auto-deserializes numeric-looking strings back into JS numbers on
 *  read — so a bare `redis.get<string>(...)` can silently hand back `1` (number) instead of `"1"`.
 *  Every strict `===` comparison against a charId elsewhere (e.g. RPMission.targetCharId, which is
 *  always a JSON string) then fails even though the ids "match", making targeted content invisible
 *  to the player. Route every char:owner lookup through here so the type is actually guaranteed. */
export async function getOwnerCharId(owner: string): Promise<string | null> {
  const raw = await redis.get<string | number>(`char:owner:${owner}`)
  return raw === null || raw === undefined ? null : String(raw)
}
