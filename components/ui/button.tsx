import * as React from 'react'
import { Slot } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { IconLoadingCircle } from 'central-icons'

import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap outline-none transition-[color,background-color,border-color,box-shadow,opacity]',
    // Pressed / disabled are the same for every variant in Figma.
    'active:opacity-80 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    // While loading, the spinner takes the place of a leading icon.
    '[&>[data-slot=button-spinner]+svg]:hidden',
  ],
  {
    variants: {
      variant: {
        // Figma's Pressed is the *default* look at 80% opacity. A real press is also a hover, so each variant with a
        // hover change resets it under active: (active rules come after hover rules in the stylesheet).
        default: [
          'border border-alpha-80 bg-primary text-primary-foreground shadow-sm text-shadow-xs',
          'hover:bg-[image:linear-gradient(var(--alpha-90),var(--alpha-90))] active:bg-none',
          'focus-visible:shadow-focus',
        ],
        destructive: [
          'bg-custom-destructive-60 text-destructive-foreground shadow-xs',
          'dark:hover:bg-destructive/90 dark:active:bg-custom-destructive-60',
          'focus-visible:shadow-focus-destructive',
        ],
        outline: [
          'border-[0.5px] border-input bg-custom-background-dark-input-30 text-foreground shadow-sm',
          'hover:border-border hover:bg-secondary active:border-input active:bg-custom-background-dark-input-30',
          // 1px ring drawn inside the edge (a Figma inside stroke) so focus never shifts the layout.
          'focus-visible:shadow-focus focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-ring focus-visible:outline-solid',
          "[&_svg:not([class*='text-'])]:text-muted-foreground",
        ],
        secondary: [
          'bg-secondary text-secondary-foreground backdrop-blur-md',
          'focus-visible:shadow-focus focus-visible:outline-(length:--border-1) focus-visible:-outline-offset-(length:--border-1) focus-visible:outline-ring focus-visible:outline-solid',
          "[&_svg:not([class*='text-'])]:text-muted-foreground",
        ],
        ghost: [
          'text-foreground',
          'hover:bg-secondary hover:backdrop-blur-md active:bg-transparent active:backdrop-blur-none',
          'focus-visible:shadow-focus',
          "[&_svg:not([class*='text-'])]:text-muted-foreground",
        ],
        link: [
          'text-primary decoration-from-font underline-offset-auto',
          'hover:underline active:no-underline',
          'focus-visible:shadow-focus',
        ],
      },
      size: {
        default: 'h-8 rounded-lg px-3',
        sm: 'h-7 gap-1 rounded-md px-2 text-xs leading-none',
        lg: 'h-9 rounded-md px-8',
        icon: 'size-8 rounded-lg',
        'icon-sm': 'size-7 rounded-md',
        'icon-xs': "size-6 rounded-sm [&_svg:not([class*='size-'])]:size-3",
        // Not a Figma size: shadcn's name for the square lg button (the lg height and radius), kept for API parity.
        'icon-lg': 'size-9 rounded-md',
      },
      loading: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      // The primary button also dims its label (not the spinner) while loading.
      {
        variant: 'default',
        loading: true,
        className: 'text-primary-foreground/50 [&_[data-slot=button-spinner]]:text-primary-foreground',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default',
      loading: false,
    },
  },
)

/**
 * A slotted link has no native disabled state. Besides aria-disabled (styled like disabled, no pointer events) it
 * leaves the Tab order and cancels activation from the keyboard or a screen reader's virtual click: the capture
 * handler runs before any onClick of the child (e.g. a router link) and stops the click there, like a disabled button.
 */
function cancelDisabledClick(event: React.MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
}

export function Button({
  className,
  variant = 'default',
  size = 'default',
  loading = false,
  asChild = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    /** Shows a spinner, sets `aria-busy` and blocks interaction. */
    loading?: boolean
    /** Render the child element (e.g. a link) with button styles instead of a `<button>`. */
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'
  const isDisabled = Boolean(disabled || loading)
  // With asChild, `disabled` or an explicit aria-disabled both mean a disabled slotted element.
  const slotDisabled = asChild && (isDisabled || props['aria-disabled'] === true || props['aria-disabled'] === 'true')

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      disabled={asChild ? undefined : isDisabled}
      className={cn(buttonVariants({ variant, size, loading, className }))}
      {...props}
      // A slotted link has no native disabled state: aria-disabled (styled the same), out of the Tab order, no clicks.
      {...(slotDisabled ? { 'aria-disabled': true, tabIndex: -1, onClickCapture: cancelDisabledClick } : {})}
    >
      {loading && <IconLoadingCircle data-slot="button-spinner" aria-hidden="true" className="animate-spin" />}
      <Slot.Slottable>{children}</Slot.Slottable>
    </Comp>
  )
}
