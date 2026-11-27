'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { products } from '@/lib/catalog'
import { ProductCard } from '@/components/shop/product-card'
import { SortSelect, sortProducts, type SortKey } from '@/components/shop/sort-select'

export function FeaturedGrid() {
  const [sort, setSort] = useState<SortKey>('popular')
  const items = useMemo(() => sortProducts(products.filter((p) => p.featured), sort), [sort])

  return (
    <section aria-labelledby="featured-heading" className="mt-6 md:mt-8">
      <div className="flex items-center justify-between gap-4 border-b border-rose-line pb-3 md:border-0 md:pb-0">
        <div>
          <h2 id="featured-heading" className="font-serif text-[22px] text-ink md:text-[22px]">
            <span className="flex items-center gap-2 md:hidden">
              <svg viewBox="0 0 40 28" className="h-7 w-9 text-primary" fill="currentColor" fillOpacity=".16" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 2c-5 6-5 14 0 22 5-8 5-16 0-22Z" />
                <path d="M20 24c-7-1-11-8-10-15 4 1 8 6 10 15Z" />
                <path d="M20 24c7-1 11-8 10-15-4 1-8 6-10 15Z" />
                <path d="M20 24c-8 1-15-3-18-10 6-1 13 3 18 10Z" />
                <path d="M20 24c8 1 15-3 18-10-6-1-13 3-18 10Z" />
              </svg>
              Featured Collection
            </span>
            <span className="hidden md:inline">{items.length} pieces</span>
          </h2>
          <span className="mt-2 hidden h-[3px] w-10 rounded-full bg-primary md:block" aria-hidden="true" />
        </div>
        <SortSelect value={sort} onChange={setSort} className="hidden md:flex" />
        <Link href="/shop" className="flex items-center gap-1.5 text-sm text-primary md:hidden">
          View All <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2.5 md:mt-5 md:gap-4 lg:grid-cols-3 2xl:grid-cols-4">
        {items.map((p, i) => (
          <ProductCard key={p.slug} product={p} priority={i < 2} />
        ))}
      </div>
    </section>
  )
}
