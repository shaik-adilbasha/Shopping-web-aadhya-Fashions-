import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'

// Official verification: HMAC-SHA256 of "order_id|payment_id" with the key secret.
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret) return NextResponse.json({ verified: false, error: 'Razorpay is not configured.' }, { status: 503 })
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return NextResponse.json({ verified: false }, { status: 400 })
  const expected = createHmac('sha256', secret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex')
  const a = Buffer.from(expected), b = Buffer.from(String(razorpay_signature))
  return NextResponse.json({ verified: a.length === b.length && timingSafeEqual(a, b) })
}
