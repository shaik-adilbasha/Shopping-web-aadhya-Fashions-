'use client'

import Link from 'next/link'
import { categoryLabel, getProduct } from '@/lib/catalog'
import { useStore } from '@/lib/store'
import { ProductDetail } from './product-detail'

export function CustomProductFallback({ slug }: { slug: string }) {
  const { ready, catalogVersion } = useStore()
  const product = getProduct(slug)
  if (!product)
    return (
      <div className="px-4 pt-16 text-center md:px-8">
        <p className="font-serif text-2xl text-ink">{ready ? 'Product not found' : 'Loading…'}</p>
        {ready && <Link href="/shop" className="mt-4 inline-block text-sm text-primary underline">Back to shop</Link>}
      </div>
    )
  return (
    <div className="px-4 pt-5 md:px-8" key={catalogVersion}>
      <p className="text-xs text-muted-foreground">{categoryLabel(product.category)} / {product.name}</p>
      <ProductDetail product={product} />
    </div>
  )
}
