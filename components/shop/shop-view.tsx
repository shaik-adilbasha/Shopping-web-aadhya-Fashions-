'use client'

import { useMemo, useState } from 'react'
import { ChevronRight, LayoutGrid, List, SlidersHorizontal, X } from 'lucide-react'
import { categories, categoryLabel, products } from '@/lib/catalog'
import { Checkbox } from '@/components/ui/checkbox'
import { ProductCard } from './product-card'
import { ProductRow } from './product-row'
import { SortSelect, sortProducts, type SortKey } from './sort-select'
import { PageTitle } from './ui-bits'
import { cn } from '@/lib/utils'

const priceRanges = [
  { id: 'all', label: 'Any price', min: 0, max: Infinity },
  { id: '0-1000', label: '₹0 - ₹1,000', min: 0, max: 1000 },
  { id: '1000-2000', label: '₹1,000 - ₹2,000', min: 1000, max: 2000 },
  { id: '2000-5000', label: '₹2,000 - ₹5,000', min: 2000, max: 5000 },
  { id: '5000+', label: '₹5,000+', min: 5000, max: Infinity },
]

const swatches = [
  { name: 'Rani Pink', hex: '#d81b6a' },
  { name: 'Royal Purple', hex: '#6a2fb5' },
  { name: 'Saffron', hex: '#e07b28' },
  { name: 'Bottle Green', hex: '#1f7a3e' },
  { name: 'Ivory', hex: '#f6efdc' },
]

const PAGE_SIZE = 6

export function ShopView({ initialCategory, query }: { initialCategory: string | null; query: string }) {
  const [selectedCats, setSelectedCats] = useState<string[]>(initialCategory ? [initialCategory] : [])
  const [price, setPrice] = useState('all')
  const [color, setColor] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>('popular')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const filtered = useMemo(() => {
    const range = priceRanges.find((r) => r.id === price) ?? priceRanges[0]
    const q = query.toLowerCase()
    const list = products.filter(
      (p) =>
        (selectedCats.length === 0 || selectedCats.includes(p.category)) &&
        p.price >= range.min &&
        p.price < range.max &&
        (!color || p.colors.some((c) => c.hex === color)) &&
        (!q || p.name.toLowerCase().includes(q) || p.category.includes(q) || p.subtitle.toLowerCase().includes(q)),
    )
    return sortProducts(list, sort)
  }, [selectedCats, price, color, sort, query])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const toggleCat = (id: string) => {
    setPage(1)
    setSelectedCats((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  const title = query ? `Results for "${query}"` : selectedCats.length === 1 ? categoryLabel(selectedCats[0]) : 'All Products'

  const filters = (
    <div className="flex flex-col gap-7">
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-ink">Category</legend>
        <div className="flex flex-col gap-2.5">
          {categories.map((c) => (
            <label key={c.id} className="flex cursor-pointer items-center gap-2.5 text-[13px] text-ink/85">
              <Checkbox checked={selectedCats.includes(c.id)} onCheckedChange={() => toggleCat(c.id)} />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-ink">Price Range</legend>
        <div className="flex flex-col gap-2.5">
          {priceRanges.map((r) => (
            <label key={r.id} className="flex cursor-pointer items-center gap-2.5 text-[13px] text-ink/85">
              <input
                type="radio"
                name="price"
                checked={price === r.id}
                onChange={() => {
                  setPrice(r.id)
                  setPage(1)
                }}
                className="size-4 accent-primary"
              />
              {r.label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-ink">Color</legend>
        <div className="flex flex-wrap gap-2.5">
          {swatches.map((s) => (
            <button
              key={s.hex}
              type="button"
              onClick={() => {
                setColor((c) => (c === s.hex ? null : s.hex))
                setPage(1)
              }}
              aria-label={s.name}
              aria-pressed={color === s.hex}
              className={cn(
                'size-6 rounded-full ring-1 ring-black/10 transition-transform hover:scale-110',
                color === s.hex && 'ring-2 ring-primary ring-offset-2',
              )}
              style={{ backgroundColor: s.hex }}
            />
          ))}
        </div>
      </fieldset>
    </div>
  )

  return (
    <div className="px-4 pt-6 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle>{title}</PageTitle>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="flex h-10 items-center gap-2 rounded-lg bg-white px-3 text-sm shadow-sm ring-1 ring-border lg:hidden"
          >
            <SlidersHorizontal className="size-4 text-primary" /> Filters
          </button>
          <span className="hidden text-sm text-muted-foreground sm:inline">Sort by:</span>
          <SortSelect value={sort} onChange={setSort} />
          <div className="hidden items-center rounded-lg bg-white p-1 ring-1 ring-border sm:flex">
            {(['grid', 'list'] as const).map((v) => {
              const Icon = v === 'grid' ? LayoutGrid : List
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  aria-label={`${v} view`}
                  aria-pressed={view === v}
                  className={cn('rounded-md p-1.5', view === v ? 'bg-rose-soft text-primary' : 'text-muted-foreground')}
                >
                  <Icon className="size-4" />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-8">
        <aside aria-label="Filters" className="hidden w-[200px] shrink-0 lg:block">
          {filters}
        </aside>

        <div className="min-w-0 flex-1">
          <p className="mb-4 text-sm text-muted-foreground">{filtered.length} pieces</p>
          {visible.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-border">
              <p className="font-serif text-lg text-ink">No products match your filters</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCats([])
                  setPrice('all')
                  setColor(null)
                }}
                className="mt-4 rounded-full bg-primary px-5 py-2 text-sm text-white"
              >
                Clear filters
              </button>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 gap-3 md:gap-5 xl:grid-cols-3">
              {visible.map((p, i) => (
                <ProductCard key={p.slug} product={p} showRating priority={i < 2} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {visible.map((p) => (
                <ProductRow key={p.slug} product={p} />
              ))}
            </div>
          )}

          {pages > 1 && (
            <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-2">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  aria-current={n === current ? 'page' : undefined}
                  className={cn('size-8 rounded-md text-sm', n === current ? 'bg-rose-soft text-primary' : 'text-ink hover:bg-white')}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage(Math.min(pages, current + 1))}
                disabled={current === pages}
                aria-label="Next page"
                className="size-8 rounded-md text-ink disabled:opacity-40"
              >
                <ChevronRight className="mx-auto size-4" />
              </button>
            </nav>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button type="button" aria-label="Close filters" onClick={() => setFiltersOpen(false)} className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-x-0 bottom-0 max-h-[80svh] overflow-y-auto rounded-t-3xl bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-lg">Filters</h2>
              <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                <X className="size-5" />
              </button>
            </div>
            {filters}
            <button type="button" onClick={() => setFiltersOpen(false)} className="mt-6 h-11 w-full rounded-lg bg-primary text-white">
              Show {filtered.length} results
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
