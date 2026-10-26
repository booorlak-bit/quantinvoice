'use client'

import * as React from 'react'
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'
import { type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { toggleVariants } from '@/components/ui/toggle'

/*
 * Figma: Toggle Group — a row of Toggle instances. The library symbol spaces them with spacing/1 (4px); the
 * playground also joins them into one segmented control (spacing 0), outline or default, Size=Default or sm.
 *   `variant` / `size` are set once on the group and inherited by every item (an item may override them).
 *   `spacing` is the gap in spacing steps (1 = 4px). With spacing 0 the items are joined: inner corners squared,
 *   one shared 1px base/input stroke, shadow/xs on the group instead of each item, spacing/3 (12px) side padding and
 *   equal-width segments (Figma "fill" children).
 */

type ToggleGroupContextValue = VariantProps<typeof toggleVariants> & { spacing?: number }

const ToggleGroupContext = React.createContext<ToggleGroupContextValue>({
  variant: 'default',
  size: 'default',
  spacing: 0,
})

export function ToggleGroup({
  className,
  variant,
  size,
  spacing = 0,
  style,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants> & {
    /** Gap between items in spacing steps (1 = 4px). 0 joins the items into a segmented control. */
    spacing?: number
  }) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant ?? 'default'}
      data-size={size ?? 'default'}
      data-spacing={spacing}
      style={{ '--gap': spacing, ...style } as React.CSSProperties}
      className={cn(
        'group/toggle-group flex w-fit items-center gap-[--spacing(var(--gap))] rounded-md',
        // Joined: equal-width segments, each as wide as the widest one (Figma "fill" items in a hugging group, e.g.
        // 2 × 107px for "Last 24 hours / Last 7 days"); a width on the group splits it evenly instead.
        'data-[spacing=0]:grid data-[spacing=0]:auto-cols-[1fr] data-[spacing=0]:grid-flow-col',
        'data-[spacing=0]:data-[variant=outline]:shadow-xs',
        className,
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size, spacing }}>{children}</ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
}

export function ToggleGroupItem({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext)
  const itemVariant = context.variant || variant || 'default'
  const itemSize = context.size || size || 'default'

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={itemVariant}
      data-size={itemSize}
      data-spacing={context.spacing}
      className={cn(
        toggleVariants({ variant: itemVariant, size: itemSize }),
        'focus:z-10 focus-visible:z-10',
        // Joined (spacing 0): one segmented control.
        'data-[spacing=0]:px-3',
        'data-[spacing=0]:rounded-none data-[spacing=0]:shadow-none data-[spacing=0]:focus-visible:shadow-focus',
        'data-[spacing=0]:first:rounded-l-md data-[spacing=0]:last:rounded-r-md',
        // Outline strokes overlap by 1px (Figma: -1px margin) so neighbours share a single line.
        'data-[spacing=0]:data-[variant=outline]:not-first:-ml-px',
        className,
      )}
      {...props}
    />
  )
}
