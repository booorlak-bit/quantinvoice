import * as React from 'react'
import { Slot } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { IconChevronDownMedium, IconChevronRightMedium, IconDotGrid1x3Horizontal } from 'central-icons'

import { cn } from '@/lib/utils'

// Figma: Breadcrumb (16:8714) — Size=md | sm, and Breadcrumb / BreadcrumbItem (16:8772) — Variant × State.
// List: flex-wrap · spacing/1-5 gap between every item and separator · text-sm/leading-normal/medium ·
// base/muted-foreground. Separators are 15px Icon / ChevronRight (or Icon / Slash) in base/muted-foreground.
// Item variants:
//   Link          base/muted-foreground → base/foreground on hover.
//   Link Current  base/foreground, no hover.
//   Dropdown      label + 15px Icon / ChevronDown, spacing/1 apart; hover does not change it.
//   Ellipsis      w-9 × h-9 box with a 16px Icon / Ellipsis in base/muted-foreground; hover does not change it.
// Focus (every variant): a border-width/border custom/outline stroke with border-radius/rounded-xs — inside the
// item box for Link / Link Current / Dropdown, and hugging the 16px icon for Ellipsis.
// An item can carry a Badge after its label (after the chevron for Dropdown), spacing/2-5 apart (Figma "Show Badge").
// Size=md and Size=sm are identical in Figma (same type, gaps and icon sizes), so there is no size prop.

const focusStroke =
  'focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-custom-outline focus-visible:outline-solid'

export const breadcrumbItemVariants = cva(
  [
    // Only the text colour animates: with transition-colors the focus stroke would fade in from currentColor.
    'inline-flex items-center rounded-xs outline-none transition-[color]',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  ],
  {
    variants: {
      variant: {
        link: ['gap-2.5 text-muted-foreground', 'hover:text-foreground', focusStroke],
        'link-current': ['gap-2.5 text-foreground', focusStroke],
        dropdown: [
          'gap-1 text-muted-foreground',
          // Figma puts the badge after the chevron, spacing/2-5 away (gap-1 + ml-1.5).
          '[&>[data-slot=badge]]:order-last [&>[data-slot=badge]]:ml-1.5',
          focusStroke,
        ],
        ellipsis: [
          'size-9 justify-center text-muted-foreground',
          "[&_svg:not([class*='size-'])]:size-4 [&>svg]:rounded-xs",
          // The stroke hugs the icon (1px outside its 16px box), not the 36px hit area.
          'focus-visible:[&>svg]:outline-1 focus-visible:[&>svg]:outline-custom-outline focus-visible:[&>svg]:outline-solid',
        ],
      },
    },
    defaultVariants: {
      variant: 'link',
    },
  },
)

export type BreadcrumbItemVariant = NonNullable<VariantProps<typeof breadcrumbItemVariants>['variant']>

export function Breadcrumb({ ...props }: React.ComponentProps<'nav'>) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />
}

export function BreadcrumbList({ className, ...props }: React.ComponentProps<'ol'>) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn('flex flex-wrap items-center gap-1.5 text-sm font-medium break-words text-muted-foreground', className)}
      {...props}
    />
  )
}

export function BreadcrumbItem({ className, ...props }: React.ComponentProps<'li'>) {
  return <li data-slot="breadcrumb-item" className={cn('inline-flex items-center gap-1.5', className)} {...props} />
}

/** Figma "Variant=Link". */
export function BreadcrumbLink({
  asChild = false,
  className,
  ...props
}: React.ComponentProps<'a'> & {
  /** Render the child element (e.g. a router link) with the link styles instead of an `<a>`. */
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : 'a'

  return <Comp data-slot="breadcrumb-link" className={cn(breadcrumbItemVariants({ variant: 'link' }), className)} {...props} />
}

/** Figma "Variant=Link Current" — the page the user is on. */
export function BreadcrumbPage({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn(breadcrumbItemVariants({ variant: 'link-current' }), className)}
      {...props}
    />
  )
}

/**
 * Figma "Variant=Dropdown" — a label with a chevron that opens a menu of sibling pages.
 * Wrap it in a menu or popover trigger (`<PopoverTrigger asChild>`).
 */
export function BreadcrumbDropdownTrigger({
  asChild = false,
  className,
  children,
  ...props
}: React.ComponentProps<'button'> & {
  /** Render the child element with the dropdown styles and chevron instead of a `<button>`. */
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="breadcrumb-dropdown-trigger"
      type={asChild ? undefined : 'button'}
      className={cn(breadcrumbItemVariants({ variant: 'dropdown' }), className)}
      {...props}
    >
      <Slot.Slottable>{children}</Slot.Slottable>
      <IconChevronDownMedium aria-hidden="true" />
    </Comp>
  )
}

export function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg:not([class*='size-'])]:size-3.5", className)}
      {...props}
    >
      {children ?? <IconChevronRightMedium />}
    </li>
  )
}

/**
 * Figma "Variant=Ellipsis" — collapsed items. Decorative by default; pass `asChild` with a button (or a menu
 * trigger) to make it interactive.
 */
export function BreadcrumbEllipsis({
  asChild = false,
  className,
  children,
  ...props
}: React.ComponentProps<'span'> & {
  /** Render the child element (e.g. a `<button>`) as the ellipsis instead of a decorative `<span>`. */
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : 'span'

  return (
    <Comp
      data-slot="breadcrumb-ellipsis"
      role={asChild ? undefined : 'presentation'}
      aria-hidden={asChild ? undefined : true}
      className={cn(breadcrumbItemVariants({ variant: 'ellipsis' }), className)}
      {...props}
    >
      <IconDotGrid1x3Horizontal aria-hidden="true" />
      <Slot.Slottable>{children ?? <span className="sr-only">More</span>}</Slot.Slottable>
    </Comp>
  )
}
