import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/*
 * No Figma component — shadcn's Empty, derived from the Card surface (30202:1232) and Avatar (16:8588):
 *   Empty        a centred column with spacing/6 between header and content · spacing/6 padding (spacing/12 from md) ·
 *                rounded-md (the Card radius). The stroke is opt-in: add `border` for the dashed base/border outline.
 *   Header       max-w-sm column, spacing/2 apart.
 *   Media        default → bare (an Avatar or AvatarGroup) · icon → the size-10 Avatar fallback look:
 *                40px base/muted tile, rounded-lg, base/foreground 24px icon.
 *   Title        text-lg/leading-normal/medium · base/foreground (inherited).
 *   Description  text-sm with a 20px (leading-5) line · base/muted-foreground · underlined links that turn base/primary.
 *   Content      max-w-sm column for actions and inputs, spacing/4 apart.
 * No variants or states of its own.
 */

export function Empty({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty"
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-md border-dashed p-6 text-center text-balance md:p-12',
        className,
      )}
      {...props}
    />
  )
}

export function EmptyHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-header"
      className={cn('flex max-w-sm flex-col items-center gap-2 text-center', className)}
      {...props}
    />
  )
}

export const emptyMediaVariants = cva('mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0', {
  variants: {
    variant: {
      default: 'bg-transparent',
      icon: "size-10 rounded-lg bg-muted text-foreground [&_svg:not([class*='size-'])]:size-6",
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export function EmptyMedia({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      // shadcn names this slot "empty-icon"; kept for selector compatibility.
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant, className }))}
      {...props}
    />
  )
}

export function EmptyTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="empty-title" className={cn('text-lg font-medium tracking-tight', className)} {...props} />
}

export function EmptyDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="empty-description"
      className={cn(
        'text-sm leading-5 text-muted-foreground',
        '[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary',
        className,
      )}
      {...props}
    />
  )
}

export function EmptyContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-content"
      className={cn('flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance', className)}
      {...props}
    />
  )
}
