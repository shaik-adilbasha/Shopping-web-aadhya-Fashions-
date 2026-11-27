import type { Metadata } from 'next'
import { ShopView } from '@/components/shop/shop-view'
import { categoryLabel } from '@/lib/catalog'

export async function generateMetadata({ searchParams }: PageProps<'/shop'>): Promise<Metadata> {
  const { category } = await searchParams
  const label = typeof category === 'string' ? categoryLabel(category) : 'All Products'
  return { title: `${label} — Aadhya Fashions Studios` }
}

export default async function ShopPage({ searchParams }: PageProps<'/shop'>) {
  const { category, q } = await searchParams
  return (
    <ShopView
      key={`${category ?? ''}-${q ?? ''}`}
      initialCategory={typeof category === 'string' ? category : null}
      query={typeof q === 'string' ? q : ''}
    />
  )
}
