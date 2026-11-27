'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { placeOrder, type ShippingInput } from '@/app/actions/orders'
import { formatINR, getProduct } from '@/lib/catalog'
import { useStore, type Order } from '@/lib/store'
import { notifyOrder } from '@/lib/notify'
import { PageTitle } from '@/components/shop/ui-bits'
import { EmptyState } from '@/components/cart/cart-view'
import { cn } from '@/lib/utils'

const steps = ['Shipping', 'Payment', 'Review']
const states = ['Andhra Pradesh', 'Telangana', 'Karnataka', 'Tamil Nadu', 'Kerala', 'Maharashtra', 'Delhi', 'Gujarat', 'West Bengal', 'Other']

const inputCls =
  'h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20'

export function CheckoutView() {
  const router = useRouter()
  const { cart, subtotal, clearCart, addOrder, updateOrder, user, ready, settings, deliveryFor } = useStore()
  const [step, setStep] = useState(0)
  const [pending, startTransition] = useTransition()
  const [shipping, setShipping] = useState<ShippingInput>({ fullName: '', phone: '', address: '', city: '', state: '', pincode: '' })
  const [payment, setPayment] = useState<'phonepe' | 'razorpay' | 'upi' | 'cod'>('upi')
  const [rzp, setRzp] = useState(false)
  const [pp, setPp] = useState(false)
  useEffect(() => {
    fetch('/api/phonepe')
      .then((r) => r.json())
      .then((d) => {
        setPp(!!d.enabled)
        if (d.enabled) setPayment('phonepe')
      })
      .catch(() => {})
  }, [])
  useEffect(() => {
    fetch('/api/razorpay/order')
      .then((r) => r.json())
      .then((d) => {
        setRzp(!!d.enabled)
        if (d.enabled) setPayment('razorpay')
      })
      .catch(() => {})
  }, [])
  useEffect(() => {
    if (user && !shipping.fullName) setShipping((s) => ({ ...s, fullName: user.name, phone: user.phone, ...(user.addresses[0] ? { address: user.addresses[0].address, city: user.addresses[0].city, state: user.addresses[0].state, pincode: user.addresses[0].pincode } : {}) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])
  const delivery = deliveryFor(subtotal)
  const total = subtotal + delivery

  if (ready && !user) {
    return (
      <div className="px-4 pt-6 md:px-8">
        <PageTitle>Checkout</PageTitle>
        <div className="mx-auto mt-8 max-w-md rounded-2xl bg-white p-8 text-center ring-1 ring-border">
          <p className="font-serif text-xl text-ink">Please log in to checkout</p>
          <p className="mt-2 text-sm text-muted-foreground">Your cart is saved. Log in or create an account to place your order.</p>
          <Link href="/login?next=/checkout" className="mt-6 flex h-11 items-center justify-center rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90">
            Login / Register
          </Link>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="px-4 pt-6 md:px-8">
        <PageTitle>Checkout</PageTitle>
        <EmptyState />
      </div>
    )
  }

  const update = (k: keyof ShippingInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setShipping((s) => ({ ...s, [k]: e.target.value }))

  const submitShipping = (e: React.FormEvent) => {
    e.preventDefault()
    if (shipping.phone.replace(/\D/g, '').length !== 10) return toast.error('Enter a valid 10-digit phone number')
    if (shipping.pincode.replace(/\D/g, '').length !== 6) return toast.error('Enter a valid 6-digit pincode')
    setStep(1)
  }

  const confirm = () =>
    startTransition(async () => {
      if (!user) return toast.error('Please log in first.')
      const res = await placeOrder(cart.length, shipping)
      if (!res.ok) return toast.error(res.error)
      const items = cart.flatMap((i) => {
        const p = getProduct(i.slug)
        return p ? [{ slug: p.slug, name: p.name, price: p.price, qty: i.qty, color: i.color, image: p.images[0] ?? '' }] : []
      })
      if (items.length !== cart.length) return toast.error('A product in your cart is no longer available.')
      const order: Order = {
        id: res.orderId,
        userId: user.id,
        customer: { name: shipping.fullName, email: user.email, phone: shipping.phone },
        address: { fullName: shipping.fullName, phone: shipping.phone, address: shipping.address, city: shipping.city, state: shipping.state, pincode: shipping.pincode },
        items,
        subtotal,
        delivery,
        total,
        placedAt: new Date().toISOString(),
        paymentMethod: payment,
        paymentStatus: 'Payment Pending', // only the server-verified Razorpay flow or the owner can change this
        status: 'Placed',
      }
      addOrder(order)
      notifyOrder(order) // WhatsApp alert to the owner (if configured on the server)
      clearCart()
      if (payment === 'phonepe') {
        router.push(`/pay/phonepe-return?order=${res.orderId}&start=1`)
        return
      }
      if (payment === 'razorpay') {
        try {
          await payWithRazorpay(order, (ref, proof) => {
            updateOrder(order.id, { paymentStatus: 'Paid', paymentRef: ref })
            notifyOrder({ ...order, paymentStatus: 'Paid', paymentRef: ref }, proof)
          })
        } catch (e) {
          toast.error(e instanceof Error ? e.message : 'Payment was not completed. Your order is saved as Payment Pending.')
        }
      }
      router.push(payment === 'upi' ? `/pay/${res.orderId}` : `/order/${res.orderId}?total=${total}&pay=${payment}`)
    })

  return (
    <div className="px-4 pt-6 md:px-8">
      <PageTitle>Checkout</PageTitle>

      <ol className="mx-auto mt-6 flex max-w-lg items-start justify-between" aria-label="Checkout steps">
        {steps.map((s, i) => (
          <li key={s} className="relative flex flex-1 flex-col items-center gap-2 text-xs">
            {i > 0 && <span className={cn('absolute right-1/2 top-3 h-px w-full', i <= step ? 'bg-primary' : 'bg-border')} aria-hidden="true" />}
            <span
              className={cn(
                'relative z-10 flex size-6 items-center justify-center rounded-full text-[11px]',
                i < step ? 'bg-primary text-white' : i === step ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-muted text-muted-foreground',
              )}
              aria-current={i === step ? 'step' : undefined}
            >
              {i < step ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span className={i <= step ? 'text-primary' : 'text-muted-foreground'}>{s}</span>
          </li>
        ))}
      </ol>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-2xl bg-white p-5 ring-1 ring-border">
          {step === 0 && (
            <form onSubmit={submitShipping} className="flex flex-col gap-4">
              <h2 className="text-base font-medium">Shipping Address</h2>
              <Field label="Full Name">
                <input required minLength={2} autoComplete="name" placeholder="Enter your full name" value={shipping.fullName} onChange={update('fullName')} className={inputCls} />
              </Field>
              <Field label="Phone Number">
                <div className="flex">
                  <span className="flex items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm">+91</span>
                  <input required inputMode="numeric" autoComplete="tel-national" maxLength={10} placeholder="Enter phone number" value={shipping.phone} onChange={update('phone')} className={cn(inputCls, 'rounded-l-none')} />
                </div>
              </Field>
              <Field label="Address">
                <input required minLength={5} autoComplete="street-address" placeholder="House No, Street, Area" value={shipping.address} onChange={update('address')} className={inputCls} />
              </Field>
              <Field label="City">
                <input required autoComplete="address-level2" placeholder="Enter city" value={shipping.city} onChange={update('city')} className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="State">
                  <select required value={shipping.state} onChange={update('state')} className={inputCls}>
                    <option value="">Select state</option>
                    {states.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Pincode">
                  <input required inputMode="numeric" autoComplete="postal-code" maxLength={6} placeholder="Enter pincode" value={shipping.pincode} onChange={update('pincode')} className={inputCls} />
                </Field>
              </div>
              <button type="submit" className="mt-2 h-11 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90">
                Continue to Payment
              </button>
            </form>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-base font-medium">Payment Method</h2>
              {(
                [
                  ...(pp ? [{ id: 'phonepe', title: 'PhonePe / UPI (Pay Online)', text: 'Pay securely with PhonePe, Google Pay, Paytm or any UPI app, or by QR. Your order is confirmed automatically once the payment succeeds.' }] : []),
                  ...(rzp ? [{ id: 'razorpay', title: 'Pay Online (Razorpay)', text: 'UPI, cards, netbanking and wallets. Marked Paid only after secure server verification.' }] : []),
                  { id: 'upi', title: 'UPI QR / Manual Payment', text: 'Pay by UPI QR after placing your order. Your order stays "Payment Pending" until our team verifies the payment.' },
                  { id: 'cod', title: 'Cash on Delivery', text: 'Pay in cash when your order arrives.' },
                ] as { id: 'phonepe' | 'razorpay' | 'upi' | 'cod'; title: string; text: string }[]
              ).map((m) => (
                <label
                  key={m.id}
                  className={cn('flex cursor-pointer gap-3 rounded-xl p-4 ring-1 transition', payment === m.id ? 'bg-blush ring-primary' : 'ring-border hover:bg-blush/50')}
                >
                  <input type="radio" name="payment" checked={payment === m.id} onChange={() => setPayment(m.id)} className="mt-1 accent-primary" />
                  <span>
                    <span className="block text-sm font-medium">{m.title}</span>
                    <span className="text-xs text-muted-foreground">{m.text}</span>
                  </span>
                </label>
              ))}
              {!rzp && !pp && <p className="text-[11px] text-muted-foreground">Instant online payment will appear here once the shop owner connects it.</p>}
              {payment === 'upi' && (settings.upiQr || settings.upiId) && (
                <div className="flex items-center gap-4 rounded-xl bg-white p-4 ring-1 ring-border">
                  {settings.upiQr && <img src={settings.upiQr} alt="UPI QR code" className="size-28 rounded-lg object-contain" />}
                  <p className="text-xs text-ink/80">
                    Pay <b>{formatINR(total)}</b> to {settings.upiId ? <b>{settings.upiId}</b> : 'the QR shown'}, then share the screenshot on WhatsApp with your order ID.
                  </p>
                </div>
              )}
              <div className="mt-2 flex gap-3">
                <button type="button" onClick={() => setStep(0)} className="h-11 flex-1 rounded-lg border border-primary text-sm text-primary">
                  Back
                </button>
                <button type="button" onClick={() => setStep(2)} className="h-11 flex-1 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90">
                  Review Order
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-base font-medium">Review</h2>
              <div className="rounded-xl bg-blush p-4 text-sm">
                <p className="font-medium">{shipping.fullName}</p>
                <p className="text-ink/80">
                  {shipping.address}, {shipping.city}, {shipping.state} - {shipping.pincode}
                </p>
                <p className="text-ink/80">+91 {shipping.phone}</p>
                <p className="mt-2 text-xs text-primary">{payment === 'phonepe' ? 'PhonePe / UPI (Pay Online)' : payment === 'razorpay' ? 'Pay Online (Razorpay)' : payment === 'upi' ? 'UPI QR / Manual Payment (Payment Pending)' : 'Cash on Delivery'}</p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="h-11 flex-1 rounded-lg border border-primary text-sm text-primary">
                  Back
                </button>
                <button
                  type="button"
                  onClick={confirm}
                  disabled={pending}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-70"
                >
                  {pending && <Loader2 className="size-4 animate-spin" />}
                  Place Order
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="h-fit rounded-2xl bg-white p-5 ring-1 ring-border" aria-label="Order summary">
          <h2 className="text-base font-medium">Order Summary</h2>
          <ul className="mt-4 flex flex-col gap-4">
            {cart.map((i) => {
              const p = getProduct(i.slug)
              if (!p) return null
              return (
                <li key={i.slug} className="flex gap-3">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-lg">
                    <Image src={p.images[0] || '/placeholder.svg'} alt={p.name} fill sizes="56px" className="object-cover" />
                  </span>
                  <span className="text-xs">
                    <span className="block text-ink">{p.name}</span>
                    <span className="block font-medium">{formatINR(p.price)}</span>
                    <span className="text-muted-foreground">Qty: {i.qty}</span>
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="mt-5 flex justify-between border-t border-border pt-4 text-sm text-ink/80">
            <span>Subtotal</span>
            <span>{formatINR(subtotal)}</span>
          </p>
          <p className="mt-1 flex justify-between text-sm text-ink/80">
            <span>Delivery</span>
            <span>{delivery === 0 ? 'Free' : formatINR(delivery)}</span>
          </p>
          <p className="mt-3 flex justify-between border-t border-border pt-3 font-semibold">
            <span>Total</span>
            <span>{formatINR(total)}</span>
          </p>
        </aside>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs text-ink/80">
      {label}
      {children}
    </label>
  )
}

declare global {
  interface Window {
    Razorpay?: new (o: Record<string, unknown>) => { open: () => void; on: (e: string, cb: () => void) => void }
  }
}

function loadRazorpay() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true)
    const el = document.createElement('script')
    el.src = 'https://checkout.razorpay.com/v1/checkout.js'
    el.onload = () => resolve(true)
    el.onerror = () => resolve(false)
    document.body.appendChild(el)
  })
}

type RzProof = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }

async function payWithRazorpay(order: Order, onPaid: (paymentId: string, proof: RzProof) => void) {
  if (!(await loadRazorpay())) throw new Error('Could not load Razorpay. Your order is saved as Payment Pending.')
  const res = await fetch('/api/razorpay/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: order.total, receipt: order.id }) })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Could not start payment.')
  await new Promise<void>((resolve) => {
    const rz = new window.Razorpay!({
      key: data.keyId,
      amount: data.amount,
      currency: data.currency,
      order_id: data.id,
      name: 'Aadhya Fashions Studios',
      description: `Order ${order.id}`,
      prefill: { name: order.customer.name, email: order.customer.email, contact: order.customer.phone },
      theme: { color: '#d81b6a' },
      handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        const v = await fetch('/api/razorpay/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(r) }).then((x) => x.json())
        if (v.verified) onPaid(r.razorpay_payment_id, r)
        else toast.error('Payment could not be verified. Order is Payment Pending.')
        resolve()
      },
      modal: { ondismiss: () => resolve() },
    })
    rz.open()
  })
}
