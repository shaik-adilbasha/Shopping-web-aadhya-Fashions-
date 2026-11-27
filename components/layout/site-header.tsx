'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { ChevronLeft, Menu, Search, ShoppingCart, User, X } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { headerNav } from './nav-config'
import { SidebarNav } from './sidebar-nav'

function HeaderLinks({ category }: { category: string | null }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Primary" className="hidden items-center gap-9 lg:flex">
      {headerNav.map((item) => {
        const active =
          item.label === 'All'
            ? pathname === '/' || (pathname === '/shop' && !category)
            : item.category
              ? pathname === '/shop' && category === item.category
              : pathname.startsWith(item.href)
        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative py-2 text-[15px] transition-colors',
              active ? 'text-[#f0448b]' : 'text-white hover:text-[#f0448b]',
            )}
          >
            {item.label}
            <span
              className={cn(
                'absolute -bottom-1 left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full bg-[#f0448b] transition-opacity',
                active ? 'opacity-100' : 'opacity-0',
              )}
              aria-hidden="true"
            />
          </Link>
        )
      })}
    </nav>
  )
}

function HeaderLinksWithParams() {
  return <HeaderLinks category={useSearchParams().get('category')} />
}

function SearchForm({ className, autoFocus, onDone }: { className?: string; autoFocus?: boolean; onDone?: () => void }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        router.push(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : '/shop')
        onDone?.()
      }}
      className={cn('flex h-[42px] items-center gap-3 rounded-full bg-plum-soft px-4 ring-1 ring-white/5 focus-within:ring-[#f0448b]/60', className)}
    >
      <Search className="size-5 shrink-0 text-white/80" aria-hidden="true" />
      <label htmlFor="site-search" className="sr-only">
        Search sarees, jewellery
      </label>
      <input
        id="site-search"
        value={q}
        autoFocus={autoFocus}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search sarees, jewellery..."
        className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/55 focus:outline-none"
      />
      {q ? (
        <button type="button" onClick={() => setQ('')} aria-label="Clear search" className="text-white/70 hover:text-white">
          <X className="size-4" />
        </button>
      ) : (
        <ChevronLeft className="size-4 text-white/70" aria-hidden="true" />
      )}
    </form>
  )
}

export function SiteHeader() {
  const { cartCount } = useStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 bg-plum text-white">
      <div className="flex h-[88px] items-center gap-6 px-4 md:h-[116px] md:px-10">
        <Logo />

        <div className="ml-6 hidden lg:block">
          <Suspense fallback={<HeaderLinks category={null} />}>
            <HeaderLinksWithParams />
          </Suspense>
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-5">
          <SearchForm className="hidden w-[325px] md:flex" />
          <button
            type="button"
            onClick={() => setSearchOpen((s) => !s)}
            aria-label="Search"
            className="rounded-full p-2 hover:bg-white/10 md:hidden"
          >
            <Search className="size-6" />
          </button>
          <Link href="/cart" aria-label={`Cart, ${cartCount} items`} className="relative rounded-full p-2 hover:bg-white/10">
            <ShoppingCart className="size-6" strokeWidth={1.8} />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium md:size-[19px] md:text-[11px]">
                {cartCount}
              </span>
            )}
          </Link>
          <Link href="/account" aria-label="My account" className="hidden rounded-full p-2 hover:bg-white/10 md:block">
            <User className="size-6" strokeWidth={1.8} />
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="rounded-full p-2 hover:bg-white/10 md:hidden"
          >
            <Menu className="size-7" />
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="px-4 pb-3 md:hidden">
          <SearchForm autoFocus onDone={() => setSearchOpen(false)} />
        </div>
      )}

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="floral-bg w-[280px] overflow-y-auto bg-sidebar p-4">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="mb-4 mt-2 rounded-xl bg-plum p-3">
            <Logo compact />
          </div>
          <SidebarNav onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  )
}
