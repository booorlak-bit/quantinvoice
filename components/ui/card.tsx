import * as React from 'react'

import { cn } from '@/lib/utils'

/*
 * Figma: Fliq kit → Card (30202:1232) — no variant properties, no states.
 *   Surface  base/card fill · 1px base/border stroke (Figma draws raw #e5e5e5, neutral-200 = base/border light) ·
 *            radius/md (rounded-md, 8px) · spacing/4 padding (16px) · no shadow ("Opaque surface. No glass.").
 *   Title    text-base (15px) · font-weight/medium · base/card-foreground.
 *   Body     text-sm (13px) · font-weight/normal · base/muted-foreground, spacing/2 (8px) below the title.
 *   Figma sets both lines to an auto ("normal", ~1.21) line height: leading-tight (1.25) is the closest token,
 *   which keeps the 320×76 frame within a pixel (77px).
 *
 * shadcn parts: the Figma frame is <Card><CardHeader><CardTitle/><CardDescription/></CardHeader></Card>.
 * The 16px padding is split like shadcn's: py-4 on the card, px-4 on every section, and the sections
 * (header · content · footer) sit spacing/4 apart — the same rhythm as the padding.
 */

export function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn('flex flex-col gap-4 rounded-md border border-border bg-card py-4 text-card-foreground', className)}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-4',
        // A <CardAction> takes a second column spanning the title and description rows.
        'has-data-[slot=card-action]:grid-cols-[1fr_auto]',
        // A divided header keeps the card's 16px rhythm under its border.
        '[.border-b]:pb-4',
        className,
      )}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-title" className={cn('text-base leading-tight font-medium', className)} {...props} />
}

export function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="card-description" className={cn('text-sm leading-tight text-muted-foreground', className)} {...props} />
  )
}

/** Top-right slot of the header (a button, badge or menu), aligned with the title. */
export function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  )
}

export function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('px-4', className)} {...props} />
}

export function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-footer" className={cn('flex items-center px-4 [.border-t]:pt-4', className)} {...props} />
}
