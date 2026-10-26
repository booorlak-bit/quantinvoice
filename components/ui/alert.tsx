import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

// Figma: Alert (16:2173) — Type × Sentiment. Not interactive, so there are no states.
// px-4 · py-3 · rounded-lg · text-sm/leading-normal (13/18) · 16px icon 2px down, gap-3 to the text ·
// title medium on one line (ellipsis) · gap-1 between title and description · optional action (Figma "button") at the
// right, vertically centred against the text block.
// Type sets the colour of the icon and text (Default: base/foreground title + base/muted-foreground description).
// Sentiment sets the surface: Neutral → base/muted · Subtle → tailwind colors/*-100 (base/sidebar-border for Default) ·
// Prominent → a solid fill with base/primary-foreground text, the description switches to medium.
// Figma binds the raw palette where code might expect a semantic token, so these stay palette classes on purpose:
//   Warning text      tailwind colors/amber/500 (Neutral, Prominent) · orange/500 (Subtle) — not base/warning.
//   Prominent fills   tailwind colors/red/500 · green/500 · orange/400 — not base/destructive / success / warning
//                     (Info and Accent do bind base/info and base/primary).
//   Subtle fills      tailwind colors/{red,green,orange,blue,indigo}/100.
// Those palette variables are not mode-aware and Figma has no dark Alert, so in dark mode the Subtle -100 pastels would
// keep their light fill under the (mode-aware) dark text tokens. Dark mode therefore swaps them for the
// custom/hues/{c}-background-subtle tints, as Badge does for its Color variant; the Type text tokens read on those.

export const alertVariants = cva(
  [
    // Columns: [icon][text][action]. Rows: [pad][title][description][pad] — the 1fr pad rows stay at 0 unless the action is
    // taller than the text, then they split the extra height and centre the text block (Figma's items-center on the root).
    // The icon sits in the first text row; without a title the description moves up into that row.
    'relative grid w-full grid-cols-[auto_minmax(0,1fr)_auto] grid-rows-[1fr_auto_auto_1fr] items-start rounded-lg px-4 py-3 text-sm',
    '[&>svg]:pointer-events-none [&>svg]:col-start-1 [&>svg]:row-start-2 [&>svg]:mr-3 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:translate-y-0.5 [&>svg]:text-current',
  ],
  {
    variants: {
      // Figma "Type".
      variant: {
        default: 'text-foreground',
        destructive: 'text-destructive',
        success: 'text-success',
        warning: 'text-amber-500',
        info: 'text-info',
        accent: 'text-primary',
      },
      // Figma "Sentiment". Subtle / Prominent fills depend on the Type — see compoundVariants.
      sentiment: {
        neutral: 'bg-muted',
        subtle: '',
        prominent: 'text-primary-foreground *:data-[slot=alert-description]:font-medium',
      },
    },
    compoundVariants: [
      {
        variant: 'default',
        sentiment: ['neutral', 'subtle'],
        className: '*:data-[slot=alert-description]:text-muted-foreground',
      },
      // Subtle (dark: custom/hues tints — see the header)
      { variant: 'default', sentiment: 'subtle', className: 'bg-sidebar-border' },
      { variant: 'destructive', sentiment: 'subtle', className: 'bg-red-100 dark:bg-custom-hues-red-background-subtle' },
      { variant: 'success', sentiment: 'subtle', className: 'bg-green-100 dark:bg-custom-hues-green-background-subtle' },
      {
        variant: 'warning',
        sentiment: 'subtle',
        className: 'bg-orange-100 text-orange-500 dark:bg-custom-hues-orange-background-subtle',
      },
      { variant: 'info', sentiment: 'subtle', className: 'bg-blue-100 dark:bg-custom-hues-blue-background-subtle' },
      { variant: 'accent', sentiment: 'subtle', className: 'bg-indigo-100 dark:bg-custom-hues-indigo-background-subtle' },
      // Prominent
      { variant: 'default', sentiment: 'prominent', className: 'bg-muted-foreground' },
      { variant: 'destructive', sentiment: 'prominent', className: 'bg-red-500' },
      { variant: 'success', sentiment: 'prominent', className: 'bg-green-500' },
      { variant: 'warning', sentiment: 'prominent', className: 'bg-orange-400' },
      { variant: 'info', sentiment: 'prominent', className: 'bg-info' },
      { variant: 'accent', sentiment: 'prominent', className: 'bg-primary' },
    ],
    defaultVariants: {
      variant: 'default',
      sentiment: 'neutral',
    },
  },
)

export function Alert({
  className,
  variant = 'default',
  sentiment = 'neutral',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      data-variant={variant}
      data-sentiment={sentiment}
      role="alert"
      className={cn(alertVariants({ variant, sentiment }), className)}
      {...props}
    />
  )
}

export function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="alert-title" className={cn('col-start-2 row-start-2 truncate font-medium', className)} {...props} />
}

export function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'col-start-2 row-start-2 [[data-slot=alert-title]~&]:row-start-3 [[data-slot=alert-title]~&]:mt-1',
        className,
      )}
      {...props}
    />
  )
}

/** Trailing slot for a button (Figma's "button" property), centred against the title and description. */
export function AlertAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-action"
      className={cn('col-start-3 row-[1/-1] ml-3 flex items-center gap-2 self-center', className)}
      {...props}
    />
  )
}
