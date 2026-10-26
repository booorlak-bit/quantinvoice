'use client'

import * as React from 'react'
import { Tooltip as TooltipPrimitive } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

// Figma: Tooltip (18:2076) — Side=Top | Bottom | Left | Right | None × Appearance=Dark | Light,
// booleans Show title / Show description / Show hotkey.
// px-3 · py-2 · gap-1 · rounded-lg · max-w-sm (384px) · shadow/md (as a drop-shadow so the arrow casts it too).
// Title text-sm/leading-normal/medium, description text-xs/leading-normal/medium (gap 2px → gap-0.5), and the
// text wraps with word-break: break-word (→ wrap-break-word).
// Side maps to Radix `side`; Side=None is `arrow={false}`. The arrow is the protruding half of a 10px
// square turned 45° → a 12×6 triangle in the bubble colour.
const tooltipContentVariants = cva(
  [
    'z-50 flex w-fit max-w-sm origin-(--radix-tooltip-content-transform-origin) items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium wrap-break-word',
    'drop-shadow-[var(--shadow-md-1-offset-x)_var(--shadow-md-1-offset-y)_calc(var(--shadow-md-1-blur-radius)/2)_var(--shadow-md-1-color),var(--shadow-md-2-offset-x)_var(--shadow-md-2-offset-y)_calc(var(--shadow-md-2-blur-radius)/2)_var(--shadow-md-2-color)]',
    'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
    'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
  ],
  {
    variants: {
      appearance: {
        // base/sidebar-foreground bubble, base/primary-foreground title. In dark mode the bubble turns
        // near-white and base/primary-foreground resolves to the same near-white (the Figma dark render loses
        // the title), so the title switches to base/background there, and a Kbd hotkey gets a base/background
        // cap so its base/foreground label stays readable.
        dark: [
          'bg-sidebar-foreground text-primary-foreground',
          'dark:text-background dark:**:data-[slot=kbd]:bg-background',
        ],
        // Figma binds the Light title to base/sidebar-foreground (Bottom / Left / Right / None; Top uses
        // base/foreground, which resolves to the same value in every theme and mode).
        light: 'bg-card text-sidebar-foreground',
      },
    },
    defaultVariants: {
      appearance: 'dark',
    },
  },
)

const tooltipArrowVariants = cva('z-50', {
  variants: {
    appearance: {
      dark: 'fill-sidebar-foreground',
      light: 'fill-card',
    },
  },
  defaultVariants: {
    appearance: 'dark',
  },
})

const tooltipDescriptionVariants = cva('text-xs font-medium', {
  variants: {
    appearance: {
      dark: 'text-muted',
      light: 'text-muted-foreground',
    },
  },
  defaultVariants: {
    appearance: 'dark',
  },
})

type TooltipAppearance = NonNullable<VariantProps<typeof tooltipContentVariants>['appearance']>

const TooltipAppearanceContext = React.createContext<TooltipAppearance>('dark')

export function TooltipProvider({ delayDuration = 0, ...props }: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" delayDuration={delayDuration} {...props} />
}

export function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  )
}

export function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

export function TooltipContent({
  className,
  appearance = 'dark',
  arrow = true,
  sideOffset = 7,
  container,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content> &
  VariantProps<typeof tooltipContentVariants> & {
    /** Show the arrow. `false` is Figma's Side=None. */
    arrow?: boolean
    /** Element to portal into (defaults to document.body). */
    container?: React.ComponentProps<typeof TooltipPrimitive.Portal>['container']
  }) {
  const resolved = appearance ?? 'dark'
  return (
    <TooltipPrimitive.Portal container={container}>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        data-appearance={resolved}
        sideOffset={sideOffset}
        className={cn(tooltipContentVariants({ appearance: resolved }), className)}
        {...props}
      >
        <TooltipAppearanceContext.Provider value={resolved}>{children}</TooltipAppearanceContext.Provider>
        {arrow && (
          <TooltipPrimitive.Arrow
            data-slot="tooltip-arrow"
            width={12}
            height={6}
            className={tooltipArrowVariants({ appearance: resolved })}
          />
        )}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

/** Stacks a title and a description (Figma "Text" layer). */
export function TooltipHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="tooltip-header" className={cn('flex min-w-0 flex-col gap-0.5', className)} {...props} />
}

export function TooltipTitle({ className, ...props }: React.ComponentProps<'p'>) {
  return <p data-slot="tooltip-title" className={cn('text-sm font-medium', className)} {...props} />
}

export function TooltipDescription({ className, ...props }: React.ComponentProps<'p'>) {
  const appearance = React.useContext(TooltipAppearanceContext)
  return (
    <p data-slot="tooltip-description" className={cn(tooltipDescriptionVariants({ appearance }), className)} {...props} />
  )
}

export { tooltipContentVariants }
