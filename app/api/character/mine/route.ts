import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { getSession } from '@/lib/auth'
import { Character } from '@/lib/types'

export async function GET() {
  const owner = await getSession()
  if (!owner) return NextResponse.json({ error: 'Потрібно увійти' }, { status: 401 })

  const id = await redis.get<string>(`char:owner:${owner}`)
  if (!id) return NextResponse.json({ character: null })

  const raw = await redis.get<string>(`char:${id}`)
  const character: Character | null = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null

  return NextResponse.json({ character })
}
