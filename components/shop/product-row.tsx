'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingCart } from 'lucide-react'
import { formatINR, type Product } from '@/lib/catalog'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function ProductRow({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, isWishlisted } = useStore()
  const wished = isWishlisted(product.slug)
  return (
    <article className="flex items-center gap-4 rounded-2xl bg-white p-3 ring-1 ring-border transition-shadow hover:shadow-md">
      <Link href={`/product/${product.slug}`} className="relative size-24 shrink-0 overflow-hidden rounded-xl">
        <Image src={product.images[0] || '/placeholder.svg'} alt={product.name} fill sizes="96px" className="object-cover" />
      </Link>
      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] text-ink">
          <Link href={`/product/${product.slug}`} className="hover:text-primary">
            {product.name}
          </Link>
        </h3>
        <p className="text-xs text-muted-foreground">{product.subtitle}</p>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="font-medium">{formatINR(product.price)}</span>
          <span className="text-xs text-muted-foreground line-through">{formatINR(product.mrp)}</span>
        </p>
      </div>
      <button
        type="button"
        onClick={() => toggleWishlist(product.slug)}
        aria-label="Toggle wishlist"
        aria-pressed={wished}
        className="rounded-full p-2 text-primary hover:bg-blush"
      >
        <Heart className={cn('size-5', wished && 'fill-primary')} />
      </button>
      <button
        type="button"
        onClick={() => addToCart(product.slug)}
        className="hidden h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm text-white hover:bg-primary/90 sm:flex"
      >
        <ShoppingCart className="size-4" /> Add to Cart
      </button>
    </article>
  )
}
