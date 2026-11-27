'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Product } from '@/lib/catalog'
import { cn } from '@/lib/utils'

export type SortKey = 'popular' | 'price-asc' | 'price-desc' | 'rating' | 'newest'

const options: { value: SortKey; label: string }[] = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
]

export function sortProducts(list: Product[], sort: SortKey) {
  const arr = [...list]
  switch (sort) {
    case 'price-asc':
      return arr.sort((a, b) => a.price - b.price)
    case 'price-desc':
      return arr.sort((a, b) => b.price - a.price)
    case 'rating':
      return arr.sort((a, b) => b.rating - a.rating)
    case 'newest':
      return arr.sort((a, b) => Number(!!b.newArrival) - Number(!!a.newArrival))
    default:
      return arr.sort((a, b) => b.reviews - a.reviews)
  }
}

export function SortSelect({ value, onChange, className }: { value: SortKey; onChange: (v: SortKey) => void; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Select value={value} onValueChange={(v) => onChange(v as SortKey)}>
        <SelectTrigger aria-label="Sort products" className="h-10 min-w-[124px] rounded-lg border-0 bg-white shadow-sm ring-1 ring-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
