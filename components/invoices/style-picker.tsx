'use client'

import { IconCheckmark1Medium } from 'central-icons'

import type { InvoiceStyle } from '@/lib/types'
import { cn } from '@/lib/utils'

export const STYLE_OPTIONS: { value: InvoiceStyle; label: string; description: string }[] = [
  { value: 'light', label: 'Light', description: 'OSDS, white surfaces and blue actions' },
  { value: 'dark', label: 'Dark', description: 'OSDS in dark mode' },
  { value: 'alt-light', label: 'Monochrome', description: 'Black actions, glass cards' },
  { value: 'alt-dark', label: 'Monochrome dark', description: 'Monochrome in dark mode' },
  { value: 'quantum', label: 'Quantum', description: 'The original Framer template' },
]

export function StylePicker({ value, onChange }: { value: InvoiceStyle; onChange: (value: InvoiceStyle) => void }) {
  return (
    <div role="radiogroup" aria-label="Invoice style" className="grid grid-cols-5 gap-1.5">
      {STYLE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          title={`${option.label}: ${option.description}`}
          onClick={() => onChange(option.value)}
          className={cn(
            'relative flex aspect-square items-end justify-start overflow-hidden rounded-md border border-border p-1 outline-none focus-visible:shadow-focus',
            value === option.value && 'border-primary ring-1 ring-primary',
          )}
        >
          <StyleSwatch style={option.value} />
          {value === option.value && <IconCheckmark1Medium className="absolute top-1 right-1 size-3.5 text-primary" />}
          <span className="sr-only">{option.label}</span>
        </button>
      ))}
    </div>
  )
}

/** A tiny invoice drawn in the style's own theme. */
export function StyleSwatch({ style }: { style: InvoiceStyle }) {
  if (style === 'quantum') {
    return (
      <span aria-hidden="true" className="absolute inset-0 flex flex-col gap-0.5 bg-muted p-1.5">
        <span className="size-2 rounded-[2px] bg-foreground" />
        <span className="mt-auto h-0.5 w-3/4 rounded-full bg-foreground/60" />
        <span className="h-0.5 w-1/2 rounded-full bg-foreground/30" />
      </span>
    )
  }
  const dark = style === 'dark' || style === 'alt-dark'
  const alt = style === 'alt-light' || style === 'alt-dark'
  return (
    <span aria-hidden="true" data-theme={alt ? 'alt' : 'osds'} className={cn('absolute inset-0 flex flex-col gap-0.5 bg-background p-1.5', dark && 'dark')}>
      <span className="h-0.5 w-1/2 rounded-full bg-foreground/70" />
      <span className="h-0.5 w-1/3 rounded-full bg-muted-foreground/50" />
      <span className="mt-auto h-1.5 w-full rounded-[2px] bg-primary" />
    </span>
  )
}
