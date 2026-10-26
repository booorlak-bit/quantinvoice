import * as React from 'react'
import { Slot } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

/*
 * No Figma component — shadcn's ButtonGroup, derived from the joined Toggle Group (16:607, playground 16:952 / 16:953)
 * and Button (4:1696):
 *   Joined   children touch (no gap); only the outer corners keep their radius, inner corners are squared and
 *            neighbours share one stroke (the toggle group's -1px overlap = shadcn's border-l-0 / border-t-0 here).
 *            Every child keeps its own variant, size, radius, stroke and shadow, so a group of outline Buttons reads as
 *            one segmented control: 0.5px base/input stroke, custom/background dark:input\30 fill, shadow/sm.
 *   Focus    the focused child is lifted (z-10) so its focus ring / inside outline is never covered by a neighbour.
 *   Nested   groups inside a group are spaced spacing/2 (8px) apart instead of joined.
 * ButtonGroupText    a joined, non-interactive segment styled like the outline Button it sits next to:
 *                    base/muted fill · 0.5px base/input stroke · rounded-lg · shadow/sm · spacing/3 sides ·
 *                    text-sm/leading-normal/medium · 16px base/muted-foreground icons.
 * ButtonGroupSeparator  a 1px base/border line between buttons that have no stroke of their own (secondary, ghost,
 *                    default). shadcn paints it with base/input, but here base/input is a 5% fill — the same as the
 *                    secondary fill — so it would vanish between secondary buttons; base/border (the Separator token)
 *                    stays visible in light and dark.
 * There are no states of its own: hover / focus / pressed / disabled belong to the children.
 */
export const buttonGroupVariants = cva(
  [
    'flex w-fit items-stretch',
    '[&>*]:focus-visible:relative [&>*]:focus-visible:z-10',
    "[&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",
    // Radix Select renders a hidden native <select> after its trigger, so the trigger is not :last-child.
    'has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-lg',
    'has-[>[data-slot=button-group]]:gap-2',
  ],
  {
    variants: {
      orientation: {
        horizontal:
          '[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none',
        vertical:
          'flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
    },
  },
)

export function ButtonGroup({
  className,
  orientation = 'horizontal',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof buttonGroupVariants>) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  )
}

export function ButtonGroupText({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'div'> & {
  /** Render the child element (e.g. a <Label>) with the text segment styles. */
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : 'div'

  return (
    <Comp
      data-slot="button-group-text"
      className={cn(
        'flex items-center gap-2 rounded-lg border-[0.5px] border-input bg-muted px-3 text-sm font-medium text-foreground shadow-sm',
        "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  )
}

export function ButtonGroupSeparator({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn('relative m-0! self-stretch bg-border data-[orientation=vertical]:h-auto', className)}
      {...props}
    />
  )
}
