'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SidebarNav } from './sidebar-nav'

export function DesktopSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()

  return (
    <aside
      className={cn(
        'floral-bg sticky top-0 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar shadow-[4px_0_24px_-12px_rgb(216_27_106/0.25)] transition-[width] duration-300 ease-out md:flex',
        collapsed ? 'w-[76px]' : 'w-[253px]',
      )}
    >
      <div
        className={cn(
          'flex h-[88px] shrink-0 items-center md:h-[116px]',
          collapsed ? 'flex-col justify-center gap-1' : 'justify-between px-6',
        )}
      >
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="rounded-md p-1 text-primary/50 transition-colors hover:text-primary"
        >
          <ChevronLeft className="size-5" />
        </button>
        {!collapsed && (
          <button
            type="button"
            onClick={() => router.forward()}
            aria-label="Go forward"
            className="rounded-md p-1 text-ink transition-colors hover:text-primary"
          >
            <ChevronRight className="size-5" />
          </button>
        )}
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-3 pb-20">
        <SidebarNav collapsed={collapsed} />
      </div>

      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={cn(
          'absolute bottom-6 flex size-[27px] items-center justify-center rounded-full bg-primary text-white shadow-md transition-all hover:scale-110',
          collapsed ? 'left-1/2 -translate-x-1/2' : 'right-3',
        )}
      >
        {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
      </button>
    </aside>
  )
}
