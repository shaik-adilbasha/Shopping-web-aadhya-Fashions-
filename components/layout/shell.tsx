'use client'

import { usePathname } from 'next/navigation'
import { DesktopSidebar } from './desktop-sidebar'
import { SiteHeader } from './site-header'
import { MobileBottomNav } from './mobile-bottom-nav'
import { useStore } from '@/lib/store'

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { catalogVersion } = useStore()
  if (pathname.startsWith('/owner')) return <>{children}</>
  return (
    <>
      <div className="flex min-h-svh">
        <DesktopSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <SiteHeader />
          <main key={catalogVersion} className="flex-1 pb-24 md:pb-10">
            {children}
          </main>
        </div>
      </div>
      <MobileBottomNav />
    </>
  )
}
