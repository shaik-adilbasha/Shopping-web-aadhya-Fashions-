// Server-side helper: WhatsApp Cloud API alert to the OWNER. Secrets come from environment variables only.
const env = process.env

export const whatsappConfigured = () => !!(env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID && env.OWNER_WHATSAPP_TO)
export const clean = (v: unknown, max = 200) => String(v ?? '').replace(/[\r\n\t]+/g, ' ').replace(/ {2,}/g, ' ').trim().slice(0, max)
export const METHODS: Record<string, string> = {
  phonepe: 'PhonePe / UPI (online)',
  razorpay: 'Razorpay (online)',
  upi: 'UPI QR / manual',
  cod: 'Cash on Delivery',
}

export type OrderSummary = {
  id: string
  name: string
  phone: string
  items: { name?: unknown; qty?: unknown }[]
  total: number
  method: string
  address: string
}

export function orderMessage(o: OrderSummary, status: string, title?: string) {
  const itemText = o.items.slice(0, 20).map((i) => `${clean(i.name, 60)} x${Math.max(1, Math.floor(Number(i.qty) || 1))}`).join(', ')
  const p = [title ?? o.id, clean(o.name, 60), clean(o.phone, 15), itemText.slice(0, 300), `₹${Math.round(o.total).toLocaleString('en-IN')}`, `${METHODS[o.method] ?? o.method} - ${status}`, clean(o.address, 200)]
  const text = `🛍️ New order ${p[0]}\nCustomer: ${p[1]} (${p[2]})\nItems: ${p[3]}\nTotal: ${p[4]}\nPayment: ${p[5]}\nDeliver to: ${p[6]}`
  return { params: p, text }
}

export async function sendOwnerWhatsApp(params: string[], text: string) {
  const url = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION || 'v21.0'}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`
  const to = (env.OWNER_WHATSAPP_TO ?? '').replace(/\D/g, '')
  const body = env.WHATSAPP_TEMPLATE_NAME
    ? {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: env.WHATSAPP_TEMPLATE_NAME,
          language: { code: env.WHATSAPP_TEMPLATE_LANG || 'en' },
          components: [{ type: 'body', parameters: params.map((t) => ({ type: 'text', text: t || '-' })) }],
        },
      }
    : { messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }
  const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) console.error('WhatsApp send failed', res.status, data?.error?.code, data?.error?.message)
  return { ok: res.ok, error: String(data?.error?.message ?? '').slice(0, 250) }
}
