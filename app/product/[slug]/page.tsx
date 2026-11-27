import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { categoryLabel, getProduct, products } from '@/lib/catalog'
import { ProductDetail } from '@/components/product/product-detail'
import { CustomProductFallback } from '@/components/product/custom-product'
import { ProductCard } from '@/components/shop/product-card'

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps<'/product/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const p = getProduct(slug)
  return p ? { title: `${p.name} — Aadhya Fashions Studios`, description: p.description } : {}
}

export default async function ProductPage({ params }: PageProps<'/product/[slug]'>) {
  const { slug } = await params
  const product = getProduct(slug)
  // Products added by the owner live in the browser store, so resolve them on the client.
  if (!product) return <CustomProductFallback slug={slug} />
  const related = products.filter((p) => p.category === product.category && p.slug !== product.slug).slice(0, 4)

  return (
    <div className="px-4 pt-5 md:px-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <ChevronRight className="size-3" />
        <Link href={`/shop?category=${product.category}`} className="hover:text-primary">
          {categoryLabel(product.category)}
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-ink" aria-current="page">
          {product.name}
        </span>
      </nav>
      <ProductDetail product={product} />
      {related.length > 0 && (
        <section aria-labelledby="related" className="mt-12">
          <h2 id="related" className="font-serif text-xl text-ink">
            You may also like
          </h2>
          <span className="mt-2 block h-[3px] w-10 rounded-full bg-primary" aria-hidden="true" />
          <div className="mt-5 grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
