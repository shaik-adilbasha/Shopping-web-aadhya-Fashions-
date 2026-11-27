import type { Order } from './store'

/** Asks the server to WhatsApp the owner. Fire-and-forget: a failure never blocks the customer's order. */
export function notifyOrder(o: Order, razorpay?: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }, utr?: string) {
  fetch('/api/notify-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay,
      utr,
      order: {
        id: o.id,
        name: o.customer.name,
        phone: o.customer.phone,
        items: o.items.map((i) => ({ name: i.name, qty: i.qty })),
        total: o.total,
        method: o.paymentMethod,
        address: `${o.address.address}, ${o.address.city}, ${o.address.state} ${o.address.pincode}`,
      },
    }),
  }).catch(() => {})
}
