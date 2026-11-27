import { NextResponse, type NextRequest } from 'next/server'
import { phonepeCall, phonepeEnabled } from '@/lib/phonepe'
import { clean, orderMessage, sendOwnerWhatsApp, whatsappConfigured, METHODS } from '@/lib/whatsapp'

const hits = new Map<string, number[]>()
function limited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > 40
}

/**
 * Asks PhonePe directly whether the payment really completed (never trusts the browser redirect).
 * "paid" is true only when PhonePe says COMPLETED AND the amount PhonePe collected equals the order total.
 */
export async function POST(req: NextRequest) {
  if (!phonepeEnabled()) return NextResponse.json({ state: 'UNAVAILABLE' }, { status: 503 })
  const site = req.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin') return NextResponse.json({ state: 'UNAVAILABLE' }, { status: 403 })
  if (limited(req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown')) return NextResponse.json({ state: 'UNKNOWN' }, { status: 429 })

  const { m, order } = (await req.json().catch(() => ({}))) as { m?: string; order?: Record<string, unknown> }
  if (!/^AHD\d{8}-[a-z0-9]{4,8}$/.test(String(m))) return NextResponse.json({ state: 'INVALID' }, { status: 400 })

  try {
    const r = await phonepeCall(`/checkout/v2/order/${m}/status?details=false`)
    const state = String(r.data.state ?? 'UNKNOWN')
    const amount = Number(r.data.amount ?? 0)
    let paid = false
    if (state === 'COMPLETED' && order) {
      const id = clean(order.id, 20)
      const total = Number(order.total)
      paid = String(m).startsWith(`${id}-`) && Math.round(total * 100) === amount
      if (paid && whatsappConfigured() && METHODS[clean(order.method, 10)]) {
        const items = Array.isArray(order.items) ? (order.items as { name?: unknown; qty?: unknown }[]) : []
        const { params, text } = orderMessage({ id, name: clean(order.name, 60), phone: clean(order.phone, 15), items, total, method: 'phonepe', address: clean(order.address, 200) }, 'PAID (verified by PhonePe)', `${id} PAID via PhonePe`)
        await sendOwnerWhatsApp(params, text)
      }
    }
    return NextResponse.json({ state, paid, amount })
  } catch (e) {
    console.error('PhonePe status error', e instanceof Error ? e.message : e)
    return NextResponse.json({ state: 'UNKNOWN', paid: false })
  }
}
