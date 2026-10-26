import * as React from 'react'
import { Slot } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

/*
 * No Figma component — shadcn's Item, derived from the Card surface (30202:1232) and the Dropdown Menu / Combobox
 * items (16:35951, Combobox item):
 *   Surface   rounded-md (radius/md, the Card radius) · 1px stroke that is transparent unless variant="outline"
 *             (base/border, the Card stroke) · text-sm/leading-normal.
 *   Variant   default → transparent · outline → base/border stroke · muted → base/muted at 50%.
 *   Size      default → spacing/4 padding and gap (the Card padding) · sm → spacing/3 × spacing/4, gap spacing/2-5.
 *   Hover     only when the item is a link (asChild + <a>): base/accent fill — the menu item highlight.
 *   Focus     the stroke turns base/ring + focus/default ring (the same treatment as the avatar menu trigger).
 *   Media     default → bare 16px icon in base/muted-foreground (menu item icons) ·
 *             icon → 32px base/muted tile, 1px base/border stroke, rounded-sm, base/foreground icon ·
 *             image → 40px rounded-sm image (the size-10 Avatar step).
 *   Title     text-sm/leading-normal/medium · Description text-sm/leading-normal/normal base/muted-foreground, 2 lines.
 */

export function ItemGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return <div role="list" data-slot="item-group" className={cn('group/item-group flex flex-col', className)} {...props} />
}

export function ItemSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return <Separator data-slot="item-separator" orientation="horizontal" className={cn('my-0', className)} {...props} />
}

export const itemVariants = cva(
  [
    'group/item flex flex-wrap items-center rounded-md border border-transparent text-sm outline-none transition-[color,background-color,border-color,box-shadow] duration-100',
    // A link item highlights like a menu item.
    '[a]:hover:bg-accent [a]:hover:text-accent-foreground',
    'focus-visible:border-ring focus-visible:shadow-focus',
  ],
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline: 'border-border',
        muted: 'bg-muted/50',
      },
      size: {
        default: 'gap-4 p-4',
        sm: 'gap-2.5 px-4 py-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export function Item({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof itemVariants> & {
    /** Render the child element (e.g. a link) as the item. Links get the hover highlight. */
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'div'
  return (
    <Comp
      data-slot="item"
      data-variant={variant}
      data-size={size}
      className={cn(itemVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export const itemMediaVariants = cva(
  [
    'flex shrink-0 items-center justify-center gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0',
    // With a description the media aligns to the title's first line instead of the item's centre.
    'group-has-[[data-slot=item-description]]/item:translate-y-0.5 group-has-[[data-slot=item-description]]/item:self-start',
  ],
  {
    variants: {
      variant: {
        default: "bg-transparent [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        icon: "size-8 rounded-sm border border-border bg-muted text-foreground [&_svg:not([class*='size-'])]:size-4",
        image: 'size-10 overflow-hidden rounded-sm [&_img]:size-full [&_img]:object-cover',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export function ItemMedia({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof itemMediaVariants>) {
  return (
    <div
      data-slot="item-media"
      data-variant={variant}
      className={cn(itemMediaVariants({ variant, className }))}
      {...props}
    />
  )
}

export function ItemContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="item-content"
      className={cn('flex flex-1 flex-col gap-1 [&+[data-slot=item-content]]:flex-none', className)}
      {...props}
    />
  )
}

export function ItemTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="item-title"
      className={cn('flex w-fit items-center gap-2 text-sm font-medium', className)}
      {...props}
    />
  )
}

export function ItemDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="item-description"
      className={cn(
        'line-clamp-2 text-sm font-normal text-balance text-muted-foreground',
        '[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary',
        className,
      )}
      {...props}
    />
  )
}

export function ItemActions({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="item-actions" className={cn('flex items-center gap-2', className)} {...props} />
}

export function ItemHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="item-header"
      className={cn('flex basis-full items-center justify-between gap-2', className)}
      {...props}
    />
  )
}

export function ItemFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="item-footer"
      className={cn('flex basis-full items-center justify-between gap-2', className)}
      {...props}
    />
  )
}
