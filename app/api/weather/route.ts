import { NextResponse } from 'next/server'
import { getOrRollWeather } from '@/lib/worldState'
import { SEASON_LABELS } from '@/lib/weather'

export async function GET() {
  const weather = await getOrRollWeather()
  return NextResponse.json({ ...weather, seasonLabel: SEASON_LABELS[weather.season] })
}
