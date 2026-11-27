import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, MessageCircle } from 'lucide-react'

export const metadata: Metadata = { title: 'Order Confirmed — Aadhya Fashions Studios' }

export default async function OrderConfirmationPage({ params, searchParams }: PageProps<'/order/[id]'>) {
  const { id } = await params
  const { total, pay } = await searchParams
  const amount = Number(typeof total === 'string' ? total : 0)
  const waText = `Hello Aadhya Fashions Studios! I just placed order #${id}${amount > 0 ? ` (₹${amount.toLocaleString('en-IN')})` : ''}. Please confirm.`
  return (
    <div className="px-4 pt-6 md:px-8">
      <section className="floral-bg mx-auto flex max-w-2xl flex-col items-center rounded-3xl bg-white px-6 py-14 text-center ring-1 ring-border">
        <span className="flex size-20 animate-in zoom-in items-center justify-center rounded-full bg-primary text-white shadow-xl shadow-primary/30 duration-500">
          <Check className="size-10" strokeWidth={2.5} />
        </span>
        <h1 className="mt-6 font-serif text-3xl font-semibold text-primary md:text-4xl">Thank You!</h1>
        <p className="mt-2 text-sm text-ink/80">Your order has been placed successfully.</p>
        <p className="mt-6 text-sm text-ink">
          Order ID: <span className="font-medium">#{id}</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Estimated Delivery: 3 - 5 Business Days</p>
        <p className="mt-3 rounded-full bg-blush px-4 py-1.5 text-xs text-primary">
          {pay === 'paid' ? 'Payment successful ✓' : pay === 'cod' ? 'Pay in cash on delivery' : 'Payment status: Pending — it updates to Paid once payment is verified'}
        </p>
        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <Link href="/orders" className="flex h-11 items-center justify-center rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90">
            View Order Details
          </Link>
          <Link href="/shop" className="flex h-11 items-center justify-center rounded-lg border border-primary text-sm text-primary hover:bg-blush">
            Continue Shopping
          </Link>
        </div>
        <p className="mt-10 flex items-center gap-2 text-sm text-ink/75">
          <MessageCircle className="size-4 text-primary" />
          {"You'll receive an order confirmation on your WhatsApp shortly."}
        </p>
        <a
          href={`/api/whatsapp?text=${encodeURIComponent(waText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Message us on WhatsApp
        </a>
      </section>
    </div>
  )
}
