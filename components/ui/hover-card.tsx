'use client'

import * as React from 'react'
import { HoverCard as HoverCardPrimitive } from 'radix-ui'
import { cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { popoverMotion, popoverSurface } from '@/components/ui/popover'

// Figma: Hover Card (19:2854)
// · Hover Card (19:2907) — Active=No | Yes. Active is the open state: the trigger is underlined and the card
//   sits 8px below it (sideOffset 8).
// · Hover Card / Trigger (19:2885) — State=Default | Hover | Focus | Pressed | Disabled.
//   h-9 · px-4 · py-2 · rounded-md · text-sm/leading-normal/medium in base/primary.
//   Hover → underline · Focus → focus/default · Pressed → opacity 60, no underline · Disabled → opacity 50.
// · Hover Card / Card (19:2896) — 272px wide (w-68) floating surface, shared with Popover (see popoverSurface).
// · Hover Card / Content Example (19:2899) — avatar + text, built in the docs.

/** Figma "Hover Card / Trigger": a text link that opens the card. Applied unless the trigger uses asChild. */
export const hoverCardTriggerStyle = cva([
  'inline-flex h-9 shrink-0 items-center justify-center rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap text-primary',
  'decoration-from-font underline-offset-auto outline-none transition-[box-shadow,opacity]',
  'hover:underline data-[state=open]:underline',
  'focus-visible:shadow-focus',
  // Figma's Pressed is the Default look at 60% opacity. A real press is also a hover, so drop the hover underline.
  'active:no-underline active:opacity-60',
  'aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
])

export function HoverCard({ ...props }: React.ComponentProps<typeof HoverCardPrimitive.Root>) {
  return <HoverCardPrimitive.Root data-slot="hover-card" {...props} />
}

export function HoverCardTrigger({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  return (
    <HoverCardPrimitive.Trigger
      data-slot="hover-card-trigger"
      asChild={asChild}
      className={cn(!asChild && hoverCardTriggerStyle(), className)}
      {...props}
    />
  )
}

export function HoverCardContent({
  className,
  align = 'center',
  sideOffset = 8,
  container,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content> & {
  /** Element to portal into (defaults to document.body). */
  container?: React.ComponentProps<typeof HoverCardPrimitive.Portal>['container']
}) {
  return (
    <HoverCardPrimitive.Portal data-slot="hover-card-portal" container={container}>
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          popoverSurface,
          popoverMotion,
          'z-50 flex w-68 origin-(--radix-hover-card-content-transform-origin) flex-col gap-4',
          className,
        )}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  )
}
