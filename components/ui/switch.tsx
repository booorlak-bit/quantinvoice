'use client'

import * as React from 'react'
import { Switch as SwitchPrimitive } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/*
 * Figma: Switch — Active=Off|On · Type=Default|Box · Side=Left|Right · State=Default|Focus · Size=M|S.
 *   Active → Radix `data-state` (checked / unchecked), State → CSS (`focus-visible:`), Size → `size` on <Switch>,
 *   Type / Side → `type` / `side` on <SwitchField>, the label + description wrapper drawn around the switch in Figma.
 */

// Track: 44×20 (S: 32×16) pill with spacing/0-5 padding around the thumb. Off = base/input, On = base/primary.
// Focus: focus/default ring, plus a 1px base/ring inside stroke while Off (drawn as an inset outline so the
// thumb never moves — Figma's 2px transparent stroke is excluded from layout, so it is not reproduced).
// Only the background and the focus shadow animate: animating the outline too would flash a 3px currentColor
// outline (the browser default width/colour) on every keyboard focus before it settles on the 1px ring.
const switchVariants = cva(
  [
    'peer inline-flex shrink-0 items-center rounded-full p-0.5 outline-none transition-[background-color,box-shadow]',
    'data-[state=unchecked]:bg-input data-[state=checked]:bg-primary',
    'focus-visible:shadow-focus',
    'data-[state=unchecked]:focus-visible:outline-1 data-[state=unchecked]:focus-visible:-outline-offset-1 data-[state=unchecked]:focus-visible:outline-ring data-[state=unchecked]:focus-visible:outline-solid',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  {
    variants: {
      size: {
        default: 'h-5 w-11',
        sm: 'h-4 w-8',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
)

// Thumb: a pill (wider than tall) in base/background with shadow/sm.
const switchThumbVariants = cva(
  'pointer-events-none block rounded-full bg-background shadow-sm ring-0 transition-transform data-[state=unchecked]:translate-x-0',
  {
    variants: {
      size: {
        default: 'h-4 w-6 data-[state=checked]:translate-x-4',
        sm: 'h-3 w-4 data-[state=checked]:translate-x-3',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
)

export function Switch({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & VariantProps<typeof switchVariants>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(switchVariants({ size }), className)}
      {...props}
    >
      <SwitchPrimitive.Thumb data-slot="switch-thumb" className={switchThumbVariants({ size })} />
    </SwitchPrimitive.Root>
  )
}

// Field: the Figma component's text + layout. Type=Box draws a card (base/background, rounded-lg, shadow/xs,
// spacing/4) with a 1px base/border inside stroke — an inset ring, so like in Figma it does not add to the padding.
// Side=Right puts the switch after the text.
const switchFieldVariants = cva('group/switch-field flex items-start gap-3', {
  variants: {
    type: {
      default: '',
      box: 'rounded-lg bg-background p-4 shadow-xs inset-ring inset-ring-border',
    },
    side: {
      left: 'flex-row',
      right: 'flex-row-reverse',
    },
  },
  defaultVariants: {
    type: 'default',
    side: 'left',
  },
})

/** A `<label>` wrapping a `<Switch>` and its text, so clicking anywhere on it toggles the switch. */
export function SwitchField({
  className,
  type = 'default',
  side = 'left',
  ...props
}: React.ComponentProps<'label'> & VariantProps<typeof switchFieldVariants>) {
  return (
    <label
      data-slot="switch-field"
      data-type={type}
      data-side={side}
      className={cn(switchFieldVariants({ type, side }), className)}
      {...props}
    />
  )
}

export function SwitchFieldContent({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="switch-field-content"
      className={cn(
        'flex min-w-0 flex-1 flex-col gap-2',
        // Figma "Text Switch Wrapper": 3px top padding lines the title up with the track (Type=Default only).
        'group-data-[type=default]/switch-field:pt-[3px]',
        'group-has-[[data-slot=switch]:disabled]/switch-field:cursor-not-allowed group-has-[[data-slot=switch]:disabled]/switch-field:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export function SwitchFieldTitle({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="switch-field-title"
      className={cn('text-sm leading-none font-semibold text-foreground', className)}
      {...props}
    />
  )
}

export function SwitchFieldDescription({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="switch-field-description"
      className={cn('text-sm font-medium text-muted-foreground', className)}
      {...props}
    />
  )
}

export { switchVariants, switchThumbVariants, switchFieldVariants }
