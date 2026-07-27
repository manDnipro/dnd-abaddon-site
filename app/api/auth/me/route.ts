import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET() {
  const nickname = await getSession()
  return NextResponse.json({ nickname })
}
