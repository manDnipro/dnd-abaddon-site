import { NextResponse } from 'next/server'
import { listWorldMissions } from '@/lib/worldState'

export async function GET() {
  const missions = await listWorldMissions()
  return NextResponse.json(missions)
}
