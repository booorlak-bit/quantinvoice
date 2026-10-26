'use client'

import * as React from 'react'
import { Popover as PopoverPrimitive } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

// There is no Popover page in Figma. Popover uses the floating-card surface of Hover Card / Card (19:2896),
// which every floating panel shares (hover card, popover, menus, combobox, date picker):
// base/popover fill (white 85% light · neutral-950 60% dark) + backdrop-blur/md · border-radius/rounded-lg ·
// shadow/sm · spacing/3 padding · spacing/4 gap between children · base/popover-foreground ·
// text-sm/leading-normal/normal. Figma draws no stroke — the 0 0 1px layer of shadow/sm is the edge.
//
// variant="card" is the Fliq kit Popover (30202:1237): an opaque card instead of glass — base/card fill ·
// 1px base/border stroke · radius/md · spacing/3 padding · spacing/2 gap · 280px wide · no shadow, no blur ·
// base/foreground text. Its content is a label (text-xs/medium, base/muted-foreground) over a value (text-sm/normal,
// leading-4 for Figma's raw "leading normal").

/** The floating-card surface (fill, blur, radius, shadow, padding, text). Reuse it for any floating panel. */
export const popoverSurface =
  'rounded-lg bg-popover p-3 text-sm text-popover-foreground shadow-sm backdrop-blur-md outline-hidden'

/** Enter / exit animation shared by floating panels (Radix sets data-state and data-side). */
export const popoverMotion = cn(
  'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
  'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
  'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
  'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
)

export const popoverContentVariants = cva(
  ['z-50 flex origin-(--radix-popover-content-transform-origin) flex-col outline-hidden', popoverMotion],
  {
    variants: {
      variant: {
        /** Hover Card / Card: the translucent, blurred floating surface shared by every floating panel. */
        default: [popoverSurface, 'w-72 gap-4'],
        /**
         * Fliq kit Popover: an opaque card — no shadow, no blur. Figma sets its text in "leading normal" (≈15.7px for
         * the 13px value): leading-4 (16px) is the closest token, so the panel is 64px tall like Figma's 63px.
         */
        card: 'w-70 gap-2 rounded-md border border-border bg-card p-3 text-sm leading-4 text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

export function PopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

export function PopoverAnchor({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

// The panel is a role="dialog". A PopoverTitle / PopoverDescription inside it names / describes it (aria-labelledby /
// aria-describedby), like DialogTitle does for Dialog. They register their id with the content they sit in.
type PopoverLabelling = {
  setTitleId: (id: string | undefined) => void
  setDescriptionId: (id: string | undefined) => void
}
const PopoverLabellingContext = React.createContext<PopoverLabelling | null>(null)

function useRegisterId(id: string, register: ((id: string | undefined) => void) | undefined) {
  React.useLayoutEffect(() => {
    if (!register) return
    register(id)
    return () => register(undefined)
  }, [id, register])
}

/**
 * The panel. Give it a PopoverTitle, or an aria-label / aria-labelledby when it has no visible title: a dialog
 * needs a name.
 */
export function PopoverContent({
  className,
  variant = 'default',
  align = 'center',
  sideOffset = 4,
  container,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> &
  VariantProps<typeof popoverContentVariants> & {
    /** Element to portal into (defaults to document.body). */
    container?: React.ComponentProps<typeof PopoverPrimitive.Portal>['container']
  }) {
  const [titleId, setTitleId] = React.useState<string>()
  const [descriptionId, setDescriptionId] = React.useState<string>()
  const labelling = React.useMemo(() => ({ setTitleId, setDescriptionId }), [])

  return (
    <PopoverPrimitive.Portal container={container}>
      <PopoverLabellingContext.Provider value={labelling}>
        <PopoverPrimitive.Content
          data-slot="popover-content"
          data-variant={variant}
          align={align}
          sideOffset={sideOffset}
          // An explicit aria-label wins over the title (aria-labelledby would take precedence over it).
          aria-labelledby={props['aria-label'] ? undefined : titleId}
          aria-describedby={descriptionId}
          className={cn(popoverContentVariants({ variant }), className)}
          {...props}
        />
      </PopoverLabellingContext.Provider>
    </PopoverPrimitive.Portal>
  )
}

/** Stacks a title and a description at the top of the panel. */
export function PopoverHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="popover-header" className={cn('flex flex-col gap-1', className)} {...props} />
}

/** The panel's heading; it becomes the popover's accessible name. */
export function PopoverTitle({ className, id, ...props }: React.ComponentProps<'div'>) {
  const autoId = React.useId()
  const titleId = id ?? autoId
  useRegisterId(titleId, React.useContext(PopoverLabellingContext)?.setTitleId)
  return <div id={titleId} data-slot="popover-title" className={cn('text-sm font-medium', className)} {...props} />
}

/** Supporting text; it becomes the popover's accessible description. */
export function PopoverDescription({ className, id, ...props }: React.ComponentProps<'p'>) {
  const autoId = React.useId()
  const descriptionId = id ?? autoId
  useRegisterId(descriptionId, React.useContext(PopoverLabellingContext)?.setDescriptionId)
  return (
    <p id={descriptionId} data-slot="popover-description" className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
}
