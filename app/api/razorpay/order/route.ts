import { NextResponse, type NextRequest } from 'next/server'

// Razorpay is OFF until you add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (server only).
const enabled = () => !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)

export function GET() {
  return NextResponse.json({ enabled: enabled(), keyId: enabled() ? process.env.RAZORPAY_KEY_ID : null })
}

export async function POST(req: NextRequest) {
  if (!enabled()) return NextResponse.json({ error: 'Razorpay is not configured yet.' }, { status: 503 })
  const { amount, receipt } = (await req.json()) as { amount: number; receipt: string }
  if (!Number.isFinite(amount) || amount < 1) return NextResponse.json({ error: 'Invalid amount.' }, { status: 400 })
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: Math.round(amount * 100), currency: 'INR', receipt: String(receipt).slice(0, 40) }),
  })
  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data?.error?.description ?? 'Could not create payment.' }, { status: 502 })
  return NextResponse.json({ id: data.id, amount: data.amount, currency: data.currency, keyId: process.env.RAZORPAY_KEY_ID })
}
