import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { isOwner } from '@/lib/owner-auth'
import { METHODS, clean, orderMessage, sendOwnerWhatsApp, whatsappConfigured } from '@/lib/whatsapp'

/** Alerts the owner on WhatsApp (Meta WhatsApp Cloud API). Secrets stay on the server. */
const hits = new Map<string, number[]>()
function limited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > 8
}

export async function POST(req: NextRequest) {
  if (!whatsappConfigured()) return NextResponse.json({ sent: false, reason: 'not-configured' }, { status: 503 })
  const site = req.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin') return NextResponse.json({ sent: false }, { status: 403 })
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (limited(ip)) return NextResponse.json({ sent: false, reason: 'rate-limited' }, { status: 429 })

  let payload: { test?: boolean; order?: Record<string, unknown>; razorpay?: Record<string, string>; utr?: string }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ sent: false }, { status: 400 })
  }

  if (payload.test) {
    if (!(await isOwner())) return NextResponse.json({ sent: false }, { status: 401 })
    const r = await sendOwnerWhatsApp(['AHD00000000 (TEST)', 'Test Customer', '9999999999', 'Test saree x1', '₹1', 'Test message', 'Your shop address'], '✅ Aadhya test: WhatsApp order alerts are working.')
    return NextResponse.json({ sent: r.ok, reason: r.error }, { status: r.ok ? 200 : 502 })
  }

  const o = payload.order
  const items = Array.isArray(o?.items) ? (o!.items as { name?: unknown; qty?: unknown }[]).slice(0, 20) : []
  const total = Number(o?.total)
  const id = clean(o?.id, 20)
  const method = clean(o?.method, 10)
  if (!/^AHD\d{8}$/.test(id) || !items.length || !(total > 0 && total < 10_000_000) || !METHODS[method])
    return NextResponse.json({ sent: false, reason: 'invalid' }, { status: 400 })

  let status = 'Payment Pending'
  let title = id
  const rz = payload.razorpay
  if (rz) {
    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret || !rz.razorpay_order_id || !rz.razorpay_payment_id || !rz.razorpay_signature) return NextResponse.json({ sent: false, reason: 'invalid' }, { status: 400 })
    const expected = Buffer.from(createHmac('sha256', secret).update(`${rz.razorpay_order_id}|${rz.razorpay_payment_id}`).digest('hex'))
    const got = Buffer.from(String(rz.razorpay_signature))
    if (expected.length !== got.length || !timingSafeEqual(expected, got)) return NextResponse.json({ sent: false, reason: 'unverified' }, { status: 400 })
    status = 'PAID (verified)'
    title = `${id} PAYMENT UPDATE`
  }
  if (!rz && payload.utr) {
    if (!/^\d{12}$/.test(String(payload.utr))) return NextResponse.json({ sent: false, reason: 'invalid' }, { status: 400 })
    status = `Customer says paid, UTR ${payload.utr} - CHECK your bank/UPI app before marking Paid`
    title = `${id} UTR SUBMITTED`
  }

  const { params, text } = orderMessage({ id, name: clean(o?.name, 60), phone: clean(o?.phone, 15), items, total, method, address: clean(o?.address, 200) }, status, title)
  const r = await sendOwnerWhatsApp(params, text)
  return NextResponse.json({ sent: r.ok }, { status: r.ok ? 200 : 502 })
}
