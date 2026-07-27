import { NextResponse } from 'next/server'
import { loadOwnCharacter } from '@/lib/loadCharacter'
import { redis } from '@/lib/redis'

export async function GET() {
  const result = await loadOwnCharacter()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const { charId } = result

  const reveals = await redis.lrange<string>(`social:reveals:${charId}`, 0, -1)
  if (reveals.length > 0) await redis.del(`social:reveals:${charId}`)
  return NextResponse.json({ reveals })
}
