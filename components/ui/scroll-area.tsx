'use client'

import * as React from 'react'
import { ScrollArea as ScrollAreaPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'

/*
 * Figma: Fliq kit → Scroll Area (30202:1243) — no variant properties, no states. A 240×160 (w-60 · h-40) list:
 *   Surface  base/card fill · 1px base/border stroke (raw #e5e5e5 in Figma = base/border light) · radius/md
 *            (rounded-md, 8px) — the same surface as Card.
 *   Content  spacing/2 padding (p-2) · spacing/1 (gap-1) between rows · text-sm (13px) · font-weight/normal ·
 *            base/muted-foreground. Figma's auto ("normal") line height → leading-tight, the closest token.
 *
 * Like shadcn, <ScrollArea> itself is the scrolling behaviour only (Radix ScrollArea: native scrolling with a
 * custom overlay scrollbar). The surface and the list spacing are set where it is used, so it also fits inside
 * popovers, sheets and sidebars:
 *   <ScrollArea className="h-40 w-60 rounded-md border border-border bg-card">
 *     <div className="flex flex-col gap-1 p-2 text-sm leading-tight text-muted-foreground">…</div>
 *   </ScrollArea>
 *
 * Scrollbar (not drawn in Figma; shadcn's): a 10px (w-2.5 / h-2.5) track with 1px padding and a rounded-full
 * base/border thumb. With the default type="hover" it fades in while the pointer is over the area.
 * Focus: the viewport is keyboard-scrollable; focusing it draws focus/default around the whole area.
 */

export function ScrollArea({ className, children, ...props }: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn(
        'relative outline-none transition-shadow',
        // The viewport takes the focus, the ring is drawn on the root so overflow never clips it. Only this area's
        // own viewport (the direct child) counts, so a focused nested scroll area does not light up its parent.
        // (`focus-visible:` on the root itself only matches data-force="focus" in the docs.)
        'focus-visible:shadow-focus has-[>[data-slot=scroll-area-viewport]:focus-visible]:shadow-focus',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport data-slot="scroll-area-viewport" className="size-full rounded-[inherit] outline-none">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner data-slot="scroll-area-corner" />
    </ScrollAreaPrimitive.Root>
  )
}

export function ScrollBar({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        'flex touch-none p-px transition-colors select-none',
        orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent',
        orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent',
        // type="hover" / "scroll" mount and unmount the bar: fade it in and out.
        'data-[state=visible]:animate-in data-[state=visible]:fade-in-0',
        'data-[state=hidden]:animate-out data-[state=hidden]:fade-out-0',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb data-slot="scroll-area-thumb" className="relative flex-1 rounded-full bg-border" />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}
