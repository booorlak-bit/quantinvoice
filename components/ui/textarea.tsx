import * as React from 'react'

import { cn } from '@/lib/utils'

// Figma: Textarea (16:1215) — State=Default | Filled | Focus | Disabled | Error | Error (Focus).
// min-h-15 (60px) · px-3 · py-2 · rounded-xl · base/input fill · text-sm/leading-normal/medium.
// Focus: 1px base/ring stroke + focus/default. Error: 1px base/destructive stroke + shadow/xs; Error (Focus) swaps the
// shadow for focus/destructive. Disabled: opacity 50. Strokes are drawn inside the edge (no layout shift), like Button.
export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'field-sizing-content flex min-h-15 w-full min-w-0 rounded-xl bg-input px-3 py-2 text-sm font-medium text-foreground outline-none transition-[color,box-shadow]',
        'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground',
        'focus-visible:shadow-focus focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-ring focus-visible:outline-solid',
        'aria-invalid:shadow-xs aria-invalid:outline-1 aria-invalid:-outline-offset-1 aria-invalid:outline-destructive aria-invalid:outline-solid',
        'aria-invalid:focus-visible:shadow-focus-destructive aria-invalid:focus-visible:outline-destructive',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
