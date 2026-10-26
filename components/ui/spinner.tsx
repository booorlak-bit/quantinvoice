import * as React from 'react'
import { IconLoadingCircle } from 'central-icons'

import { cn } from '@/lib/utils'

/*
 * No Figma component: Spinner is the Button loading spinner (Button, State=Loading → "Icon / LoaderCircle"),
 * a 16px (size-4) Central Icons LoadingCircle spinning with animate-spin.
 * Colour is currentColor, like the icon in the button: it follows the text colour of its parent, so inside an
 * outline / secondary / ghost Button it picks up their muted icon colour and on primary it is primary-foreground.
 * Set text-* and size-* on it to change colour and size.
 */

/** shadcn/ui Spinner. An `svg` with role="status" and an accessible name ("Loading" unless you pass `aria-label`). */
export function Spinner({ className, ...props }: Omit<React.ComponentProps<'svg'>, 'mode'>) {
  return (
    <IconLoadingCircle
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn('size-4 shrink-0 animate-spin', className)}
      {...props}
    />
  )
}
