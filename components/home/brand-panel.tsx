'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, ChevronUp, CircleHelp, Headset, Heart, LayoutGrid, Link2, PackageSearch, RotateCcw } from 'lucide-react'
import { LogoBadge } from '@/components/brand/logo'
import { cn } from '@/lib/utils'

const featuredCats = [
  { label: 'Sarees', href: '/shop?category=sarees', image: '/images/lehenga-pink.png' },
  { label: 'Jewellery', href: '/shop?category=jewellery', image: '/images/jewellery-set.png' },
]

const quickLinks = [
  { label: 'Track Order', href: '/orders', icon: PackageSearch },
  { label: 'Returns & Refunds', href: '/contact', icon: RotateCcw },
  { label: 'Customer Support', href: '/contact', icon: Headset },
  { label: 'FAQs', href: '/about', icon: CircleHelp },
]

export function BrandPanel() {
  const [hidden, setHidden] = useState(false)
  const [catsOpen, setCatsOpen] = useState(true)

  if (hidden) {
    return (
      <button
        type="button"
        onClick={() => setHidden(false)}
        aria-label="Show side panel"
        className="sticky top-24 hidden size-7 shrink-0 items-center justify-center self-start rounded-full bg-primary text-white shadow-md xl:flex"
      >
        <ChevronLeft className="size-4" />
      </button>
    )
  }

  return (
    <aside aria-label="Studio highlights" className="sticky top-[88px] hidden w-[280px] shrink-0 self-start rounded-2xl bg-white p-3 shadow-[0_8px_30px_-12px_rgb(216_27_106/0.25)] ring-1 ring-border xl:block">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setHidden(true)}
          aria-label="Hide side panel"
          className="flex size-7 items-center justify-center rounded-full bg-primary text-white transition-transform hover:scale-110"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="floral-bg mt-2 rounded-2xl bg-blush px-5 py-6 text-center">
        <LogoBadge size="sm" className="mx-auto" />
        <p className="mt-3 font-serif text-lg font-medium text-primary">Aadhya Fashions Studios</p>
        <p className="mt-1 text-sm text-ink">Elegance in Every Fold</p>
        <span className="mx-auto mt-3 block h-px w-8 bg-primary" aria-hidden="true" />
        <p className="mt-3 font-serif text-sm italic text-ink/75">{'"Traditional beauty, modern elegance."'}</p>
      </div>

      <section className="mt-4 border-t border-border px-2 pt-4">
        <button
          type="button"
          onClick={() => setCatsOpen((o) => !o)}
          aria-expanded={catsOpen}
          className="flex w-full items-center gap-2.5 text-sm text-ink"
        >
          <LayoutGrid className="size-5 text-primary" strokeWidth={1.7} />
          Categories
          <ChevronUp className={cn('ml-auto size-4 text-primary transition-transform', !catsOpen && 'rotate-180')} />
        </button>
        {catsOpen && (
          <ul className="mt-3 flex flex-col gap-2">
            {featuredCats.map((c) => (
              <li key={c.label}>
                <Link href={c.href} className="group flex items-center gap-3 rounded-2xl p-1.5 shadow-sm ring-1 ring-border transition-colors hover:bg-blush">
                  <span className="relative size-[68px] overflow-hidden rounded-full">
                    <Image src={c.image || '/placeholder.svg'} alt="" fill sizes="68px" className="object-cover transition-transform group-hover:scale-110" />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-[15px] text-ink">{c.label}</span>
                    <span className="flex items-center gap-1.5 text-xs text-primary">
                      Explore <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 border-t border-border px-2 pt-4">
        <h2 className="flex items-center gap-2.5 text-sm text-ink">
          <Link2 className="size-5 text-primary" strokeWidth={1.7} />
          Quick Links
        </h2>
        <ul className="mt-3 flex flex-col gap-1">
          {quickLinks.map(({ label, href, icon: Icon }) => (
            <li key={label}>
              <Link href={href} className="flex items-center gap-3 rounded-md px-1 py-1.5 text-xs text-ink/85 hover:text-primary">
                <Icon className="size-4 text-primary" strokeWidth={1.8} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-4 rounded-xl bg-blush py-4 text-center">
        <Heart className="mx-auto size-4 text-primary" />
        <p className="mt-1 text-xs text-primary">Crafted for your special moments</p>
      </div>
    </aside>
  )
}
