import * as React from 'react'

import { cn } from '@/lib/utils'

// Figma: Hotkey (230:3800) — a single component, no variants or states.
// h-5 · px-1 · rounded-sm · border-[0.5px] base/input · custom/background dark:input\30 · shadow/sm ·
// text-xs/leading-normal/medium in base/foreground. The Figma frame also has gap spacing/2 and py spacing/2, but
// with a single text child and a fixed 20px height neither shows; gap-1, min-w-5 and the size-3 icon are shadcn's.
// No tooltip override (shadcn's [data-slot=tooltip-content] rule): the Figma Tooltip uses the Hotkey unchanged and
// TooltipContent restyles it in dark mode itself.
export function Kbd({ className, ...props }: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        'pointer-events-none inline-flex h-5 w-fit min-w-5 shrink-0 items-center justify-center gap-1 rounded-sm border-[0.5px] border-input bg-custom-background-dark-input-30 px-1 font-sans text-xs font-medium whitespace-nowrap text-foreground shadow-sm select-none',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
        className,
      )}
      {...props}
    />
  )
}

export function KbdGroup({ className, ...props }: React.ComponentProps<'kbd'>) {
  return <kbd data-slot="kbd-group" className={cn('inline-flex items-center gap-1', className)} {...props} />
}
