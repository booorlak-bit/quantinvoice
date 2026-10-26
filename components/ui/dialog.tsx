'use client'

import * as React from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { IconCrossMedium } from 'central-icons'

import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'

// Figma: Dialog (19:16261) — Breakpoint=lg | sm, booleans Show Close, 1st / 2nd / 3rd Button, Slot.
// Surface: base/popover fill + backdrop-blur/2xl · border-[0.5px] base/border · rounded-2xl · shadow/2xl ·
// max-w 425px (raw value in Figma, the shadcn demo width) · gap-4 between header, body and footer.
// Title text-base/leading-normal/semibold base/foreground, description text-sm/leading-normal/medium
// base/muted-foreground, title ↔ description gap-1.
//
// Breakpoint=lg (≥ sm / 640px): spacing/4 padding, left-aligned header with the close button beside it
// (header gap-3 + 28px button → pr-10), footer is a right-aligned row (gap-2).
// Breakpoint=sm (< 640px): spacing/5 padding, centred header, footer stacks full-width buttons with the
// primary action on top (flex-col-reverse, so the DOM order stays Cancel → Confirm like shadcn).
// `breakpoint="responsive"` (default) switches at 640px; `"lg"` / `"sm"` pin one layout.
// Close: Button ghost icon-sm (28px) with Icon / X, 16px from the top-right corner (what the Dialog symbols use).
// The separate "Dialog / Close Icon" set (16px X, opacity 70 → 100, 2px ring) is `dialogCloseIconClasses`.

export type DialogBreakpoint = 'responsive' | 'lg' | 'sm'

/** The dialog panel: surface, padding per breakpoint and the `group/dialog-content` hook the parts read. */
export const dialogContentVariants = cva(
  [
    'group/dialog-content flex w-full max-w-[calc(100%-2rem)] flex-col gap-4 sm:max-w-[425px]',
    'max-h-[calc(100dvh-2rem)] overflow-y-auto',
    'rounded-2xl border-[0.5px] border-border bg-popover text-popover-foreground shadow-2xl backdrop-blur-2xl outline-hidden',
    // Padding goes through a variable so a plain `p-*` override (e.g. `p-0`) replaces it at every width.
    'p-(--dialog-padding)',
  ],
  {
    variants: {
      breakpoint: {
        responsive: '[--dialog-padding:var(--spacing-5)] sm:[--dialog-padding:var(--spacing-4)]',
        lg: '[--dialog-padding:var(--spacing-4)]',
        sm: '[--dialog-padding:var(--spacing-5)]',
      },
    },
    defaultVariants: {
      breakpoint: 'responsive',
    },
  },
)

/** Enter / exit animation and viewport centring for the dialog panels (Radix sets data-state). */
export const dialogContentPosition = cn(
  'fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 duration-200',
  'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
  'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
)

/** The X button: Button ghost icon-sm (28px) with a muted 16px icon. DialogContent pins it to the top-right corner. */
export const dialogCloseButtonClasses = buttonVariants({ variant: 'ghost', size: 'icon-sm' })

/**
 * Figma "Dialog / Close Icon" (19:16299), State=Default | Hover | Focus: the compact 16px X (shadcn's classic close).
 * base/foreground at opacity-70, full opacity on hover, a border-2 base/ring stroke inside the rounded-xs box on focus.
 * Use it on a DialogClose for a custom close, with `showCloseButton={false}` on DialogContent.
 */
export const dialogCloseIconClasses = cn(
  'inline-flex size-4 shrink-0 items-center justify-center rounded-xs text-foreground opacity-70 outline-none transition-opacity',
  'hover:opacity-100 disabled:pointer-events-none',
  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid',
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
)

export function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

export function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

export function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

export function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

/** custom/Overlay scrim behind modal dialogs (shared with Alert Dialog). */
export const dialogOverlayClasses = cn(
  'fixed inset-0 z-50 bg-custom-overlay',
  'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
)

export function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return <DialogPrimitive.Overlay data-slot="dialog-overlay" className={cn(dialogOverlayClasses, className)} {...props} />
}

export function DialogContent({
  className,
  children,
  breakpoint = 'responsive',
  showCloseButton = true,
  container,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> &
  VariantProps<typeof dialogContentVariants> & {
    /** Renders the X button in the top-right corner. Figma property Show Close. */
    showCloseButton?: boolean
    /** Element to portal into (defaults to document.body). */
    container?: React.ComponentProps<typeof DialogPrimitive.Portal>['container']
  }) {
  const resolved = breakpoint ?? 'responsive'
  return (
    <DialogPortal container={container}>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        data-breakpoint={resolved}
        className={cn(dialogContentVariants({ breakpoint: resolved }), dialogContentPosition, className)}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className={cn(dialogCloseButtonClasses, 'absolute top-4 right-4')}
          >
            <IconCrossMedium />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

export function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        'flex flex-col gap-1 text-center',
        // lg layout: left-aligned, and clear of the close button (a direct child of the panel).
        'sm:group-data-[breakpoint=responsive]/dialog-content:text-left group-data-[breakpoint=lg]/dialog-content:text-left',
        'sm:group-data-[breakpoint=responsive]/dialog-content:group-has-[>[data-slot=dialog-close]]/dialog-content:pr-10',
        'group-data-[breakpoint=lg]/dialog-content:group-has-[>[data-slot=dialog-close]]/dialog-content:pr-10',
        className,
      )}
      {...props}
    />
  )
}

export function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  /** Appends an outline "Close" button that closes the dialog. */
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2',
        // lg layout: a right-aligned row. Put `mr-auto` on a button to pin it to the left (Figma 3rd Button).
        'sm:group-data-[breakpoint=responsive]/dialog-content:flex-row sm:group-data-[breakpoint=responsive]/dialog-content:justify-end',
        'group-data-[breakpoint=lg]/dialog-content:flex-row group-data-[breakpoint=lg]/dialog-content:justify-end',
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

export function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-base font-semibold text-foreground', className)}
      {...props}
    />
  )
}

export function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-sm font-medium text-muted-foreground', className)}
      {...props}
    />
  )
}
