'use client'

import * as React from 'react'
import { Dialog as SheetPrimitive } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { IconCrossMedium } from 'central-icons'

import { cn } from '@/lib/utils'
import { dialogCloseButtonClasses, dialogOverlayClasses } from '@/components/ui/dialog'

// Figma: page "Sheet + Drawer" — the Fliq kit "Sheet" symbol (30202:1240, frame 30202:1231) plus the Dialog surface
// (19:16261, src/components/ui/dialog.tsx). The Fliq symbol has no component properties: a 360 × 640 panel for
// "Cell list on a narrow screen. Clickable source, not hover." — a list that opens on click where desktop uses hover.
//
// Surface (Fliq Sheet): base/card fill · radius/md corners · spacing/4 inline and spacing/6 block padding · spacing/3
//          between its children · 360px wide (raw value, no width variable).
// From Dialog: custom/Overlay scrim · border-[0.5px] base/border stroke · shadow/2xl · title / description styles ·
//          the ghost icon-sm close button (Icon / X).
// Only the edges and corners that face the page get the stroke and the radius; the side touching the viewport is flat.
// `side` is shadcn's prop (top | right | bottom | left). Padding sits on the panel so `p-0` (e.g. the mobile Sidebar)
// clears it in one class.

/** Panel surface shared by Sheet and Drawer: the Fliq Sheet fill, padding and rhythm with the Dialog elevation. */
export const sheetSurfaceClasses = cn(
  'flex flex-col gap-3 px-4 py-6',
  'border-border bg-card text-card-foreground shadow-2xl outline-hidden',
)

export const sheetContentVariants = cva(
  [
    'group/sheet-content fixed z-50 overflow-y-auto',
    sheetSurfaceClasses,
    'transition ease-in-out data-[state=open]:animate-in data-[state=open]:duration-500 data-[state=closed]:animate-out data-[state=closed]:duration-300',
  ],
  {
    variants: {
      side: {
        top: [
          'inset-x-0 top-0 h-auto max-h-dvh rounded-b-md border-b-[0.5px]',
          'data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top',
        ],
        right: [
          'inset-y-0 right-0 h-full w-3/4 max-w-[360px] rounded-l-md border-l-[0.5px]',
          'data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
        ],
        bottom: [
          'inset-x-0 bottom-0 h-auto max-h-dvh rounded-t-md border-t-[0.5px]',
          'data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
        ],
        left: [
          'inset-y-0 left-0 h-full w-3/4 max-w-[360px] rounded-r-md border-r-[0.5px]',
          'data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left',
        ],
      },
    },
    defaultVariants: {
      side: 'right',
    },
  },
)

export type SheetSide = NonNullable<VariantProps<typeof sheetContentVariants>['side']>

export function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

export function SheetTrigger({ ...props }: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

export function SheetClose({ ...props }: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

export function SheetPortal({ ...props }: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

/** custom/Overlay scrim — the same one Dialog uses. */
export function SheetOverlay({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return <SheetPrimitive.Overlay data-slot="sheet-overlay" className={cn(dialogOverlayClasses, className)} {...props} />
}

export function SheetContent({
  className,
  children,
  side = 'right',
  showCloseButton = true,
  container,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> &
  VariantProps<typeof sheetContentVariants> & {
    /** Renders the X button in the top-right corner (the Dialog close button). */
    showCloseButton?: boolean
    /** Element to portal into (defaults to document.body). */
    container?: React.ComponentProps<typeof SheetPrimitive.Portal>['container']
  }) {
  const resolved = side ?? 'right'
  return (
    <SheetPortal container={container}>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={resolved}
        className={cn(sheetContentVariants({ side: resolved }), className)}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close data-slot="sheet-close" className={cn(dialogCloseButtonClasses, 'absolute top-5 right-4')}>
            <IconCrossMedium />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

export function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-header"
      className={cn(
        'flex flex-col gap-1 text-left',
        // Clear of the close button (a direct child of the panel): 28px button + spacing/3.
        'group-has-[>[data-slot=sheet-close]]/sheet-content:pr-10',
        className,
      )}
      {...props}
    />
  )
}

/**
 * Pinned to the bottom of side sheets (mt-auto). Buttons stack full-width with the primary action first, like shadcn.
 * Full-width top / bottom sheets switch to a right-aligned row from sm up (primary on the right).
 */
export function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        'mt-auto flex flex-col gap-2',
        'sm:group-data-[side=bottom]/sheet-content:flex-row-reverse sm:group-data-[side=top]/sheet-content:flex-row-reverse',
        className,
      )}
      {...props}
    />
  )
}

/** Same type as DialogTitle: text-base/leading-normal/semibold · base/foreground. */
export function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn('text-base font-semibold text-foreground', className)}
      {...props}
    />
  )
}

/** Same type as DialogDescription: text-sm/leading-normal/medium · base/muted-foreground. */
export function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-sm font-medium text-muted-foreground', className)}
      {...props}
    />
  )
}
