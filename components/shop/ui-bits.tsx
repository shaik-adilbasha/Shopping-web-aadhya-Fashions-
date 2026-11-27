'use client'

import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function QuantityStepper({
  value,
  onChange,
  max,
  label = 'Quantity',
  className,
}: {
  value: number
  onChange: (v: number) => void
  max: number
  label?: string
  className?: string
}) {
  return (
    <div className={cn('inline-flex h-8 items-center rounded-md border border-input bg-white', className)} role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label="Decrease quantity"
        className="flex h-full w-8 items-center justify-center text-primary disabled:text-muted-foreground/50"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-7 text-center text-sm tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Increase quantity"
        className="flex h-full w-8 items-center justify-center text-primary disabled:text-muted-foreground/50"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}

export function PageTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h1 className={cn('font-serif text-2xl font-medium text-ink md:text-[28px]', className)}>{children}</h1>
}
