import { NextRequest, NextResponse } from 'next/server'

// Catches every mutating API call site-wide and mirrors it to Discord — a raw activity trail on
// top of the richer, descriptive logs (lib/characterLog.ts, lib/worldState.ts) that already cover
// most gameplay actions with full context. This one's the safety net: it fires for literally every
// route, present and future, without needing each one wired up individually.
const WEBHOOK_URL = process.env.DISCORD_LOG_WEBHOOK_URL

function whoFromCookies(req: NextRequest): string {
  const sessionRaw = req.cookies.get('session')?.value
  const nickname = sessionRaw ? sessionRaw.slice(0, sessionRaw.lastIndexOf('.')) : null
  const gm = req.cookies.get('gm_session')?.value ? 'ГМ' : null
  if (nickname && gm) return `${nickname} (ГМ)`
  return nickname ?? gm ?? 'анонім'
}

export function proxy(req: NextRequest) {
  if (WEBHOOK_URL && req.method === 'POST') {
    const who = whoFromCookies(req)
    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: `🌐 \`POST ${req.nextUrl.pathname}\` — ${who}` }),
    }).catch(() => {})
  }
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
