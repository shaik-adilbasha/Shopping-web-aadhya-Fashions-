'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CalendarDays, Heart, LogIn, Package, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatINR, getProduct } from '@/lib/catalog'
import { useStore, type Order } from '@/lib/store'
import { checkPhonePe } from '@/lib/phonepe-client'
import { ReturnForm } from './return-form'
import { btnOutline, btnPrimary, inputCls, waHref } from '@/lib/wa'
import { PageTitle } from '@/components/shop/ui-bits'
import { cn } from '@/lib/utils'

const card = 'rounded-2xl bg-white p-4 ring-1 ring-border md:p-5'

function Empty({ icon: Icon, title, text, href, cta }: { icon: typeof Heart; title: string; text: string; href: string; cta: string }) {
  return (
    <div className={cn(card, 'mx-auto mt-6 flex max-w-lg flex-col items-center py-12 text-center')}>
      <span className="flex size-14 items-center justify-center rounded-full bg-blush text-primary"><Icon className="size-7" /></span>
      <p className="mt-4 font-serif text-xl text-ink">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      <Link href={href} className={btnPrimary + ' mt-5'}>{cta}</Link>
    </div>
  )
}

function Gate({ children }: { children: React.ReactNode }) {
  const { user, ready } = useStore()
  if (!ready) return <p className="px-4 pt-10 text-center text-sm text-muted-foreground md:px-8">Loading…</p>
  if (!user) return <div className="px-4 pt-6 md:px-8"><Empty icon={LogIn} title="Please log in" text="Log in or create an account to see this page." href="/login" cta="Login / Register" /></div>
  return <div className="px-4 pt-6 md:px-8">{children}</div>
}

const badge = (s: string) =>
  cn('rounded-full px-2.5 py-0.5 text-[11px] font-medium', /Paid|Delivered|Completed|Accepted|Approved/.test(s) ? 'bg-green-100 text-green-700' : /Cancel|Reject|Failed/.test(s) ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')

export function WishlistView() {
  const { wishlist, toggleWishlist, addToCart, ready } = useStore()
  const items = wishlist.map((s) => getProduct(s)).filter(Boolean) as NonNullable<ReturnType<typeof getProduct>>[]
  return (
    <div className="px-4 pt-6 md:px-8">
      <PageTitle>Wishlist</PageTitle>
      {ready && items.length === 0 ? (
        <Empty icon={Heart} title="Your wishlist is empty" text="Tap the heart on any product to save it here." href="/shop" cta="Browse Shop" />
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
          {items.map((p) => (
            <li key={p.slug} className="overflow-hidden rounded-2xl bg-white ring-1 ring-border">
              <Link href={`/product/${p.slug}`} className="relative block aspect-[4/5]">
                <Image src={p.images[0] || '/placeholder.svg'} alt={p.name} fill sizes="25vw" className="object-cover" />
              </Link>
              <div className="p-3">
                <Link href={`/product/${p.slug}`} className="line-clamp-1 text-sm text-ink hover:text-primary">{p.name}</Link>
                <p className="text-sm font-semibold">{formatINR(p.price)}</p>
                <div className="mt-2 flex gap-2">
                  <button type="button" disabled={p.stock <= 0} onClick={() => { addToCart(p.slug); toggleWishlist(p.slug) }} className="h-9 flex-1 rounded-lg bg-primary text-xs text-white disabled:opacity-50">
                    {p.stock <= 0 ? 'Out of stock' : 'Move to Cart'}
                  </button>
                  <button type="button" onClick={() => toggleWishlist(p.slug)} aria-label="Remove from wishlist" className="flex size-9 items-center justify-center rounded-lg border border-input text-primary"><Trash2 className="size-4" /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const steps = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered']

export function OrdersView() {
  const { orders, updateOrder, addReturn, returns, settings } = useStore()
  const [open, setOpen] = useState<string | null>(null)
  // if the customer paid on PhonePe but returned in a different browser, confirm it now
  useEffect(() => {
    orders
      .filter((o) => o.paymentMethod === 'phonepe' && o.paymentStatus === 'Payment Pending' && o.paymentRef)
      .forEach(async (o) => {
        const r = await checkPhonePe(o.paymentRef!, o)
        if (r.paid) updateOrder(o.id, { paymentStatus: 'Paid' })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders.length])
  // returns are allowed for a limited number of days after delivery
  const returnState = (o: Order): 'ok' | 'expired' => {
    const days = settings.returnDays ?? 7
    return o.deliveredAt && Date.now() - new Date(o.deliveredAt).getTime() > days * 86_400_000 ? 'expired' : 'ok'
  }
  return (
    <Gate>
      <PageTitle>My Orders</PageTitle>
      {orders.length === 0 ? (
        <Empty icon={Package} title="No orders yet" text="When you place an order it will appear here." href="/shop" cta="Start Shopping" />
      ) : (
        <ul className="mt-5 flex flex-col gap-4">
          {orders.map((o) => {
            const step = steps.indexOf(o.status)
            const ret = returns.find((r) => r.orderId === o.id)
            return (
              <li key={o.id} className={card}>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div><p className="font-medium">Order #{o.id}</p><p className="text-xs text-muted-foreground">{new Date(o.placedAt).toLocaleString('en-IN')}</p></div>
                  <div className="flex gap-2"><span className={badge(o.status)}>{o.status}</span><span className={badge(o.paymentStatus)}>{o.paymentStatus}</span></div>
                </div>
                <ul className="mt-4 flex flex-col gap-3">
                  {o.items.map((i) => (
                    <li key={i.slug} className="flex items-center gap-3 text-xs">
                      <span className="relative size-14 shrink-0 overflow-hidden rounded-lg"><Image src={i.image || '/placeholder.svg'} alt={i.name} fill sizes="56px" className="object-cover" /></span>
                      <span className="flex-1"><Link href={`/product/${i.slug}`} className="text-sm text-ink hover:text-primary">{i.name}</Link><span className="block text-muted-foreground">Qty {i.qty} · {formatINR(i.price)}</span></span>
                    </li>
                  ))}
                </ul>
                {o.status !== 'Cancelled' && step >= 0 && (
                  <ol className="mt-4 flex items-center gap-1 text-[10px] text-muted-foreground" aria-label="Order tracking">
                    {steps.map((s, i) => (<li key={s} className={cn('flex-1 rounded-full py-1 text-center', i <= step ? 'bg-primary text-white' : 'bg-muted')}>{s}</li>))}
                  </ol>
                )}
                <p className="mt-3 text-xs text-ink/80">Deliver to: {o.address.fullName}, {o.address.address}, {o.address.city}, {o.address.state} - {o.address.pincode} · +91 {o.address.phone}</p>
                {o.tracking && <p className="mt-1 text-xs text-ink/80">Tracking: {o.tracking}</p>}
                <p className="mt-2 flex justify-between border-t border-border pt-3 text-sm font-semibold"><span>Total ({o.paymentMethod.toUpperCase()})</span><span>{formatINR(o.total)}</span></p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {['Placed', 'Confirmed'].includes(o.status) && !o.cancelRequested && (
                    <button type="button" onClick={() => { updateOrder(o.id, { cancelRequested: true }); toast.success('Cancellation requested. The boutique will confirm.') }} className="rounded-lg border border-input px-3 py-2 text-ink hover:bg-blush">Request Cancellation</button>
                  )}
                  {o.cancelRequested && o.status !== 'Cancelled' && <span className="rounded-lg bg-amber-100 px-3 py-2 text-amber-700">Cancellation requested</span>}
                  {o.status === 'Delivered' && !ret && (returnState(o) === 'ok' ? <button type="button" onClick={() => setOpen(open === o.id ? null : o.id)} className="rounded-lg border border-input px-3 py-2 hover:bg-blush">Return / Refund</button> : <span className="rounded-lg bg-muted px-3 py-2 text-muted-foreground">Return window ({settings.returnDays ?? 7} days) has ended</span>)}
                  {ret && <span className={badge(ret.status)}>Return: {ret.status} · Refund: {ret.refundStatus}</span>}
                  {o.paymentMethod === 'phonepe' && o.paymentStatus === 'Payment Pending' && (
                    <Link href={`/pay/phonepe-return?order=${o.id}&start=1`} className="rounded-lg bg-primary px-3 py-2 text-white">Pay with PhonePe</Link>
                  )}
                  {o.paymentMethod === 'upi' && ['Payment Pending', 'Verification Pending'].includes(o.paymentStatus) && (
                    <Link href={`/pay/${o.id}`} className="rounded-lg bg-primary px-3 py-2 text-white">{o.paymentStatus === 'Payment Pending' ? 'Pay now / submit UTR' : 'Update payment details'}</Link>
                  )}
                  {o.paymentStatus === 'Payment Pending' && o.paymentMethod !== 'cod' && (
                    <a href={waHref(settings.whatsapp, `Hello! I have paid for order #${o.id} (${formatINR(o.total)}). Sharing the payment screenshot.`)} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-primary px-3 py-2 text-white">Send payment proof on WhatsApp</a>
                  )}
                </div>
                {open === o.id && <ReturnForm order={o} onDone={() => setOpen(null)} />}
              </li>
            )
          })}
        </ul>
      )}
    </Gate>
  )
}

export function BookingsView() {
  const { bookings, updateBooking } = useStore()
  return (
    <Gate>
      <PageTitle>My Bookings</PageTitle>
      {bookings.length === 0 ? (
        <Empty icon={CalendarDays} title="No bookings yet" text="Book a boutique service and it will appear here." href="/services" cta="View Services" />
      ) : (
        <ul className="mt-5 flex flex-col gap-4">
          {bookings.map((b) => (
            <li key={b.id} className={card}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><p className="font-medium">{b.service}</p><p className="text-xs text-muted-foreground">Booking #{b.id}</p></div>
                <span className={badge(b.status)}>{b.status === 'Pending' ? 'Pending owner confirmation' : b.status}</span>
              </div>
              <p className="mt-3 text-sm">{new Date(b.date).toLocaleDateString('en-IN', { dateStyle: 'long' })} · {b.time}</p>
              {b.notes && <p className="mt-1 text-xs text-muted-foreground">Your note: {b.notes}</p>}
              {b.ownerNote && <p className="mt-1 text-xs text-primary">Boutique note: {b.ownerNote}</p>}
              {b.changeRequest && <p className="mt-1 text-xs text-amber-700">Your request: {b.changeRequest}</p>}
              {['Pending', 'Accepted', 'Rescheduled'].includes(b.status) && (
                <div className="mt-3 flex gap-2 text-xs">
                  <button type="button" onClick={() => { const t = window.prompt('Preferred new date and time?'); if (t) { updateBooking(b.id, { changeRequest: `Reschedule: ${t}` }); toast.success('Reschedule request sent.') } }} className="rounded-lg border border-input px-3 py-2 hover:bg-blush">Request Reschedule</button>
                  <button type="button" onClick={() => { if (window.confirm('Cancel this booking?')) { updateBooking(b.id, { status: 'Cancelled' }); toast.success('Booking cancelled.') } }} className="rounded-lg border border-input px-3 py-2 hover:bg-blush">Cancel Booking</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Gate>
  )
}

export function ReviewsView() {
  const { myReviews, orders, bookings, addReview } = useStore()
  const [target, setTarget] = useState('')
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  // Only delivered products and completed services can be reviewed, once each.
  const options = [
    ...orders.filter((o) => o.status === 'Delivered').flatMap((o) => o.items.map((i) => ({ key: `product:${i.slug}`, kind: 'product' as const, ref: i.slug, name: i.name }))),
    ...bookings.filter((b) => b.status === 'Completed').map((b) => ({ key: `service:${b.serviceSlug}`, kind: 'service' as const, ref: b.serviceSlug, name: b.service })),
  ].filter((o, i, a) => a.findIndex((x) => x.key === o.key) === i && !myReviews.some((r) => `${r.kind}:${r.ref}` === o.key))
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const o = options.find((x) => x.key === target)
    if (!o) return toast.error('Please choose what you want to review.')
    if (text.trim().length < 5) return toast.error('Please write a few words of feedback.')
    addReview({ kind: o.kind, ref: o.ref, refName: o.name, rating, text: text.trim() })
    setTarget(''); setText(''); setRating(5)
    toast.success('Thank you for your review!')
  }
  return (
    <Gate>
      <PageTitle>My Reviews</PageTitle>
      <form onSubmit={submit} className={cn(card, 'mt-5 flex flex-col gap-3')}>
        <p className="text-sm font-medium">Write a review</p>
        {options.length === 0 ? (
          <p className="text-xs text-muted-foreground">You can review products after they are delivered and services after they are completed.</p>
        ) : (
          <>
            <select value={target} onChange={(e) => setTarget(e.target.value)} className={inputCls}>
              <option value="">Choose a purchase or service</option>
              {options.map((o) => <option key={o.key} value={o.key}>{o.name}</option>)}
            </select>
            <div className="flex gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} stars`} onClick={() => setRating(n)}><Star className={cn('size-6', n <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40')} /></button>
              ))}
            </div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Share your experience" className={inputCls + ' h-auto py-2'} />
            <button type="submit" className={btnPrimary + ' self-start'}>Submit Review</button>
          </>
        )}
      </form>
      {myReviews.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">You haven’t submitted any reviews yet.</p>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {myReviews.map((r) => (
            <li key={r.id} className={card}>
              <div className="flex justify-between text-sm"><span className="font-medium">{r.refName}</span><span className="text-xs text-muted-foreground">{new Date(r.date).toLocaleDateString('en-IN')}</span></div>
              <div className="mt-1 flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={cn('size-4', n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />)}</div>
              <p className="mt-2 text-sm text-ink/90">{r.text}</p>
              {r.hidden && <p className="mt-1 text-[11px] text-amber-700">Hidden by the boutique</p>}
              {r.reply && <p className="mt-2 rounded-lg bg-blush p-2 text-xs text-primary">Boutique reply: {r.reply}</p>}
            </li>
          ))}
        </ul>
      )}
    </Gate>
  )
}

export function AccountView() {
  const { user, logout, updateProfile, changePassword, saveAddress, removeAddress, orders, bookings, wishlist } = useStore()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [pw, setPw] = useState({ old: '', next: '' })
  const [addr, setAddr] = useState({ fullName: '', phone: '', address: '', city: '', state: '', pincode: '' })
  const [synced, setSynced] = useState(false)
  if (user && !synced) { setName(user.name); setPhone(user.phone); setSynced(true) }
  return (
    <Gate>
      <PageTitle>My Account</PageTitle>
      {user && (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <section className={card}>
            <div className="flex items-center gap-3">
              <span className="flex size-14 items-center justify-center rounded-full bg-blush font-serif text-xl text-primary">{user.name.slice(0, 1).toUpperCase()}</span>
              <div><p className="font-medium">{user.name}</p><p className="text-xs text-muted-foreground">{user.email}</p></div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{orders.length} orders · {bookings.length} bookings · {wishlist.length} wishlist items</p>
            <form className="mt-4 flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); if (phone.replace(/\D/g, '').length !== 10) return toast.error('Enter a valid 10-digit phone.'); updateProfile({ name, phone }); toast.success('Profile updated.') }}>
              <input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} className={inputCls} aria-label="Name" />
              <input value={user.email} disabled className={inputCls + ' bg-muted'} aria-label="Email" />
              <input required maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} aria-label="Phone" />
              <button type="submit" className={btnPrimary}>Save Profile</button>
            </form>
            <form className="mt-6 flex flex-col gap-3 border-t border-border pt-5" onSubmit={async (e) => { e.preventDefault(); const err = await changePassword(pw.old, pw.next); if (err) toast.error(err); else { toast.success('Password changed.'); setPw({ old: '', next: '' }) } }}>
              <p className="text-sm font-medium">Change Password</p>
              <input required type="password" placeholder="Current password" value={pw.old} onChange={(e) => setPw({ ...pw, old: e.target.value })} className={inputCls} />
              <input required minLength={6} type="password" placeholder="New password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} className={inputCls} />
              <button type="submit" className={btnOutline}>Update Password</button>
            </form>
            <button type="button" onClick={() => { logout(); toast.success('Logged out.') }} className={btnOutline + ' mt-4 w-full'}>Logout</button>
          </section>
          <section className={card}>
            <p className="text-sm font-medium">Saved Addresses</p>
            <ul className="mt-3 flex flex-col gap-2">
              {user.addresses.length === 0 && <li className="text-xs text-muted-foreground">No saved addresses.</li>}
              {user.addresses.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 rounded-xl bg-blush p-3 text-xs">
                  <span>{a.fullName} · +91 {a.phone}<br />{a.address}, {a.city}, {a.state} - {a.pincode}</span>
                  <button type="button" onClick={() => removeAddress(a.id)} aria-label="Remove address" className="text-primary"><Trash2 className="size-4" /></button>
                </li>
              ))}
            </ul>
            <form className="mt-4 grid grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); if (addr.phone.replace(/\D/g, '').length !== 10 || addr.pincode.replace(/\D/g, '').length !== 6) return toast.error('Check phone (10 digits) and pincode (6 digits).'); saveAddress(addr); setAddr({ fullName: '', phone: '', address: '', city: '', state: '', pincode: '' }); toast.success('Address saved.') }}>
              {(['fullName', 'phone', 'address', 'city', 'state', 'pincode'] as const).map((k) => (
                <input key={k} required placeholder={{ fullName: 'Full name', phone: 'Phone', address: 'Address', city: 'City', state: 'State', pincode: 'Pincode' }[k]} value={addr[k]} onChange={(e) => setAddr({ ...addr, [k]: e.target.value })} className={cn(inputCls, k === 'address' && 'col-span-2')} />
              ))}
              <button type="submit" className={btnPrimary + ' col-span-2'}>Add Address</button>
            </form>
          </section>
        </div>
      )}
    </Gate>
  )
}
