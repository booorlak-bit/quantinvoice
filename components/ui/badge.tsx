import * as React from 'react'
import { Slot } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

// Figma: Badge (4:213) — Variant × State × Color, and Badge Number (4:374) — Variant × State.
// h-5 · px-1.5 · py-0.5 · gap-1 · rounded-sm · border (transparent unless the variant draws one) ·
// text-xs/leading-normal/medium · 12px icons.
// Hover exists only for Default / Destructive and only applies when the badge is a link (shadcn's `[a&]:`).
// Focus (every variant): the border turns custom/outline and a 1px base/ring @50% ring sits 1px outside,
// separated by base/ring-offset — Figma's "Ring" layer.

export const BADGE_COLORS = [
  'neutral',
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
] as const

export type BadgeColor = (typeof BADGE_COLORS)[number]

export const badgeVariants = cva(
  [
    'inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-sm border border-transparent px-1.5 py-0.5',
    'text-xs font-medium whitespace-nowrap outline-none transition-[color,background-color,box-shadow]',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
    'focus-visible:border-custom-outline focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:ring-offset-1 focus-visible:ring-offset-ring-offset',
  ],
  {
    variants: {
      variant: {
        default: ['bg-primary text-primary-foreground', '[a&]:hover:bg-[image:linear-gradient(var(--alpha-80),var(--alpha-80))]'],
        secondary: 'bg-secondary text-secondary-foreground',
        outline: 'border-border bg-background text-foreground',
        destructive: [
          // Fill custom/destructive-dark:destructive\60, text tailwind-colors/base/white.
          'bg-custom-destructive-60 text-white',
          // Hover custom/destructive-dark:destructive\90 — identical to the fill in light mode.
          'dark:[a&]:hover:bg-destructive/90',
          // Ring custom/destructive\20-dark:destructive\40.
          'focus-visible:ring-custom-destructive-20/50 dark:focus-visible:ring-custom-destructive-40/50',
        ],
        // Figma "Variant=Color": a "Shape" layer (tailwind-colors/{c}/400 under an alpha/50 overlay, layer opacity 20%,
        // stroke drawn 1px outside the box), an inner alpha/50 "Ring" and tailwind-colors/{c}/900 text. Over the page
        // that is {c}-400 @ 10% fill, a {c}-400 @ 20% outer edge (ring-1) and a white 50% inner border.
        // Figma has no dark Color variant and those variables are not mode-aware, so dark mode switches to the
        // custom/hues/{c}-* tokens (background-subtle fill, background edge, foreground text) and drops the white ring.
        color: ['border-alpha-50 ring-1', 'dark:border-transparent'],
      },
      color: {
        neutral:
          'bg-neutral-400/10 text-neutral-900 ring-neutral-400/20 dark:bg-custom-hues-neutral-background-subtle dark:text-custom-hues-neutral-foreground dark:ring-custom-hues-neutral-background',
        red:
          'bg-red-400/10 text-red-900 ring-red-400/20 dark:bg-custom-hues-red-background-subtle dark:text-custom-hues-red-foreground dark:ring-custom-hues-red-background',
        orange:
          'bg-orange-400/10 text-orange-900 ring-orange-400/20 dark:bg-custom-hues-orange-background-subtle dark:text-custom-hues-orange-foreground dark:ring-custom-hues-orange-background',
        amber:
          'bg-amber-400/10 text-amber-900 ring-amber-400/20 dark:bg-custom-hues-amber-background-subtle dark:text-custom-hues-amber-foreground dark:ring-custom-hues-amber-background',
        yellow:
          'bg-yellow-400/10 text-yellow-900 ring-yellow-400/20 dark:bg-custom-hues-yellow-background-subtle dark:text-custom-hues-yellow-foreground dark:ring-custom-hues-yellow-background',
        lime:
          'bg-lime-400/10 text-lime-900 ring-lime-400/20 dark:bg-custom-hues-lime-background-subtle dark:text-custom-hues-lime-foreground dark:ring-custom-hues-lime-background',
        green:
          'bg-green-400/10 text-green-900 ring-green-400/20 dark:bg-custom-hues-green-background-subtle dark:text-custom-hues-green-foreground dark:ring-custom-hues-green-background',
        emerald:
          'bg-emerald-400/10 text-emerald-900 ring-emerald-400/20 dark:bg-custom-hues-emerald-background-subtle dark:text-custom-hues-emerald-foreground dark:ring-custom-hues-emerald-background',
        teal:
          'bg-teal-400/10 text-teal-900 ring-teal-400/20 dark:bg-custom-hues-teal-background-subtle dark:text-custom-hues-teal-foreground dark:ring-custom-hues-teal-background',
        cyan:
          'bg-cyan-400/10 text-cyan-900 ring-cyan-400/20 dark:bg-custom-hues-cyan-background-subtle dark:text-custom-hues-cyan-foreground dark:ring-custom-hues-cyan-background',
        blue:
          'bg-blue-400/10 text-blue-900 ring-blue-400/20 dark:bg-custom-hues-blue-background-subtle dark:text-custom-hues-blue-foreground dark:ring-custom-hues-blue-background',
        indigo:
          'bg-indigo-400/10 text-indigo-900 ring-indigo-400/20 dark:bg-custom-hues-indigo-background-subtle dark:text-custom-hues-indigo-foreground dark:ring-custom-hues-indigo-background',
        violet:
          'bg-violet-400/10 text-violet-900 ring-violet-400/20 dark:bg-custom-hues-violet-background-subtle dark:text-custom-hues-violet-foreground dark:ring-custom-hues-violet-background',
        purple:
          'bg-purple-400/10 text-purple-900 ring-purple-400/20 dark:bg-custom-hues-purple-background-subtle dark:text-custom-hues-purple-foreground dark:ring-custom-hues-purple-background',
        fuchsia:
          'bg-fuchsia-400/10 text-fuchsia-900 ring-fuchsia-400/20 dark:bg-custom-hues-fuchsia-background-subtle dark:text-custom-hues-fuchsia-foreground dark:ring-custom-hues-fuchsia-background',
        pink:
          'bg-pink-400/10 text-pink-900 ring-pink-400/20 dark:bg-custom-hues-pink-background-subtle dark:text-custom-hues-pink-foreground dark:ring-custom-hues-pink-background',
        rose:
          'bg-rose-400/10 text-rose-900 ring-rose-400/20 dark:bg-custom-hues-rose-background-subtle dark:text-custom-hues-rose-foreground dark:ring-custom-hues-rose-background',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>

export function Badge({
  className,
  variant,
  color,
  asChild = false,
  ...props
}: Omit<React.ComponentProps<'span'>, 'color'> & {
  /** Figma "Variant". Defaults to `color` when a `color` is given, otherwise `default`. */
  variant?: BadgeVariant
  /** Figma "Color" — only used by `variant="color"`. */
  color?: BadgeColor
  /** Render the child element (e.g. a link) with badge styles instead of a `<span>`. */
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : 'span'
  const resolvedVariant: BadgeVariant = variant ?? (color ? 'color' : 'default')
  const resolvedColor = resolvedVariant === 'color' ? (color ?? 'neutral') : undefined

  return (
    <Comp
      data-slot="badge"
      data-variant={resolvedVariant}
      data-color={resolvedColor}
      className={cn(badgeVariants({ variant: resolvedVariant, color: resolvedColor }), className)}
      {...props}
    />
  )
}

/** Figma: Badge Number — a pill-shaped counter. Same variants and states as Badge, without Color. */
export function BadgeNumber({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & {
  /** Figma "Variant". */
  variant?: Exclude<BadgeVariant, 'color'>
  /** Render the child element (e.g. a link) with badge styles instead of a `<span>`. */
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : 'span'

  return (
    <Comp
      data-slot="badge-number"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), 'min-w-5 rounded-full px-1', className)}
      {...props}
    />
  )
}
