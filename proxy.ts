import { NextRequest, NextResponse, NextFetchEvent } from 'next/server'
import { logServerActivity } from '@/lib/serverLog'

// Catches every mutating API call site-wide and records it in the rolling server activity log the
// GM panel reads — a raw trail on top of the richer, descriptive logs (lib/characterLog.ts,
// lib/worldState.ts) that already cover most gameplay actions with full context. This one's the
// safety net: it fires for literally every route, present and future, without needing each one
// wired up individually. Uses the same Upstash Redis (REST/fetch-based, Edge-compatible) every
// other feature already relies on — no external webhook dependency to misconfigure.

function whoFromCookies(req: NextRequest): string {
  const sessionRaw = req.cookies.get('session')?.value
  const nickname = sessionRaw ? sessionRaw.slice(0, sessionRaw.lastIndexOf('.')) : null
  const gm = req.cookies.get('gm_session')?.value ? 'ГМ' : null
  if (nickname && gm) return `${nickname} (ГМ)`
  return nickname ?? gm ?? 'анонім'
}

export function proxy(req: NextRequest, event: NextFetchEvent) {
  if (req.method === 'POST') {
    const who = whoFromCookies(req)
    event.waitUntil(logServerActivity(`POST ${req.nextUrl.pathname} — ${who}`))
  }
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
