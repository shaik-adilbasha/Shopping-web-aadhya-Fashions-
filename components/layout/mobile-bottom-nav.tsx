'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart, House, LayoutGrid, ShoppingCart, User } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const items = [
  { label: 'Home', href: '/', icon: House },
  { label: 'Shop', href: '/shop', icon: LayoutGrid },
  { label: 'Wishlist', href: '/wishlist', icon: Heart },
  { label: 'Cart', href: '/cart', icon: ShoppingCart },
  { label: 'Account', href: '/account', icon: User },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const { cartCount } = useStore()
  return (
    <nav
      aria-label="Bottom"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ label, href, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <li key={label}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn('flex flex-col items-center gap-1 py-2.5 text-xs', active ? 'text-primary' : 'text-ink/70')}
              >
                <span className="relative">
                  <Icon className={cn('size-6', active && 'fill-primary')} strokeWidth={1.6} />
                  {label === 'Cart' && cartCount > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 flex size-[17px] items-center justify-center rounded-full bg-primary text-[10px] text-white">
                      {cartCount}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
