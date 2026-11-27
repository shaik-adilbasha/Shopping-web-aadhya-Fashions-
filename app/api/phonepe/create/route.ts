import { NextResponse, type NextRequest } from 'next/server'
import { phonepeCall, phonepeEnabled } from '@/lib/phonepe'

const hits = new Map<string, number[]>()
function limited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > 10
}

// Starts a PhonePe checkout session and returns the PhonePe payment page URL.
export async function POST(req: NextRequest) {
  if (!phonepeEnabled()) return NextResponse.json({ error: 'PhonePe payment is not set up yet.' }, { status: 503 })
  const site = req.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin') return NextResponse.json({ error: 'Not allowed.' }, { status: 403 })
  if (limited(req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown')) return NextResponse.json({ error: 'Too many attempts. Please wait a minute.' }, { status: 429 })

  const { orderId, amount } = (await req.json().catch(() => ({}))) as { orderId?: string; amount?: number }
  if (!/^AHD\d{8}$/.test(String(orderId)) || !Number.isFinite(amount) || (amount as number) < 1 || (amount as number) > 1_000_000)
    return NextResponse.json({ error: 'Invalid order.' }, { status: 400 })

  // a new reference per attempt, so a failed payment can be retried
  const merchantOrderId = `${orderId}-${Math.random().toString(36).slice(2, 8)}`
  const site_ = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin
  try {
    const r = await phonepeCall('/checkout/v2/pay', {
      method: 'POST',
      body: JSON.stringify({
        merchantOrderId,
        amount: Math.round((amount as number) * 100),
        expireAfter: 1200,
        paymentFlow: {
          type: 'PG_CHECKOUT',
          message: `Aadhya order ${orderId}`,
          merchantUrls: { redirectUrl: `${site_}/pay/phonepe-return?order=${orderId}&m=${merchantOrderId}` },
        },
        metaInfo: { udf1: String(orderId) },
      }),
    })
    const url = r.data.redirectUrl
    if (!r.ok || typeof url !== 'string') {
      console.error('PhonePe create failed', r.status, r.data?.code, r.data?.message)
      return NextResponse.json({ error: 'PhonePe could not start the payment. Please try again.' }, { status: 502 })
    }
    return NextResponse.json({ redirectUrl: url, merchantOrderId })
  } catch (e) {
    console.error('PhonePe error', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'PhonePe could not start the payment. Please try again.' }, { status: 502 })
  }
}
