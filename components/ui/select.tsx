'use client'

import * as React from 'react'
import { Select as SelectPrimitive } from 'radix-ui'
import { IconCheckmark1Medium, IconChevronDownMedium, IconChevronTopMedium } from 'central-icons'

import { cn } from '@/lib/utils'

// Figma: Select (18:862) — State=Default | Focus | Filled | Filled (Focus) | Disabled,
// Select Menu / Item (18:703) — Type=Simple | Icon · Variant=Default | Checkbox · State=Default | Hover,
// Select Menu / Label (18:641) and Select / Menu (18:898).

export function Select({ ...props }: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

export function SelectGroup({ ...props }: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

export function SelectValue({ ...props }: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

// _SelectTrigger: h-8 · px-3 · py-2 · gap-2 · rounded-lg · base/input fill · text-sm/leading-normal/medium.
// Icon / ChevronDown and a leading icon (Show Icon) in base/muted-foreground.
// Placeholder base/muted-foreground, value (Filled) base/foreground. Icon / ChevronDown 16px.
// Focus / Filled (Focus): 1px base/ring stroke + focus/default (also while open), text base/foreground.
// Disabled: opacity 50 + shadow/xs + 1px base/input stroke.
export function SelectTrigger({
  className,
  size = 'default',
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  /** `default` is the Figma trigger (h-8). `sm` (h-7, rounded-md) is shadcn's compact size and matches Button sm. */
  size?: 'sm' | 'default'
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        'flex w-fit items-center justify-between gap-2 bg-input px-3 py-2 text-sm font-medium whitespace-nowrap text-foreground outline-none transition-[color,box-shadow]',
        'data-[size=default]:h-8 data-[size=default]:rounded-lg data-[size=sm]:h-7 data-[size=sm]:rounded-md',
        'data-[placeholder]:text-muted-foreground',
        // 1px stroke drawn inside the edge (a Figma inside stroke) so focus never shifts the layout.
        'focus-visible:shadow-focus focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-ring focus-visible:outline-solid focus-visible:data-[placeholder]:text-foreground',
        'data-[state=open]:shadow-focus data-[state=open]:outline-1 data-[state=open]:-outline-offset-1 data-[state=open]:outline-ring data-[state=open]:outline-solid data-[state=open]:data-[placeholder]:text-foreground',
        'aria-invalid:outline-1 aria-invalid:-outline-offset-1 aria-invalid:outline-destructive aria-invalid:outline-solid',
        'aria-invalid:focus-visible:shadow-focus-destructive aria-invalid:focus-visible:outline-destructive',
        'aria-invalid:data-[state=open]:shadow-focus-destructive aria-invalid:data-[state=open]:outline-destructive',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-xs disabled:outline-1 disabled:-outline-offset-1 disabled:outline-input disabled:outline-solid',
        '*:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:flex-1 *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 *:data-[slot=select-value]:text-left',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <IconChevronDownMedium className="size-4" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

// Select / Menu: p-1 · rounded-md · base/popover · shadow/md; the item group inside has another p-1.
// base/popover is translucent (white 85% · neutral-950 60%), so the menu takes the backdrop-blur/md of the shared
// floating surface (popover.tsx) to keep the page behind it from showing through.
export const selectContentClassName =
  'relative z-50 max-h-(--radix-select-content-available-height) min-w-32 origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md bg-popover p-1 text-popover-foreground shadow-md backdrop-blur-md'

export function SelectContent({
  className,
  children,
  position = 'popper',
  align = 'center',
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          selectContentClassName,
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className,
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' && 'h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width) scroll-my-1',
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

// Select Menu / Label: px-2 · py-1.5 · text-xs/leading-normal/medium base/muted-foreground.
export const selectLabelClassName = 'px-2 py-1.5 text-xs font-medium text-muted-foreground'

export function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(selectLabelClassName, className)}
      {...props}
    />
  )
}

// Select Menu / Item: pl-2 · pr-8 · py-1.5 · gap-2 · rounded-sm · text-sm/leading-normal/normal base/popover-foreground.
// Hover (pointer or keyboard highlight): base/accent fill. Variant=Checkbox: Icon / Check 16px at right-2 in
// base/popover-foreground. Type=Icon: a 16px leading icon passed as a child, in base/muted-foreground (as in the Figma
// playground and shadcn).
export const selectItemClassName = cn(
  'relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm font-normal text-popover-foreground outline-hidden select-none',
  'hover:bg-accent focus:bg-accent data-[highlighted]:bg-accent',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
  '*:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2',
)

/** The Variant=Checkbox mark of a selected item. */
export const selectItemIndicatorClassName = 'absolute right-2 flex size-4 items-center justify-center text-popover-foreground'

export function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(selectItemClassName, className)}
      {...props}
    >
      <span data-slot="select-item-indicator" className={selectItemIndicatorClassName}>
        <SelectPrimitive.ItemIndicator>
          <IconCheckmark1Medium className="size-4 text-popover-foreground" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

export function SelectSeparator({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn('pointer-events-none -mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  )
}

// _SelectItem (scroll affordance): py-1 · Icon / ChevronUp | ChevronDown.
export function SelectScrollUpButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn('flex cursor-default items-center justify-center py-1 text-popover-foreground', className)}
      {...props}
    >
      <IconChevronTopMedium className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

export function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn('flex cursor-default items-center justify-center py-1 text-popover-foreground', className)}
      {...props}
    >
      <IconChevronDownMedium className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}
