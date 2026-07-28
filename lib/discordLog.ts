// Mirrors game logs to a Discord webhook so we don't need to keep growing Redis just to retain
// history — Discord becomes the durable long-term log, Redis only needs enough for the live UI.
// Best-effort only: a failed/slow webhook must never break gameplay, so every call is fire-and-forget
// with errors swallowed.

const WEBHOOK_URL = process.env.DISCORD_LOG_WEBHOOK_URL

function chunk(text: string, size: number): string[] {
  const parts: string[] = []
  for (let i = 0; i < text.length; i += size) parts.push(text.slice(i, i + size))
  return parts
}

// Must be awaited by callers, not fired-and-forgotten — Vercel's Node.js serverless functions can
// freeze/terminate the moment the response is sent, killing any promise that's still in flight and
// wasn't awaited. That silently dropped every log in production while still "working" locally
// (a long-running `next dev` process never gets frozen mid-request the same way).
export async function logToDiscord(content: string): Promise<void> {
  if (!WEBHOOK_URL) return
  for (const part of chunk(content, 1900)) {
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: part }),
      })
    } catch {
      // best-effort — a down/slow webhook must never break gameplay
    }
  }
}
