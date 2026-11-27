'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import { discountPercent, formatINR, type Product } from '@/lib/catalog'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function ProductCard({ product, showRating = false, priority = false }: { product: Product; showRating?: boolean; priority?: boolean }) {
  const { addToCart, toggleWishlist, isWishlisted } = useStore()
  const wished = isWishlisted(product.slug)
  const off = discountPercent(product)

  return (
    <article className="group flex flex-col rounded-xl bg-card p-1.5 shadow-[0_4px_20px_-8px_rgb(216_27_106/0.18)] ring-1 ring-border transition-all duration-300 md:rounded-2xl md:p-2.5 hover:-translate-y-1 hover:shadow-[0_16px_32px_-12px_rgb(216_27_106/0.3)]">
      <div className="relative aspect-[1.29] overflow-hidden rounded-lg md:aspect-[1.15] md:rounded-xl bg-muted">
        <Link href={`/product/${product.slug}`} aria-label={product.name}>
          <Image
            src={product.images[0] || '/placeholder.svg'}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
        {off > 0 && (
          <span className="absolute left-2 top-2 hidden rounded-md bg-primary md:block px-2 py-1 text-[11px] font-medium text-white">
            {off}% off
          </span>
        )}
        <button
          type="button"
          onClick={() => toggleWishlist(product.slug)}
          aria-pressed={wished}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          className="absolute right-1.5 top-1.5 flex size-7 md:right-2 md:top-2 md:size-8 items-center justify-center rounded-full bg-white/95 text-primary shadow-sm transition-transform hover:scale-110 active:scale-95"
        >
          <Heart className={cn('size-[18px]', wished && 'fill-primary')} strokeWidth={1.8} />
        </button>
      </div>

      <div className="flex flex-1 flex-col px-1 pb-0.5 pt-2.5 md:px-1.5 md:pb-1 md:pt-3">
        <h3 className="text-sm font-normal leading-snug text-ink md:text-[15px]">
          <Link href={`/product/${product.slug}`} className="hover:text-primary">
            {product.name}
          </Link>
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground md:hidden">{product.subtitle}</p>
        <p className="mt-1.5 flex items-baseline gap-2 md:mt-2">
          <span className="text-base font-semibold text-primary md:font-medium md:text-ink">{formatINR(product.price)}</span>
          <span className="hidden text-xs text-muted-foreground line-through md:inline">{formatINR(product.mrp)}</span>
        </p>
        {showRating && (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
            <span className="flex text-primary" aria-hidden="true">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className={cn('size-3', i < Math.round(product.rating) ? 'fill-primary' : 'fill-none')} />
              ))}
            </span>
            {product.rating} ({product.reviews})
          </p>
        )}
        <button
          type="button"
          onClick={() => addToCart(product.slug)}
          className="mt-2.5 flex h-9 w-full items-center justify-center gap-2 rounded-md bg-primary text-[13px] font-medium md:rounded-lg md:font-normal md:text-sm text-white transition-colors hover:bg-primary/90 active:scale-[0.98] md:mt-auto md:h-11 md:bg-rose-soft/70 md:text-primary md:hover:bg-primary md:hover:text-white"
        >
          <ShoppingCart className="size-[18px]" strokeWidth={1.8} />
          Add to Cart
        </button>
      </div>
    </article>
  )
}
