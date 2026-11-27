'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CheckCircle2, Copy, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { formatINR } from '@/lib/catalog'
import { compressImage } from '@/lib/image'
import { notifyOrder } from '@/lib/notify'
import { useStore } from '@/lib/store'
import { btnOutline, btnPrimary, inputCls, waHref } from '@/lib/wa'
import { PageTitle } from '@/components/shop/ui-bits'

const card = 'rounded-2xl bg-white p-5 ring-1 ring-border'

export function PayView({ id }: { id: string }) {
  const router = useRouter()
  const { orders, allOrders, ready, user, settings, updateOrder } = useStore()
  const order = orders.find((o) => o.id === id)
  const [utr, setUtr] = useState('')
  const [proof, setProof] = useState('')
  const [busy, setBusy] = useState(false)

  if (!ready) return <p className="px-4 pt-10 text-center text-sm text-muted-foreground md:px-8">Loading…</p>
  if (!user || !order)
    return (
      <div className="px-4 pt-10 text-center md:px-8">
        <p className="font-serif text-xl text-ink">Order not found</p>
        <p className="mt-1 text-sm text-muted-foreground">Please log in with the account you used to place the order.</p>
        <Link href="/login?next=/orders" className={btnPrimary + ' mx-auto mt-5 w-fit'}>Login</Link>
      </div>
    )

  const hasDetails = !!(settings.upiQr || settings.upiId)
  const upiLink = settings.upiId
    ? `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.boutiqueName)}&am=${order.total.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Order ' + order.id)}`
    : ''

  if (order.paymentStatus === 'Paid')
    return (
      <div className="px-4 pt-6 md:px-8">
        <div className={card + ' mx-auto max-w-md text-center'}>
          <CheckCircle2 className="mx-auto size-10 text-green-600" />
          <p className="mt-2 font-serif text-xl">Payment received</p>
          <Link href="/orders" className={btnPrimary + ' mx-auto mt-5 w-fit'}>My Orders</Link>
        </div>
      </div>
    )

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ref = utr.replace(/\s/g, '')
    if (!/^\d{12}$/.test(ref)) return toast.error('Enter the 12-digit UPI reference number (UTR) from your payment app.')
    if (allOrders.some((o) => o.id !== order.id && o.utr === ref)) return toast.error('This reference number was already used for another order.')
    setBusy(true)
    updateOrder(order.id, { utr: ref, paymentProof: proof || undefined, paymentStatus: 'Verification Pending' })
    notifyOrder({ ...order, utr: ref }, undefined, ref)
    toast.success('Thank you! We will verify your payment shortly.')
    router.push(`/order/${order.id}?total=${order.total}&pay=upi`)
  }

  return (
    <div className="px-4 pt-6 md:px-8">
      <PageTitle>Pay with UPI</PageTitle>
      <div className="mx-auto mt-5 grid max-w-3xl gap-5 md:grid-cols-2">
        <section className={card + ' text-center'}>
          <p className="text-xs text-muted-foreground">Order #{order.id}</p>
          <p className="mt-1 font-serif text-3xl text-primary">{formatINR(order.total)}</p>
          <p className="text-xs text-muted-foreground">Pay exactly this amount</p>
          {hasDetails ? (
            <>
              {settings.upiQr && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.upiQr} alt={`UPI QR code to pay ${settings.boutiqueName}`} className="mx-auto mt-4 size-56 rounded-xl object-contain ring-1 ring-border" />
              )}
              {settings.upiId && (
                <p className="mt-3 flex items-center justify-center gap-2 text-sm">
                  UPI ID: <b>{settings.upiId}</b>
                  <button type="button" aria-label="Copy UPI ID" onClick={() => { navigator.clipboard?.writeText(settings.upiId); toast.success('UPI ID copied') }} className="text-primary"><Copy className="size-4" /></button>
                </p>
              )}
              {upiLink && (
                <a href={upiLink} className={btnPrimary + ' mt-4 gap-2 md:hidden'}><Smartphone className="size-4" /> Open UPI app to pay</a>
              )}
              <p className="mt-3 text-[11px] text-muted-foreground">Scan the QR with any UPI app (PhonePe, Google Pay, Paytm…). If the button doesn’t open your app, scan the QR instead.</p>
            </>
          ) : (
            <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              The shop hasn’t added its UPI details yet. Please contact us on WhatsApp to complete payment.
              <a href={waHref(settings.whatsapp, `Hello! I placed order #${order.id} (${formatINR(order.total)}). Please share payment details.`)} target="_blank" rel="noopener noreferrer" className={btnOutline + ' mt-3'}>WhatsApp us</a>
            </div>
          )}
        </section>

        <form onSubmit={submit} className={card + ' flex flex-col gap-3'}>
          <h2 className="text-base font-medium">After you pay</h2>
          {order.paymentStatus === 'Verification Pending' && (
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Reference {order.utr} submitted. You can correct it below if it was wrong.</p>
          )}
          <label className="flex flex-col gap-1 text-xs text-ink/80">
            UPI reference number (UTR) — 12 digits
            <input required inputMode="numeric" maxLength={14} placeholder="e.g. 412345678901" value={utr} onChange={(e) => setUtr(e.target.value)} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink/80">
            Payment screenshot (optional)
            <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { setProof(await compressImage(f)) } catch { toast.error('Could not read that image.') } } }} className="text-xs" />
          </label>
          <button type="submit" disabled={busy || !hasDetails} className={btnPrimary}>Submit Payment Details</button>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Your order stays <b>Payment Pending</b> until the shop checks the money in their account and confirms it. Entering a wrong or fake reference number will delay your order.
          </p>
          <Link href="/orders" className="text-center text-xs text-primary underline">Pay later — go to My Orders</Link>
        </form>
      </div>
    </div>
  )
}
