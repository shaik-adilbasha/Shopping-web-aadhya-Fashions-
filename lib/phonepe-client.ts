import type { Order } from './store'

/** Asks our server to verify a PhonePe payment directly with PhonePe. `paid` is true only when PhonePe confirms it and the amount matches. */
export async function checkPhonePe(m: string, order?: Order): Promise<{ state: string; paid: boolean }> {
  try {
    const r = await fetch('/api/phonepe/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        m,
        order: order && {
          id: order.id,
          name: order.customer.name,
          phone: order.customer.phone,
          items: order.items.map((i) => ({ name: i.name, qty: i.qty })),
          total: order.total,
          method: order.paymentMethod,
          address: `${order.address.address}, ${order.address.city}, ${order.address.state} ${order.address.pincode}`,
        },
      }),
    })
    const d = await r.json().catch(() => ({}))
    return { state: String(d.state ?? 'UNKNOWN'), paid: !!d.paid }
  } catch {
    return { state: 'UNKNOWN', paid: false }
  }
}
