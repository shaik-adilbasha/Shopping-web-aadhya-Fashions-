import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

/** The official Aadhya logo image (public/aadhya-logo.png). Natural ratio 447:423 — never set both width and height. */
export function LogoImage({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/aadhya-logo.png"
      alt="Aadhya – The Fashions Studio"
      width={447}
      height={423}
      priority={priority}
      className={cn('h-auto select-none', className)}
    />
  )
}

/** Horizontal lockup (same artwork, icon left / name right) for navbar and mobile menu on dark surfaces. */
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" aria-label="Aadhya Fashions Studios home" className={cn('flex shrink-0 items-center', className)}>
      <Image
        src="/aadhya-logo-horizontal.png"
        alt="Aadhya – The Fashions Studio"
        width={568}
        height={167}
        priority
        className={cn('w-auto select-none', compact ? 'h-12' : 'h-[62px] md:h-[92px]')}
      />
    </Link>
  )
}

/** For light surfaces: the same image on a dark plum badge so the tagline stays readable. */
export function LogoBadge({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' }) {
  return (
    <span className={cn('flex w-fit items-center justify-center rounded-2xl bg-plum', size === 'sm' ? 'p-2.5' : 'p-3', className)}>
      <LogoImage className={size === 'sm' ? 'w-16' : 'w-24'} />
    </span>
  )
}
