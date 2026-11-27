'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ShoppingBag, X } from 'lucide-react'
import { formatINR, getProduct } from '@/lib/catalog'
import { useStore } from '@/lib/store'
import { PageTitle, QuantityStepper } from '@/components/shop/ui-bits'

export function CartView() {
  const { cart, subtotal, setQty, removeFromCart } = useStore()

  if (cart.length === 0) {
    return (
      <div className="px-4 pt-6 md:px-8">
        <PageTitle>Your Cart</PageTitle>
        <EmptyState />
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 md:px-8">
      <PageTitle>Your Cart</PageTitle>
      <div className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-border md:p-6">
        <div className="hidden grid-cols-[1fr_100px_120px_100px_32px] gap-4 border-b border-border pb-3 text-xs font-medium text-ink md:grid">
          <span>Product</span>
          <span>Price</span>
          <span>Quantity</span>
          <span>Total</span>
          <span className="sr-only">Remove</span>
        </div>
        <ul className="divide-y divide-border">
          {cart.map((item) => {
            const p = getProduct(item.slug)
            if (!p) return null
            return (
              <li key={item.slug} className="grid grid-cols-[64px_1fr_auto] items-center gap-x-3 gap-y-2 py-4 md:grid-cols-[1fr_100px_120px_100px_32px] md:gap-4">
                <div className="contents md:flex md:items-center md:gap-3">
                  <Link href={`/product/${p.slug}`} className="relative row-span-2 size-16 overflow-hidden rounded-lg md:size-14">
                    <Image src={p.images[0] || '/placeholder.svg'} alt={p.name} fill sizes="64px" className="object-cover" />
                  </Link>
                  <div className="min-w-0">
                    <Link href={`/product/${p.slug}`} className="text-sm text-ink hover:text-primary">
                      {p.name}
                    </Link>
                    {item.color && <p className="text-xs text-muted-foreground">{item.color}</p>}
                  </div>
                </div>
                <span className="hidden text-sm md:block">{formatINR(p.price)}</span>
                <QuantityStepper value={item.qty} onChange={(v) => setQty(p.slug, v)} max={Math.min(p.stock, 10)} className="col-start-2 w-fit md:col-start-auto" />
                <span className="col-start-3 row-start-1 text-sm font-medium md:col-start-auto md:row-start-auto">{formatINR(p.price * item.qty)}</span>
                <button
                  type="button"
                  onClick={() => removeFromCart(p.slug)}
                  aria-label={`Remove ${p.name}`}
                  className="col-start-3 row-start-2 justify-self-end rounded-full p-1 text-primary hover:bg-blush md:col-start-auto md:row-start-auto"
                >
                  <X className="size-4" />
                </button>
              </li>
            )
          })}
        </ul>
        <dl className="ml-auto mt-4 flex w-full max-w-xs flex-col gap-3 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink/80">Subtotal</dt>
            <dd>{formatINR(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink/80">Shipping</dt>
            <dd className="text-emerald-700">Free</dd>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatINR(subtotal)}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Link href="/shop" className="flex h-11 items-center justify-center rounded-lg border border-primary px-6 text-sm text-primary hover:bg-blush">
            Continue Shopping
          </Link>
          <Link
            href="/checkout"
            className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-white shadow-lg shadow-primary/25 hover:bg-primary/90"
          >
            Proceed to Checkout <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export function EmptyState({ title = 'Your cart is empty', text = 'Discover sarees, jewellery and more crafted for your special moments.' }: { title?: string; text?: string }) {
  return (
    <div className="floral-bg mt-6 flex flex-col items-center rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-border">
      <span className="flex size-16 items-center justify-center rounded-full bg-rose-soft text-primary">
        <ShoppingBag className="size-7" />
      </span>
      <p className="mt-4 font-serif text-xl text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>
      <Link href="/shop" className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm text-white hover:bg-primary/90">
        Start Shopping
      </Link>
    </div>
  )
}
