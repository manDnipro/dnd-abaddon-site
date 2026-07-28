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

export function logToDiscord(content: string) {
  if (!WEBHOOK_URL) return
  for (const part of chunk(content, 1900)) {
    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: part }),
    }).catch(() => {})
  }
}
