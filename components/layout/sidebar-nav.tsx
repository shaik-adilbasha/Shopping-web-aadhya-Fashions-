'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sidebarNav, type NavItem } from './nav-config'

type Props = { collapsed?: boolean; onNavigate?: () => void }

export function SidebarNav(props: Props) {
  return (
    <Suspense fallback={<SidebarNavInner {...props} category={null} />}>
      <SidebarNavWithParams {...props} />
    </Suspense>
  )
}

function SidebarNavWithParams(props: Props) {
  const category = useSearchParams().get('category')
  return <SidebarNavInner {...props} category={category} />
}

function SidebarNavInner({ collapsed, onNavigate, category }: Props & { category: string | null }) {
  const pathname = usePathname()
  const [open, setOpen] = useState<Record<string, boolean>>({ Shop: true, Services: true })

  const isActive = (item: NavItem) =>
    item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(item.href + '/')

  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {sidebarNav.map((item) => {
        const active = isActive(item)
        const Icon = item.icon
        const expanded = !!item.children && !collapsed && open[item.label]
        return (
          <div key={item.label}>
            <div
              className={cn(
                'group flex items-center rounded-xl transition-colors',
                active ? 'bg-sidebar-accent text-primary' : 'text-ink hover:bg-sidebar-accent/60',
              )}
            >
              <Link
                href={item.href}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-1 items-center gap-3.5 py-2.5 text-[15px] font-normal',
                  collapsed ? 'justify-center px-0' : 'px-3',
                )}
              >
                <Icon className={cn('size-[21px] shrink-0 text-primary transition-transform group-hover:scale-110')} strokeWidth={1.8} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
              {item.children && !collapsed && (
                <button
                  type="button"
                  onClick={() => setOpen((o) => ({ ...o, [item.label]: !o[item.label] }))}
                  aria-expanded={expanded}
                  aria-label={`${expanded ? 'Collapse' : 'Expand'} ${item.label}`}
                  className="mr-2 rounded-md p-1 text-primary hover:bg-white/60"
                >
                  <ChevronDown className={cn('size-4 transition-transform duration-300', expanded && 'rotate-180')} />
                </button>
              )}
            </div>
            {item.children && !collapsed && (
              <div
                className={cn(
                  'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
                  expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                )}
              >
                <ul className="overflow-hidden">
                  {item.children.map((child) => {
                    const childActive = child.category
                      ? pathname === '/shop' && category === child.category
                      : pathname === child.href
                    return (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={onNavigate}
                          className={cn(
                            'flex items-center gap-3 py-[5px] pl-[42px] pr-2 text-[12.5px] transition-colors hover:text-primary',
                            childActive ? 'font-medium text-primary' : 'text-ink/85',
                          )}
                        >
                          <span className="size-[5px] shrink-0 rounded-full bg-primary" aria-hidden="true" />
                          {child.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
