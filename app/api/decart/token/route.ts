import { createDecartClient } from '@decartai/sdk'
import { NextResponse, type NextRequest } from 'next/server'

// Live try-on is OFF until DECART_API_KEY is set (server only — never put it in frontend code).
const enabled = () => !!process.env.DECART_API_KEY

export function GET() {
  return NextResponse.json({ enabled: enabled() })
}

// Returns a short-lived client token (expires ~60s) so the browser never sees the permanent key.
export async function POST(req: NextRequest) {
  if (!enabled()) return NextResponse.json({ error: 'Live try-on is not set up yet.' }, { status: 503 })
  // Only allow calls from this website (blocks other sites from using your credits).
  const site = req.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin') return NextResponse.json({ error: 'Not allowed.' }, { status: 403 })
  try {
    const client = createDecartClient({ apiKey: process.env.DECART_API_KEY! })
    const token = await client.tokens.create()
    return NextResponse.json(token)
  } catch (e) {
    const detail = e instanceof Error ? e.message.slice(0, 200) : 'unknown error'
    console.error('Decart token error:', detail)
    return NextResponse.json({ error: 'Could not start a try-on session. Please try again.', detail }, { status: 502 })
  }
}
