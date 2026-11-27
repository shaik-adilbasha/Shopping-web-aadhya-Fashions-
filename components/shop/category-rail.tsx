import Link from 'next/link'
import { Flower2, Gem, LayoutGrid, Ribbon, Scissors, Scroll, Shirt, Sparkles, type LucideIcon } from 'lucide-react'

const MOBILE_HIDDEN = ['maggam-work', 'services', 't-shirts', 'shirts', 'pants']
import { cn } from '@/lib/utils'

const items: { label: string; href: string; key: string; icon: LucideIcon }[] = [
  { label: 'All', href: '/shop', key: 'all', icon: LayoutGrid },
  { label: 'Sarees', href: '/shop?category=sarees', key: 'sarees', icon: Ribbon },
  { label: 'Jewellery', href: '/shop?category=jewellery', key: 'jewellery', icon: Gem },
  { label: 'Lehengas', href: '/shop?category=lehengas', key: 'lehengas', icon: Shirt },
  { label: 'Fabrics', href: '/shop?category=fabrics', key: 'fabrics', icon: Scroll },
  { label: 'Accessories', href: '/shop?category=blouses-accessories', key: 'blouses-accessories', icon: Sparkles },
  { label: 'Maggam Work', href: '/shop?category=maggam-work', key: 'maggam-work', icon: Flower2 },
  { label: 'T-Shirts', href: '/shop?category=t-shirts', key: 't-shirts', icon: Shirt },
  { label: 'Shirts', href: '/shop?category=shirts', key: 'shirts', icon: Shirt },
  { label: 'Pants', href: '/shop?category=pants', key: 'pants', icon: LayoutGrid },
  { label: 'Services', href: '/services', key: 'services', icon: Scissors },
]

export function CategoryRail({ active = 'all' }: { active?: string }) {
  return (
    <nav aria-label="Categories" className="no-scrollbar -mx-4 overflow-x-auto px-4">
      <ul className="flex min-w-max gap-0 md:gap-12">
        {items.map(({ label, href, key, icon: Icon }) => {
          const isActive = key === active
          return (
            <li key={key} className={MOBILE_HIDDEN.includes(key) ? 'hidden md:block' : undefined}>
              <Link href={href} className="group flex w-[62px] flex-col items-center gap-2 md:w-auto md:gap-2.5" aria-current={isActive ? 'page' : undefined}>
                <span
                  className={cn(
                    'flex size-[50px] items-center justify-center md:size-[60px] rounded-full transition-all duration-300 group-hover:-translate-y-1',
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'bg-rose-soft text-primary group-hover:bg-primary group-hover:text-white',
                  )}
                >
                  <Icon className="size-6 md:size-7" strokeWidth={1.6} />
                </span>
                <span className={cn('text-[11.5px] md:text-[13px]', isActive ? 'font-medium text-ink' : 'text-ink/85')}>{label}</span>
                <span className={cn('-mt-1.5 h-[2px] w-10 rounded-full bg-primary md:hidden', isActive ? 'opacity-100' : 'opacity-0')} aria-hidden="true" />
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
