import { NextResponse } from 'next/server'
import { listWorldEvents } from '@/lib/worldState'

export async function GET() {
  const events = await listWorldEvents()
  return NextResponse.json(events)
}
