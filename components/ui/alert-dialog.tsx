'use client'

import * as React from 'react'
import { AlertDialog as AlertDialogPrimitive } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { dialogContentPosition, dialogOverlayClasses } from '@/components/ui/dialog'

// Figma: Alert Dialog (16:8480) — Breakpoint=md | sm.
// Surface: base/background fill · border-[0.5px] base/border · rounded-2xl · shadow/2xl · spacing/5 padding ·
// w 384px (max-w-sm) · gap-4 between header and footer. Header gap-2: title text-base/leading-normal/semibold
// base/foreground, description text-sm/leading-normal/medium base/muted-foreground.
// Footer gap-2 with an outline Cancel and a default Continue (Button, size default).
//
// Breakpoint=md (≥ sm / 640px): left-aligned header, footer is a right-aligned row.
// Breakpoint=sm (< 640px): centred header, both buttons share the row (flex-1) with the action first
// (flex-row-reverse, so the DOM order stays Cancel → Action like shadcn).
// `breakpoint="responsive"` (default) switches at 640px; `"md"` / `"sm"` pin one layout.

export type AlertDialogBreakpoint = 'responsive' | 'md' | 'sm'

/** The alert dialog panel: surface and the `group/alert-dialog-content` hook the parts read. */
export const alertDialogContentVariants = cva(
  [
    'group/alert-dialog-content flex w-full max-w-[calc(100%-2rem)] flex-col gap-4 sm:max-w-sm',
    'rounded-2xl border-[0.5px] border-border bg-background p-5 text-foreground shadow-2xl outline-hidden',
  ],
  {
    variants: {
      // The layout lives in the header and footer (they read data-breakpoint from the panel).
      breakpoint: {
        responsive: '',
        md: '',
        sm: '',
      },
    },
    defaultVariants: {
      breakpoint: 'responsive',
    },
  },
)

export function AlertDialog({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

export function AlertDialogTrigger({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
}

export function AlertDialogPortal({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
}

/** custom/Overlay scrim — the same one Dialog uses. */
export function AlertDialogOverlay({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(dialogOverlayClasses, className)}
      {...props}
    />
  )
}

export function AlertDialogContent({
  className,
  breakpoint = 'responsive',
  container,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content> &
  VariantProps<typeof alertDialogContentVariants> & {
    /** Element to portal into (defaults to document.body). */
    container?: React.ComponentProps<typeof AlertDialogPrimitive.Portal>['container']
  }) {
  const resolved = breakpoint ?? 'responsive'
  return (
    <AlertDialogPortal container={container}>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        data-breakpoint={resolved}
        className={cn(alertDialogContentVariants({ breakpoint: resolved }), dialogContentPosition, className)}
        {...props}
      />
    </AlertDialogPortal>
  )
}

export function AlertDialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        'flex flex-col gap-2 text-center',
        'sm:group-data-[breakpoint=responsive]/alert-dialog-content:text-left group-data-[breakpoint=md]/alert-dialog-content:text-left',
        className,
      )}
      {...props}
    />
  )
}

export function AlertDialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        // sm layout: one row, equal-width buttons, action first.
        'flex flex-row-reverse gap-2 *:flex-1',
        // md layout: right-aligned row of hugging buttons.
        'sm:group-data-[breakpoint=responsive]/alert-dialog-content:flex-row sm:group-data-[breakpoint=responsive]/alert-dialog-content:justify-end sm:group-data-[breakpoint=responsive]/alert-dialog-content:*:flex-none',
        'group-data-[breakpoint=md]/alert-dialog-content:flex-row group-data-[breakpoint=md]/alert-dialog-content:justify-end group-data-[breakpoint=md]/alert-dialog-content:*:flex-none',
        className,
      )}
      {...props}
    />
  )
}

export function AlertDialogTitle({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn('text-base font-semibold text-foreground', className)}
      {...props}
    />
  )
}

export function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn('text-sm font-medium text-muted-foreground', className)}
      {...props}
    />
  )
}

type ButtonStyleProps = Pick<VariantProps<typeof buttonVariants>, 'variant' | 'size'>

/** Confirms and closes. A default Button; pass `variant="destructive"` for irreversible actions. */
export function AlertDialogAction({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action> & ButtonStyleProps) {
  return (
    <AlertDialogPrimitive.Action
      data-slot="alert-dialog-action"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

/** Dismisses. An outline Button that receives focus when the dialog opens. */
export function AlertDialogCancel({
  className,
  variant = 'outline',
  size = 'default',
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel> & ButtonStyleProps) {
  return (
    <AlertDialogPrimitive.Cancel
      data-slot="alert-dialog-cancel"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}
