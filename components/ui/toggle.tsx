'use client'

import * as React from 'react'
import { Toggle as TogglePrimitive } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/*
 * Figma: Toggle — Variant=Default|Outline · Size=Default|sm|lg · State=Default|Hover|Focus|Pressed|Disabled,
 *   plus the booleans Show Icon / Show Text (just children here).
 *   State=Pressed is the toggle's *on* state (Radix `pressed`, `aria-pressed`, `data-state="on"`), not `:active`.
 *
 * Every size: rounded-md, gap-2 between a 16px icon and the text-sm/medium label. Icon-only toggles are not square
 * in Figma (e.g. 32×36), so there is no min-width — the width is padding + content.
 */
export const toggleVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap text-foreground outline-none transition-[color,background-color,box-shadow]',
    'focus-visible:shadow-focus',
    // Pressed → base/accent background, label stays base/foreground.
    'data-[state=on]:bg-accent data-[state=on]:text-foreground',
    // Radix also sets data-disabled, which keeps the disabled look when asChild renders a non-button element.
    'disabled:pointer-events-none disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        // Transparent; hover → base/muted with a base/muted-foreground label and icon.
        default: 'bg-transparent hover:data-[state=off]:bg-muted hover:data-[state=off]:text-muted-foreground',
        // base/background with a 1px base/input stroke and shadow/xs; hover → base/muted (label base/accent-foreground);
        // focus → the stroke turns base/ring. Disabled drops the fill (transparent) but keeps stroke and shadow.
        // The stroke is an inset ring: in Figma it is excluded from layout, so outline and default toggles are the
        // same size (e.g. 67×36) — a CSS border would make the outline one 2px wider.
        outline: [
          'bg-background shadow-xs inset-ring inset-ring-input',
          'hover:data-[state=off]:bg-muted hover:data-[state=off]:text-accent-foreground',
          'focus-visible:inset-ring-ring',
          'disabled:bg-transparent data-disabled:bg-transparent',
        ],
      },
      size: {
        default: 'h-9 px-2',
        sm: 'h-8 px-1.5',
        lg: 'h-10 px-2.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export function Toggle({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      data-variant={variant}
      data-size={size}
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}
