'use server'

export type ShippingInput = {
  fullName: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
}

export type PlaceOrderResult = { ok: true; orderId: string } | { ok: false; error: string }

/** Validates the delivery details on the server and issues a unique order ID. */
export async function placeOrder(itemCount: number, shipping: ShippingInput): Promise<PlaceOrderResult> {
  if (!Number.isInteger(itemCount) || itemCount <= 0) return { ok: false, error: 'Your cart is empty.' }
  if ((shipping.fullName?.trim() ?? '').length < 2) return { ok: false, error: 'Please enter your full name.' }
  if ((shipping.phone?.replace(/\D/g, '') ?? '').length !== 10) return { ok: false, error: 'Please enter a valid 10-digit phone number.' }
  if ((shipping.address?.trim() ?? '').length < 5) return { ok: false, error: 'Please enter your address.' }
  if (!shipping.city?.trim()) return { ok: false, error: 'Please enter your city.' }
  if (!shipping.state?.trim()) return { ok: false, error: 'Please select your state.' }
  if ((shipping.pincode?.replace(/\D/g, '') ?? '').length !== 6) return { ok: false, error: 'Please enter a valid 6-digit pincode.' }
  return { ok: true, orderId: 'AHD' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10) }
}
