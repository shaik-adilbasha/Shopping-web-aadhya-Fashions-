'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { formatINR } from '@/lib/catalog'
import { checkPhonePe } from '@/lib/phonepe-client'
import { useStore } from '@/lib/store'
import { btnOutline, btnPrimary, waHref } from '@/lib/wa'

type Phase = 'starting' | 'checking' | 'paid' | 'failed' | 'pending' | 'error'
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const card = 'mx-auto mt-8 max-w-md rounded-2xl bg-white p-8 text-center ring-1 ring-border'

export function PhonePeReturn() {
  return (
    <Suspense>
      <Keyed />
    </Suspense>
  )
}

// a new URL (retry, return from PhonePe) starts a completely fresh run
function Keyed() {
  const sp = useSearchParams()
  return <Inner key={sp.toString()} />
}

function Inner() {
  const sp = useSearchParams()
  const orderId = sp.get('order') ?? ''
  const mParam = sp.get('m') ?? ''
  const start = sp.get('start') === '1'
  const { orders, ready, updateOrder, settings } = useStore()
  const order = orders.find((o) => o.id === orderId)
  const [phase, setPhase] = useState<Phase>(start ? 'starting' : 'checking')
  const [msg, setMsg] = useState('')
  const [run, setRun] = useState(0)
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const begin = useCallback(async () => {
    if (!order) return
    try {
      const r = await fetch('/api/phonepe/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: order.id, amount: order.total }) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.redirectUrl) {
        setPhase('error')
        setMsg(d.error ?? 'Could not start the PhonePe payment.')
        return
      }
      updateOrder(order.id, { paymentRef: d.merchantOrderId })
      await sleep(500) // let the order be saved before leaving this page
      window.location.href = d.redirectUrl
    } catch {
      setPhase('error')
      setMsg('Could not reach the payment service. Please check your internet and try again.')
    }
  }, [order, updateOrder])

  const poll = useCallback(async () => {
    const m = mParam || order?.paymentRef
    if (!m) {
      setPhase('error')
      setMsg('We could not find this payment. Please check My Orders.')
      return
    }
    setPhase('checking')
    for (let i = 0; i < 40 && alive.current; i++) {
      const res = await checkPhonePe(m, order)
      if (res.state === 'COMPLETED') {
        if (order && !res.paid) {
          setPhase('error')
          setMsg('PhonePe received a payment, but its amount does not match this order. Please contact the shop.')
        } else {
          if (order) updateOrder(order.id, { paymentStatus: 'Paid', paymentRef: m })
          setPhase('paid')
        }
        return
      }
      if (res.state === 'FAILED') return setPhase('failed')
      await sleep(3000)
    }
    if (alive.current) setPhase('pending')
  }, [mParam, order, updateOrder])

  const started = useRef(-1)
  useEffect(() => {
    if (!ready || started.current === run) return
    started.current = run
    if (!order && start) {
      setPhase('error')
      setMsg('We could not find your order. Please log in with the account you ordered with.')
      return
    }
    void (start && run === 0 ? begin() : poll())
  }, [ready, run, order, start, begin, poll])

  const retryHref = `/pay/phonepe-return?order=${orderId}&start=1`
  return (
    <div className="px-4 pt-6 md:px-8">
      {(phase === 'starting' || phase === 'checking') && (
        <div className={card}>
          <Loader2 className="mx-auto size-10 animate-spin text-primary" />
          <p className="mt-4 font-serif text-xl text-ink">{phase === 'starting' ? 'Opening PhonePe…' : 'Confirming your payment…'}</p>
          <p className="mt-1 text-sm text-muted-foreground">{phase === 'starting' ? 'Please wait, do not close this page.' : 'Please do not close or refresh this page.'}</p>
        </div>
      )}
      {phase === 'paid' && (
        <div className={card}>
          <CheckCircle2 className="mx-auto size-14 text-green-600" />
          <p className="mt-3 font-serif text-2xl text-ink">Payment successful</p>
          {order ? <p className="mt-1 text-sm text-muted-foreground">{formatINR(order.total)} paid for order #{order.id}</p> : <p className="mt-1 text-sm text-muted-foreground">Your payment was received. Open My Orders in the browser where you placed the order to see it.</p>}
          <Link href={order ? `/order/${order.id}?total=${order.total}&pay=paid` : '/orders'} className={btnPrimary + ' mt-6'}>View Order</Link>
          <Link href="/shop" className={btnOutline + ' mt-3'}>Continue Shopping</Link>
        </div>
      )}
      {phase === 'failed' && (
        <div className={card}>
          <XCircle className="mx-auto size-14 text-destructive" />
          <p className="mt-3 font-serif text-2xl text-ink">Payment failed</p>
          <p className="mt-1 text-sm text-muted-foreground">If any money was deducted, your bank usually returns it automatically within a few days.</p>
          {order && <a href={retryHref} className={btnPrimary + ' mt-6'}>Try Again</a>}
          <Link href="/orders" className={btnOutline + ' mt-3'}>My Orders</Link>
        </div>
      )}
      {phase === 'pending' && (
        <div className={card}>
          <Loader2 className="mx-auto size-10 text-amber-500" />
          <p className="mt-3 font-serif text-xl text-ink">Still waiting for confirmation</p>
          <p className="mt-1 text-sm text-muted-foreground">Please don’t pay again. If money was deducted, your order will update by itself — check My Orders in a few minutes.</p>
          <button type="button" onClick={() => setRun((n) => n + 1)} className={btnPrimary + ' mt-6 w-full'}>Check Again</button>
          <Link href="/orders" className={btnOutline + ' mt-3'}>My Orders</Link>
          <a href={waHref(settings.whatsapp, `Hello! My PhonePe payment for order #${orderId} is not confirmed yet.`)} target="_blank" rel="noopener noreferrer" className="mt-3 block text-xs text-primary underline">WhatsApp the shop</a>
        </div>
      )}
      {phase === 'error' && (
        <div className={card}>
          <XCircle className="mx-auto size-12 text-destructive" />
          <p role="alert" className="mt-3 text-sm text-ink">{msg}</p>
          {order && start && <a href={retryHref} className={btnPrimary + ' mt-5'}>Try Again</a>}
          <Link href="/orders" className={btnOutline + ' mt-3'}>My Orders</Link>
        </div>
      )}
    </div>
  )
}
