import * as React from 'react'

import { cn } from '@/lib/utils'

// Figma: Input (18:5028) — Variant=Default | File · State=Default | Focus | Filled | Disabled | Error | Error (Focus).
// `Horizontal Layout` is a Field concern (see field.tsx), and Variant=File is simply `type="file"`.
//
// h-8 · px-3 · py-1 · rounded-lg · base/input fill · text-sm/leading-normal/medium.
// Placeholder base/muted-foreground, value (Filled) base/foreground.
// Focus: border-1 (1.5px) base/ring stroke + focus/default. Error: border-1 base/destructive stroke,
// Error (Focus) adds focus/destructive. Disabled: opacity 50.
// Figma strokes sit inside the box, so they are drawn as an inset outline (no layout shift), like Button.
export const inputStateClasses = cn(
  'focus-visible:shadow-focus focus-visible:outline-(length:--border-1) focus-visible:-outline-offset-(length:--border-1) focus-visible:outline-ring focus-visible:outline-solid',
  'aria-invalid:outline-(length:--border-1) aria-invalid:-outline-offset-(length:--border-1) aria-invalid:outline-destructive aria-invalid:outline-solid',
  'aria-invalid:focus-visible:shadow-focus-destructive aria-invalid:focus-visible:outline-destructive',
)

export function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-8 w-full min-w-0 rounded-lg bg-input px-3 py-1 text-sm font-medium text-foreground outline-none transition-[color,box-shadow]',
        'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground',
        // Variant=File — the native "Choose file" button: px-1.5 · py-px · text-sm/semibold · base/foreground.
        'file:me-1 file:inline-flex file:h-full file:items-center file:border-0 file:bg-transparent file:px-1.5 file:py-px file:text-sm file:font-semibold file:text-foreground',
        inputStateClasses,
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
