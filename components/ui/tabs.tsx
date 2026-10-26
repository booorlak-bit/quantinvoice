'use client'

import * as React from 'react'
import { Tabs as TabsPrimitive } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/*
 * Figma has two tab designs, both shadcn Tabs underneath:
 *   • "Tabs / Segmented Control" (1:2560) — Tabs (5:1663) + Tabs / Trigger (5:1646): Active=On|Off × State=Default|Focus|Disabled.
 *   • "Tabs / Navigation" (119:3082) — Tab Navigation (119:3496) + Tabs / Menu Item (119:3461):
 *     Active=On|Off × State=Default|Hover|Focus|Disabled.
 * The design is the `variant` of <TabsList> (segmented | navigation); every <TabsTrigger> inside picks it up.
 * Active → Radix `data-state=active|inactive`, State → CSS (`hover:`, `focus-visible:`, `disabled:`).
 * Icons ("Icon / Circle", 16px) and the Badge Number are children of the trigger.
 */

export type TabsVariant = 'segmented' | 'navigation'

const TabsVariantContext = React.createContext<TabsVariant>('segmented')

// orientation="vertical" puts the list beside the panels (every Radix part carries data-orientation).
export function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex gap-2 data-[orientation=horizontal]:flex-col', className)}
      {...props}
    />
  )
}

// Segmented: a base/input pill, h-9, 1px padding, spacing/0-5 gap. Triggers fill it equally (Figma's 400px
// main component); the list hugs its triggers unless it is given a width.
// Navigation: no container — a row of menu items with a spacing/0-5 gap.
// Vertical (not in Figma): the list stacks its triggers at full width. The segmented pill becomes rounded-xl,
// concentric with the 26px trigger pills inside its 1px padding.
export const tabsListVariants = cva(
  'inline-flex w-fit items-center gap-0.5 data-[orientation=vertical]:h-fit data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch',
  {
    variants: {
      variant: {
        segmented: 'h-9 rounded-full bg-input p-px data-[orientation=vertical]:rounded-xl',
        navigation: '',
      },
    },
    defaultVariants: {
      variant: 'segmented',
    },
  },
)

export function TabsList({
  className,
  variant = 'segmented',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>) {
  const resolved = variant ?? 'segmented'
  return (
    <TabsVariantContext.Provider value={resolved}>
      <TabsPrimitive.List
        data-slot="tabs-list"
        data-variant={resolved}
        className={cn(tabsListVariants({ variant: resolved }), className)}
        {...props}
      />
    </TabsVariantContext.Provider>
  )
}

export const tabsTriggerVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-2 px-3 py-1 text-sm font-medium whitespace-nowrap text-muted-foreground outline-none',
    'transition-[color,background-color,box-shadow]',
    'data-[state=active]:text-foreground',
    // Focus: a 1px stroke drawn inside the edge (Figma inside stroke, no layout shift) + focus/default.
    'focus-visible:shadow-focus focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-solid',
    'disabled:pointer-events-none disabled:opacity-50',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        // Tabs / Trigger — rounded-full, fills the list height. Active: custom/background dark:input\30 fill,
        // 1px base/muted inside stroke and shadow/md. Figma drops the spread of an effect on a frame that does not
        // clip its content, so shadow/md is rebuilt from its variables without the spread (shadow-md would draw a
        // visibly darker edge). Focus swaps the stroke for base/ring and the shadow for focus/default (the
        // active-state variant is repeated so the focus one wins on an active trigger).
        // Disabled (Active=Off) draws its label in base/foreground at 50% opacity.
        segmented: [
          'h-full flex-1 rounded-full',
          'data-[state=active]:bg-custom-background-dark-input-30 data-[state=active]:inset-ring data-[state=active]:inset-ring-muted',
          'data-[state=active]:shadow-[var(--shadow-md-2-offset-x)_var(--shadow-md-2-offset-y)_var(--shadow-md-2-blur-radius)_var(--shadow-md-2-color),var(--shadow-md-1-offset-x)_var(--shadow-md-1-offset-y)_var(--shadow-md-1-blur-radius)_var(--shadow-md-1-color)]',
          'focus-visible:outline-ring data-[state=active]:focus-visible:shadow-focus',
          'disabled:text-foreground',
        ],
        // Tabs / Menu Item — h-8, rounded-lg. Active: base/input fill (hover adds an alpha inverted/95 overlay).
        // Inactive hover: base/muted fill. Focus: 1px base/primary inside stroke + focus/default.
        navigation: [
          'h-8 rounded-lg data-[orientation=vertical]:justify-start',
          'data-[state=active]:bg-input',
          'data-[state=active]:hover:bg-[image:linear-gradient(var(--alpha-inverted-95),var(--alpha-inverted-95))]',
          'data-[state=inactive]:hover:bg-muted',
          'focus-visible:outline-primary',
        ],
      },
    },
    defaultVariants: {
      variant: 'segmented',
    },
  },
)

export function TabsTrigger({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & VariantProps<typeof tabsTriggerVariants>) {
  const listVariant = React.useContext(TabsVariantContext)
  const resolved = variant ?? listVariant
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      data-variant={resolved}
      className={cn(tabsTriggerVariants({ variant: resolved }), className)}
      {...props}
    />
  )
}

// Radix makes the panel a tab stop (tabindex=0), so it gets the focus/default ring when reached by keyboard.
export function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none focus-visible:shadow-focus', className)}
      {...props}
    />
  )
}
