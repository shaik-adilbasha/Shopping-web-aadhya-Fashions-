'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Heart, MessageCircle, Share2, ShoppingBag, ShoppingCart, Star } from 'lucide-react'
import { toast } from 'sonner'
import { discountPercent, formatINR, getProduct, type Product } from '@/lib/catalog'
import { waHref } from '@/lib/wa'
import { TRY_ON_CATEGORIES, TryOnLive } from './try-on-live'
import { useStore } from '@/lib/store'
import { QuantityStepper } from '@/components/shop/ui-bits'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export function ProductDetail({ product: serverProduct }: { product: Product }) {
  // use the live catalog so owner price/stock edits show immediately
  const product = getProduct(serverProduct.slug) ?? serverProduct
  const router = useRouter()
  const { addToCart, toggleWishlist, isWishlisted, settings } = useStore()
  const out = product.stock <= 0
  const [active, setActive] = useState(0)
  const [color, setColor] = useState(product.colors[0]?.name)
  const [qty, setQty] = useState(1)
  const wished = isWishlisted(product.slug)
  const max = Math.min(product.stock, 10)

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: product.name, url })
      else {
        await navigator.clipboard.writeText(url)
        toast.success('Link copied')
      }
    } catch {}
  }

  return (
    <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-border md:p-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10">
        <div className="flex flex-col-reverse gap-3 md:flex-row">
          <div className="flex gap-3 md:flex-col" role="tablist" aria-label="Product images">
            {product.images.map((img, i) => (
              <button
                key={img}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Image ${i + 1}`}
                onClick={() => setActive(i)}
                className={cn(
                  'relative size-16 overflow-hidden rounded-lg ring-1 ring-border transition md:size-20',
                  i === active && 'ring-2 ring-primary',
                )}
              >
                <Image src={img || '/placeholder.svg'} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
          <div className="relative aspect-square flex-1 overflow-hidden rounded-xl bg-muted">
            <Image
              key={product.images[active]}
              src={product.images[active] || '/placeholder.svg'}
              alt={product.name}
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="animate-in fade-in object-cover duration-500"
            />
          </div>
        </div>

        <div>
          <h1 className="font-serif text-2xl font-medium text-ink md:text-3xl">{product.name}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-2xl font-semibold text-ink">{formatINR(product.price)}</span>
            <span className="text-muted-foreground line-through">{formatINR(product.mrp)}</span>
            <span className="rounded bg-primary px-2 py-0.5 text-xs font-medium text-white">{discountPercent(product)}% OFF</span>
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="flex text-amber-500" aria-hidden="true">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className={cn('size-4', i < Math.round(product.rating) ? 'fill-amber-500' : 'fill-none')} />
              ))}
            </span>
            {product.rating} ({product.reviews} reviews)
          </p>

          <div className="mt-6">
            <p className="text-sm text-ink">
              Color: <span className="text-muted-foreground">{color}</span>
            </p>
            <div className="mt-2 flex gap-3" role="radiogroup" aria-label="Color">
              {product.colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  role="radio"
                  aria-checked={color === c.name}
                  aria-label={c.name}
                  onClick={() => setColor(c.name)}
                  className={cn(
                    'size-7 rounded-full ring-1 ring-black/10 transition-transform hover:scale-110',
                    color === c.name && 'ring-2 ring-primary ring-offset-2',
                  )}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <span className="text-sm text-ink">Quantity</span>
            <QuantityStepper value={qty} onChange={(v) => setQty(Math.max(1, Math.min(max, v)))} max={max} />
            <span className={cn('text-xs', product.stock <= 5 ? 'text-primary' : 'text-muted-foreground')}>
              {out ? 'Out of Stock' : product.stock <= 5 ? `Only ${product.stock} left` : 'In stock'}
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:max-w-sm">
            <button
              type="button"
              disabled={out}
              onClick={() => addToCart(product.slug, qty, color)}
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-white shadow-lg shadow-primary/25 transition hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
            >
              <ShoppingCart className="size-4" /> Add to Cart
            </button>
            <button
              type="button"
              disabled={out}
              onClick={() => {
                addToCart(product.slug, qty, color)
                router.push('/checkout')
              }}
              className="flex h-11 items-center justify-center gap-2 rounded-lg border border-primary text-sm font-medium text-primary transition hover:bg-blush disabled:opacity-50"
            >
              <ShoppingBag className="size-4" /> Buy Now
            </button>
            <a
              href={waHref(settings.whatsapp, `Hello! I'm interested in: ${product.name}\nPrice: ₹${product.price.toLocaleString('en-IN')}\nLink: ${typeof window !== 'undefined' ? window.location.origin : ''}/product/${product.slug}\nPlease share more details.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center justify-center gap-2 rounded-lg border border-input text-sm text-ink transition hover:bg-blush"
            >
              <MessageCircle className="size-4 text-primary" /> WhatsApp Enquiry
            </a>
            {TRY_ON_CATEGORIES.includes(product.category) && <TryOnLive product={product} color={color} />}
          </div>

          <div className="mt-4 flex items-center gap-6 text-sm text-ink/80">
            <button type="button" onClick={() => toggleWishlist(product.slug)} aria-pressed={wished} className="flex items-center gap-1.5 hover:text-primary">
              <Heart className={cn('size-4 text-primary', wished && 'fill-primary')} />
              {wished ? 'Wishlisted' : 'Add to Wishlist'}
            </button>
            <button type="button" onClick={share} className="flex items-center gap-1.5 hover:text-primary">
              <Share2 className="size-4 text-primary" /> Share
            </button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="description" className="mt-8">
        <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-border bg-transparent p-0">
          {['description', 'specifications', 'reviews'].map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className="rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-2.5 text-sm capitalize text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              {t === 'description' ? 'Product Description' : t}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="description" className="pt-4">
          <p className="max-w-3xl text-sm leading-relaxed text-ink/80">{product.description}</p>
          <ul className="mt-4 grid max-w-lg grid-cols-2 gap-x-8 gap-y-2 text-sm text-ink/85">
            {product.highlights.map((h) => (
              <li key={h} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                {h}
              </li>
            ))}
          </ul>
        </TabsContent>
        <TabsContent value="specifications" className="pt-4">
          <dl className="grid max-w-lg grid-cols-[auto_1fr] gap-x-8 gap-y-2 text-sm">
            {Object.entries(product.specs).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </TabsContent>
        <TabsContent value="reviews" className="pt-4">
          <p className="text-sm text-ink/80">
            Rated <strong className="text-ink">{product.rating}/5</strong> by {product.reviews} happy customers. Purchased this piece? Share your review from My Orders.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
